# Focentra API

After installing dependencies, apply migrations and generate the client:

```sh
npx prisma migrate deploy
npx prisma generate
npm run dev
```

The Prisma CLI and generated client use Prisma 7. The database connection is
configured by `DATABASE_URL` in `.env`. Prisma CLI commands use `DIRECT_URL`
when provided, otherwise `DATABASE_URL`.

Run room lifecycle and music authorization tests with `npm test`. These handler
tests use an in-memory database double; they do not verify PostgreSQL locking.

## Room sound

Active members can read `GET /v1/rooms/:roomId/music`. The response includes the
six-track catalog, creator ID, current track, start time, revision and server time.
Only the original creator, while actively in the room, can send
`PATCH /v1/rooms/:roomId/music` with `{ "trackId": "rain" }`. Use `null` to stop.
Arbitrary URLs and unknown tracks are rejected.

Committed changes emit `room-music` to the room's Socket.IO members. Clients also
reload state on reconnect, window focus and every 30 seconds. Revisions prevent
older responses from replacing newer selections. Each listener can mute or adjust
volume locally; blocked autoplay offers an Enable sound button.

The last selection survives the creator leaving, returning and API restarts.
Ownership always remains with the original creator. As with other rooms, the room
closes once the last active session ends; a closed room cannot be reopened.

Bundled audio and its regeneration script are documented in
`../web/public/audio/README.md`.


## Render deployment (one Node web service)

- Root Directory: `apps/api`
- Build Command: `npm ci --include=dev && npm run build`
- Start Command: `npm start`
- Health Check Path: `/health`
- Instances: one (presence and reconnect timers remain in memory).

The build generates Prisma first, then compiles source and generated client into
`dist`. The entry point is `dist/src/server.js`. Node 24.x is specified in
`package.json`; no TypeScript runner is required at runtime. Build dependencies
must be installed even with `NODE_ENV=production`.

Configure these environment variables in Render (see `.env.example`):

- `DATABASE_URL`: Neon pooled PostgreSQL connection string, including its TLS parameters.
- `DIRECT_URL`: Neon direct (non-pooler) connection string for migrations, including TLS parameters; optional fallback is `DATABASE_URL`.
- `JWT_SECRET`: a strong random secret. This replaces the old `JWT_ACCESS_SECRET`
  name; reuse the existing secret value if existing tokens should remain valid.
- `CLIENT_URL`: the exact HTTPS frontend origin, without a trailing slash or path.
- `NODE_ENV`: `production`.

Render supplies `PORT`; the existing HTTP/Socket.IO server listens on `0.0.0.0`.
Never commit the real `.env`. Local development uses `NODE_ENV=development`,
`JWT_SECRET`, and an HTTP frontend origin (default `http://localhost:3000`).

Before starting against Neon, run from `apps/api` with the target database
variables configured:

```sh
npx prisma migrate deploy
```

Use that command as Render's pre-deploy command if available, or run it manually
from a trusted environment with the backend dependencies installed. It is not
part of application startup or the build. Do not use `migrate dev`, reset, or seed
for production. Commit all intended migration files, including the existing room
music migration, along with backend changes before deploying.

After deployment, verify `/health`, login/logout, authenticated requests, room
join/leave, and Socket.IO reconnect behavior using the deployed frontend.
Frontend HTTP and Socket.IO clients must send credentials. Production cookies
remain HttpOnly and use `Secure; SameSite=None`; local cookies use `SameSite=Lax`
without Secure. Browser third-party-cookie blocking can still prevent auth across
unrelated hosting domains; use frontend/API custom domains under the same site
if that affects your users.

Local verification: `npx prisma validate`, `npm run build`, and `npm test`.
The existing tests use database doubles; they do not validate Neon connectivity
or PostgreSQL transactions. Prisma versions were retained: generation, compilation
and local smoke checks passed; live database verification remains a deployment step.

References: [Render monorepos](https://render.com/docs/monorepo-support),
[Node version selection](https://render.com/docs/node-version), and
[Prisma 7 config](https://docs.prisma.io/docs/orm/reference/prisma-config-reference).
