# Ticket Management System

## Project Description

This project is a full-stack Ticket Management System built with Next.js.

It helps teams manage support requests in one place. Users can sign up, log in, create tickets, and track their ticket statuses. Administrators can view all tickets, review users, and manage ticket workflows from an admin dashboard.

The problem it solves:

- Support requests are often scattered across chat, emails, and calls.
- Tracking ownership and status becomes difficult.
- This system provides a structured, trackable workflow for support tickets.

## Features

- User authentication (signup and login)
- Ticket creation and tracking
- Admin dashboard for ticket and user management
- Role-based access control (user/admin)
- Ticket sorting from newest to oldest
- Ticket ID tracking for reference and support workflow
- API-based data handling with Next.js route handlers

## Tech Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Next.js API Routes (`src/app/api/**/route.ts`)
- Manta table storage (database layer)

Why this stack:

- Next.js provides frontend + backend in one codebase.
- TypeScript improves reliability with static typing.
- API routes keep business logic server-side and secure.
- Tailwind CSS enables fast, consistent UI styling.

## System Architecture

High-level flow:

1. Frontend pages and components collect user actions.
2. The frontend sends requests to API routes (`/api/login`, `/api/tickets`, `/api/admin/...`).
3. API routes validate input, check authentication/role, and call Manta.
4. Manta stores and returns ticket/user records.
5. API responses are rendered in user and admin dashboards.

## Folder Structure

Simplified structure:

```text
src/
   app/
      api/
         login/route.ts
         signup/route.ts
         logout/route.ts
         check-auth/route.ts
         tickets/route.ts
         tickets/[id]/route.ts
         admin/
            admin-tickets-route/route.ts
            admin-tickets-route/[ticketId]/route.ts
            admin-users-route/route.ts
      admin-dashboard/
      user-dashboard/
      login/
      signup/
   components/
      auth-provider.tsx
      create-ticket-form.tsx
      ticket-list.tsx
      admin-ticket-list.tsx
      admin-users-list.tsx
   lib/
      manta-client.ts
      server-session.ts
      ticket-number.ts
      ticket-table-resolver.ts
```

## Installation and Setup

### 1. Clone repository

```bash
git clone <your-repo-url>
cd tickly
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root and add required variables (see section below).

### 4. Run development server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Add these values to `.env`:

```env
MANTAHQ_SDK_KEY=your_manta_sdk_key
MANTA_BASE_URL=your_manta_base_url
MANTA_TICKETS_TABLE=your_ticket_table_name
```

Notes:

- `MANTAHQ_SDK_KEY`: used by the Manta SDK client.
- `MANTA_BASE_URL`: used for login/signup route requests.
- `MANTA_TICKETS_TABLE`: optional explicit ticket table name resolver.

## Usage

### User flow

1. Open landing page.
2. Sign up or log in.
3. Create a support ticket.
4. View tickets and track ticket status updates.

### Admin flow

1. Log in as an admin user.
2. Open admin dashboard.
3. View all tickets (newest first).
4. Open a single ticket and manage status/notes.
5. View and manage users.

## Screenshots or Demo

- [Landing page](docs/landing-page.png)
- [User dashboard][](docs/user-dashboard.png)
- [Admin dashboard][](docs/admin-dashboard.png)
- [Demo video](https://tickyapp.netlify.app/)
- [Live URL](https://tickyapp.netlify.app/)

## Future Improvements

- Email notifications for ticket updates
- File attachments on tickets
- Advanced analytics dashboard
- Pagination and filtering for large ticket lists
- Full-text search for tickets/users
- Audit logs for admin actions

## Author

- Name: PsalmoTee
- [GitHub](https://github.com/psalmotee)
