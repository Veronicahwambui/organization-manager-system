# Organization Manager System

A full-stack application for managing organizations and team memberships with JWT-based authentication.

Built with **Node.js + Express + TypeScript** (backend) and **Next.js 14 + TypeScript + Tailwind CSS** (frontend).

---

## Features

- User registration and login with JWT authentication
- Create organizations (owner auto-added as admin)
- Invite users to organizations via a shareable link
- Accept invitations by visiting the link in a browser
- View organization members and their roles (Admin / Member)
- Protected routes on both frontend and backend

---

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Backend  | Node.js, Express, TypeScript        |
| Database | PostgreSQL                          |
| Auth     | JSON Web Tokens (JWT) + bcrypt      |
| Frontend | Next.js 14, TypeScript, Tailwind CSS|

---

## Prerequisites

- Node.js 18+
- PostgreSQL running locally

---

## Setup

### 1. Database

Create a PostgreSQL database:

```sql
CREATE DATABASE orgmanager;
```

### 2. Backend

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/orgmanager
JWT_SECRET=your_super_secret_key_here
FRONTEND_URL=http://localhost:3000
```

Start the backend (migrations run automatically on startup):

```bash
npm run dev
```

The backend runs at `http://localhost:5000`.

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the frontend
npm run dev
```

The frontend runs at `http://localhost:3000`.

---

## API Reference

### Auth

| Method | Endpoint            | Auth | Description                    |
|--------|---------------------|------|--------------------------------|
| POST   | `/api/auth/register`| No   | Register user, returns JWT     |
| POST   | `/api/auth/login`   | No   | Login user, returns JWT        |

**Register body:**
```json
{ "name": "Jane Doe", "email": "jane@example.com", "password": "secret" }
```

**Login body:**
```json
{ "email": "jane@example.com", "password": "secret" }
```

**Auth response (both endpoints):**
```json
{
  "token": "<jwt>",
  "user": { "id": "<uuid>", "name": "Jane Doe", "email": "jane@example.com" }
}
```

---

### Organizations

All organization routes require `Authorization: Bearer <token>` header.

| Method | Endpoint              | Description                            |
|--------|-----------------------|----------------------------------------|
| POST   | `/api/organizations`  | Create organization (owner auto-admin) |
| GET    | `/api/organizations`  | List user's organizations              |

**Create body:**
```json
{ "name": "Acme Corp" }
```

**Create response:**
```json
{
  "organization": {
    "id": "<uuid>", "name": "Acme Corp", "owner_id": "<uuid>", "created_at": "<timestamp>"
  }
}
```

**List response:**
```json
{
  "organizations": [
    { "id": "<uuid>", "name": "Acme Corp", "owner_id": "<uuid>", "role": "admin", "created_at": "<timestamp>" }
  ]
}
```

---

### Members & Invites

| Method | Endpoint                          | Auth | Description                        |
|--------|-----------------------------------|------|------------------------------------|
| POST   | `/api/organizations/:id/invite`   | Yes  | Invite user — returns `{ link }`   |
| GET    | `/api/organizations/:id/members`  | Yes  | List members                       |
| POST   | `/api/invite/accept/:token`       | Yes  | Accept invite (logged-in user is added) |

**Invite body:**
```json
{ "email": "colleague@example.com", "role": "member" }
```

**Invite response:**
```json
{ "link": "http://localhost:3000/invite/accept/<token>" }
```

**Members list response:**
```json
{
  "members": [
    { "id": "<uuid>", "name": "Jane Doe", "email": "jane@example.com", "role": "admin", "joined_at": "<timestamp>" }
  ]
}
```

**Accept invite response:**
```json
{ "message": "Invite accepted successfully", "organization_id": "<uuid>" }
```

The invited user must have a registered account with the same email the invite was sent to. When they visit the link, they are automatically added to the organization.

---

## User Flow

1. **Register** at `/auth` → creates an account, then sign in with your credentials
2. **Dashboard** at `/dashboard` → view and create organizations
3. **Organization page** at `/organizations/:id` → see members, invite new ones
4. **Invite** → copy the returned link and paste it in a browser (logged in as the invitee)
5. **Accept** → invitee is added to the organization as the specified role

---

## Project Structure

```
organization-manager-system/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── index.ts        # PostgreSQL pool
│   │   │   └── migrate.ts      # Auto-runs schema on startup
│   │   ├── middleware/
│   │   │   └── auth.ts         # JWT verification middleware
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── organizations.ts
│   │   │   └── invites.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx                        # Redirect root
    │   │   ├── auth/page.tsx                   # Login / Register
    │   │   ├── dashboard/page.tsx              # Org list
    │   │   ├── organizations/[id]/page.tsx     # Members + invite
    │   │   └── invite/accept/[token]/page.tsx  # Accept invite
    │   ├── context/AuthContext.tsx
    │   ├── lib/api.ts
    │   └── components/
    │       ├── Navbar.tsx
    │       └── LoadingSpinner.tsx
    └── package.json
```
