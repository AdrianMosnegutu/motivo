# Motivo Studio Server

Express API backend for Motivo Studio. The server accepts Motivo source code, invokes the native `motivoc` compiler, and returns either MIDI bytes or structured diagnostics.
It also owns account authentication, HTTP-only sessions, and PostgreSQL-backed Motivo file storage.

## Requirements

- Node.js 20 or newer
- npm
- A built `motivoc` binary for real compile requests
- PostgreSQL 16 or compatible

In Docker, the compiler is built into the image and installed at `/usr/local/bin/motivoc`; Compose also starts PostgreSQL and runs migrations before the API server starts.

## Setup

```sh
npm install
cp .env.example .env
```

Common environment variables:

```sh
PORT=3001
HOSTNAME=0.0.0.0
COMPILER_BIN=/usr/local/bin/motivoc
DATABASE_URL=postgres://motivo:motivo@localhost:5432/motivo_studio
SESSION_COOKIE_NAME=motivo_session
SESSION_COOKIE_SECURE=false
SESSION_SECRET=change-me-in-production
SESSION_TTL_SECONDS=2592000
```

For local development outside Docker, set `COMPILER_BIN` to your local compiler binary, usually `../compiler/build/apps/motivoc`.
Start PostgreSQL separately, then run migrations with `npm run db:migrate` before using account or file routes.

## Scripts

```sh
npm run dev            # Start the server with tsx watch
npm run build          # Compile TypeScript to dist/
npm start              # Run the compiled server
npm run db:migrate     # Apply PostgreSQL migrations
npm test               # Run tests
npm run test:coverage  # Run tests with coverage
npm run typecheck      # Check TypeScript types
npm run lint           # Run ESLint
npm run format:check   # Check Prettier formatting
npm run ci             # Static checks, CI tests, build, and package image
```

## API

- `GET /health` returns `{ "status": "ok" }`.
- `POST /compile` accepts `{ "source": "..." }`.
- `POST /auth/register` creates an email/password account and starts a session.
- `POST /auth/login` starts a session for an existing account.
- `POST /auth/logout` clears the active session.
- `GET /auth/me` returns the authenticated account or `null`.
- `GET /files` lists the authenticated user's saved Motivo files.
- `POST /files` creates a named Motivo file.
- `GET /files/:id` opens a saved file and updates its last-opened metadata.
- `PATCH /files/:id` renames and/or autosaves source.
- `DELETE /files/:id` permanently deletes a file.
- `GET /files/:id/download` returns the `.motivo` source file.

Successful compile responses are MIDI binary data with `Content-Type: audio/midi`. Compilation failures return diagnostics with severity, stage, message, and optional source location.
File names are unique per account; duplicate names return a conflict error.

## Structure

```text
src/
|-- app.ts              Express app setup
|-- server.ts           Runtime entrypoint
|-- config/             Environment configuration
|-- controllers/        HTTP request handling
|-- db/                 PostgreSQL pool, migrations, and repositories
|-- middleware/         Validation and error handling
|-- routes/             Route registration
|-- schemas/            Zod request schemas
`-- services/           Compiler, auth, and file-domain services
tests/
|-- integration/        Supertest API tests
|-- unit/               Focused unit tests
`-- helpers/            Shared test utilities
```

Tests use fake compiler binaries where possible, so the native compiler does not need to be built for most server tests.
