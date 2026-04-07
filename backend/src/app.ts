import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import organizationRoutes from './routes/organizations';
import inviteRoutes from './routes/invites';

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/organizations', inviteRoutes);
app.use('/api/invite', inviteRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
