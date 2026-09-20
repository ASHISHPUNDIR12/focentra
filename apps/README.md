# Focentra

Focentra is a collaborative focus workspace where users can create rooms, work
with a shared focus timer, and listen to synchronized room music. The `apps`
directory contains the frontend and backend applications that make up the
project.

## Features

- User registration, login, logout, and cookie-based authentication.
- Protected dashboard and focus-room pages.
- Room creation, joining, leaving, and active-member presence.
- Focus-session tracking backed by PostgreSQL.
- Real-time room updates through Socket.IO.
- Room music controlled by the room creator and played locally by each member.
- Health endpoint for deployment checks.

## Architecture

```text
┌──────────────────────┐       HTTP / cookies       ┌──────────────────────┐
│   Next.js web app    │ ─────────────────────────> │   Express API        │
│   apps/web           │                             │   apps/api           │
│                      │ <────── Socket.IO ──────── │                      │
└──────────────────────┘                             └──────────┬───────────┘
                                                                │
                                                                │ Prisma
                                                                ▼
                                                     ┌──────────────────────┐
                                                     │ PostgreSQL database  │
                                                     └──────────────────────┘
```

### Request and realtime flow

1. The browser loads the Next.js UI from `apps/web`.
2. The web app sends authenticated HTTP requests to the API in `apps/api`.
3. The API validates input, checks authentication, and uses Prisma to read or
   update PostgreSQL.
4. Socket.IO broadcasts room and presence changes to connected members.
5. The browser updates the room UI and keeps user-specific audio controls local.

## Applications

| Application | Responsibility                                                      | Local URL               |
| ----------- | ------------------------------------------------------------------- | ----------------------- |
| `apps/web`  | Next.js frontend, pages, providers, UI components, and room audio   | `http://localhost:3000` |
| `apps/api`  | Express REST API, authentication, Socket.IO, Prisma, and migrations | `http://localhost:3001` |

## Technology stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend:** Node.js 24, Express 5, TypeScript
- **Realtime:** Socket.IO
- **Database:** PostgreSQL
- **ORM and migrations:** Prisma 7
- **Authentication:** JWT stored in an HttpOnly cookie

## Project structure

```text
apps/
├── api/
│   ├── prisma/
│   │   ├── migrations/       # Versioned database migrations
│   │   └── schema.prisma     # Database models
│   └── src/
│       ├── lib/              # Shared infrastructure, including Prisma
│       ├── middleware/       # Auth, not-found, and error handling
│       ├── modules/
│       │   ├── auth/         # Registration and authentication
│       │   ├── focus/        # Focus-session routes
│       │   └── rooms/        # Room lifecycle and music routes
│       ├── realtime/         # Socket.IO server and room events
│       └── server.ts         # HTTP server entry point
└── web/
    ├── app/
    │   ├── (guest)/          # Login and registration pages
    │   ├── (protected)/      # Authenticated dashboard and room pages
    │   ├── _providers/       # Auth and Socket.IO providers
    │   ├── components/       # Reusable UI components
    │   └── lib/              # API, socket, and configuration helpers
    ├── public/               # Images, icons, and room audio
    └── scripts/              # Asset-generation scripts
```

## Prerequisites

- Node.js 24.x
- npm
- A PostgreSQL database (Neon works for hosted development and deployment)

## Local setup

Clone the repository, then install dependencies for both applications:

```sh
cd apps/api
npm ci

cd ../web
npm ci
```

Create environment files from the provided examples:

```sh
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Update `apps/api/.env` with a valid database URL and a strong `JWT_SECRET`.
Keep `CLIENT_URL=http://localhost:3000` for local development. The web app uses
`NEXT_PUBLIC_API_URL=http://localhost:3001` by default.

Apply database migrations and generate the Prisma client:

```sh
cd apps/api
npx prisma migrate deploy
npx prisma generate
```

Run the API and web app in separate terminals:

```sh
# Terminal 1
cd apps/api
npm run dev

# Terminal 2
cd apps/web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The API health check is
available at [http://localhost:3001/health](http://localhost:3001/health).

## Environment variables

### API (`apps/api/.env`)

| Variable       | Required          | Purpose                                                                               |
| -------------- | ----------------- | ------------------------------------------------------------------------------------- |
| `DATABASE_URL` | Yes               | PostgreSQL connection string used by the application                                  |
| `DIRECT_URL`   | No                | Direct PostgreSQL connection used for Prisma migrations; falls back to `DATABASE_URL` |
| `JWT_SECRET`   | Yes               | Secret used to sign authentication tokens                                             |
| `CLIENT_URL`   | Yes in production | Exact frontend origin allowed by CORS                                                 |
| `NODE_ENV`     | No                | Use `development` locally and `production` when deployed                              |
| `PORT`         | No                | API port; defaults to `3001` locally                                                  |

### Web (`apps/web/.env.local`)

| Variable              | Required | Purpose                                    |
| --------------------- | -------- | ------------------------------------------ |
| `NEXT_PUBLIC_API_URL` | Yes      | Base URL for API and Socket.IO connections |

Never commit real environment files or secrets. The `.env.example` files are
safe templates only.

## API overview

| Area           | Routes        |
| -------------- | ------------- |
| Health         | `GET /health` |
| Authentication | `/auth`       |
| Rooms          | `/v1/rooms`   |
| Focus sessions | `/v1/focus`   |

Authenticated browser requests must include credentials so the HttpOnly auth
cookie is sent. Room membership and music changes are also synchronized over
the Socket.IO connection.

## Commands

Run commands from the relevant application directory.

### API

```sh
npm run dev       # Start the TypeScript API with file watching
npm run build     # Generate Prisma client and compile TypeScript
npm start         # Start the compiled API
npm test          # Run API tests
npx prisma validate
npx prisma migrate deploy
```

### Web

```sh
npm run dev       # Start Next.js development server
npm run build     # Create a production build
npm start         # Serve the production build
npm run lint      # Run ESLint
```

## Database workflow

When the schema changes, create a migration from `apps/api` during development:

```sh
npx prisma migrate dev --name describe_the_change
```

Commit the generated migration directory. For deployment, apply committed
migrations with:

```sh
npx prisma migrate deploy
```

Do not use `migrate dev`, database reset commands, or ad-hoc schema changes
against production.

## Deployment

The API can be deployed as a Node service and the web app as a Next.js service.
Configure the production environment variables above, use the API's `PORT`
provided by the hosting platform, and set `CLIENT_URL` to the exact HTTPS
frontend origin. Run database migrations as a pre-deploy or trusted release
step before serving traffic.

The API deployment details, including the current Render configuration, are in
[`api/readme.md`](./api/readme.md). Room audio assets and their generation
instructions are in [`web/public/audio/README.md`](./web/public/audio/README.md).

## Security notes

- Keep `JWT_SECRET` long, random, and private.
- Use HTTPS in production so secure authentication cookies can be used.
- Restrict `CLIENT_URL` to the real frontend origin; do not use `*` with
  credentials.
- Validate all client input at the API boundary and do not expose database
  credentials to the web app.
