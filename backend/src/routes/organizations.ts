import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import pool from '../db/index';

const router = Router();

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  const userId = req.user!.id;

  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const orgResult = await client.query(
      'INSERT INTO organizations (name, owner_id) VALUES ($1, $2) RETURNING *',
      [name, userId]
    );
    const org = orgResult.rows[0];

    await client.query(
      'INSERT INTO memberships (user_id, organization_id, role) VALUES ($1, $2, $3)',
      [userId, org.id, 'admin']
    );

    await client.query('COMMIT');
    res.status(201).json({ organization: org });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    const result = await pool.query(
      `SELECT o.id, o.name, o.owner_id, o.created_at, m.role
       FROM organizations o
       JOIN memberships m ON m.organization_id = o.id
       WHERE m.user_id = $1
       ORDER BY o.created_at DESC`,
      [userId]
    );
    res.json({ organizations: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/members', authenticate, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  try {
    const memberCheck = await pool.query(
      'SELECT id FROM memberships WHERE organization_id = $1 AND user_id = $2',
      [id, userId]
    );
    if (memberCheck.rows.length === 0) {
      res.status(403).json({ error: 'Not a member of this organization' });
      return;
    }

    const result = await pool.query(
      `SELECT u.id, u.name, u.email, m.role, m.created_at as joined_at
       FROM memberships m
       JOIN users u ON u.id = m.user_id
       WHERE m.organization_id = $1
       ORDER BY m.created_at ASC`,
      [id]
    );
    res.json({ members: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
