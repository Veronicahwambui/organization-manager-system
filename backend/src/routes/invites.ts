import { Router, Response } from 'express';
import crypto from 'crypto';
import { authenticate, AuthRequest } from '../middleware/auth';
import pool from '../db/index';

const router = Router();

router.post('/:id/invite', authenticate, async (req: AuthRequest, res: Response) => {
  const { id: organizationId } = req.params;
  const { email, role = 'member' } = req.body;
  const userId = req.user!.id;

  if (!email) {
    res.status(400).json({ error: 'email is required' });
    return;
  }

  if (!['admin', 'member'].includes(role)) {
    res.status(400).json({ error: 'role must be admin or member' });
    return;
  }

  try {
    const orgResult = await pool.query(
      'SELECT id, name FROM organizations WHERE id = $1',
      [organizationId]
    );
    if (orgResult.rows.length === 0) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    const memberCheck = await pool.query(
      "SELECT role FROM memberships WHERE organization_id = $1 AND user_id = $2",
      [organizationId, userId]
    );
    if (memberCheck.rows.length === 0 || memberCheck.rows[0].role !== 'admin') {
      res.status(403).json({ error: 'Only admins can invite members' });
      return;
    }

    const alreadyMember = await pool.query(
      `SELECT m.id FROM memberships m
       JOIN users u ON u.id = m.user_id
       WHERE m.organization_id = $1 AND u.email = $2`,
      [organizationId, email]
    );
    if (alreadyMember.rows.length > 0) {
      res.status(409).json({ error: 'User is already a member of this organization' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO invites (organization_id, email, token, role, invited_by, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [organizationId, email, token, role, userId, expiresAt]
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const link = `${frontendUrl}/invite/accept/${token}`;

    res.status(201).json({ link });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/accept/:token', authenticate, async (req: AuthRequest, res: Response) => {
  const { token } = req.params;
  const userId = req.user!.id;

  try {
    const inviteResult = await pool.query(
      'SELECT * FROM invites WHERE token = $1',
      [token]
    );

    if (inviteResult.rows.length === 0) {
      res.status(404).json({ error: 'Invite not found' });
      return;
    }

    const invite = inviteResult.rows[0];

    if (invite.accepted) {
      res.status(400).json({ error: 'Invite already accepted' });
      return;
    }

    if (new Date(invite.expires_at) < new Date()) {
      res.status(400).json({ error: 'Invite has expired' });
      return;
    }

    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
    const userEmail = userResult.rows[0]?.email ?? '';
    if (invite.email.toLowerCase() !== userEmail.toLowerCase()) {
      res.status(403).json({
        error: `This invite was sent to ${invite.email}. Please log in with that email to accept.`,
      });
      return;
    }

    const alreadyMember = await pool.query(
      'SELECT id FROM memberships WHERE user_id = $1 AND organization_id = $2',
      [userId, invite.organization_id]
    );

    if (alreadyMember.rows.length > 0) {
      res.status(400).json({ error: 'You are already a member of this organization' });
      return;
    }

    await pool.query(
      'INSERT INTO memberships (user_id, organization_id, role) VALUES ($1, $2, $3)',
      [userId, invite.organization_id, invite.role]
    );

    await pool.query('UPDATE invites SET accepted = TRUE WHERE id = $1', [invite.id]);

    res.json({ message: 'Invite accepted successfully', organization_id: invite.organization_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
