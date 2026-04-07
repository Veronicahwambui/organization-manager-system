import pool from './index';

const schema = `
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";

  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL DEFAULT 'member',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, organization_id)
  );

  CREATE TABLE IF NOT EXISTS invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(64) UNIQUE NOT NULL,
    role VARCHAR(10) NOT NULL DEFAULT 'member',
    invited_by UUID REFERENCES users(id),
    accepted BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );
`;

export async function runMigrations() {
  try {
    await pool.query(schema);
    console.log('Database migrations ran successfully');
  } catch (err) {
    console.error('Migration error:', err);
    throw err;
  }
}
