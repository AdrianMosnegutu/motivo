# DSL Compiler Server

Express API backend for the music DSL web IDE. The server accepts DSL source code, invokes the native `dslrc` compiler, and returns either MIDI bytes or structured diagnostics.

## Requirements

- Node.js 20 or newer
- npm
- A built `dslrc` binary for real compile requests

In Docker, the compiler is built into the image and installed at `/usr/local/bin/dslrc`.

## Setup

```sh
npm install
cp .env.example .env
```

Common environment variables:

```sh
PORT=3001
HOSTNAME=0.0.0.0
COMPILER_BIN=/usr/local/bin/dslrc
```

For local development outside Docker, set `COMPILER_BIN` to your local compiler binary, usually `../compiler/build/apps/dslrc`.

## Scripts

```sh
npm run dev            # Start the server with tsx watch
npm run build          # Compile TypeScript to dist/
npm start              # Run the compiled server
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

Successful compile responses are MIDI binary data with `Content-Type: audio/midi`. Compilation failures return diagnostics with severity, stage, message, and optional source location.

## Structure

```text
src/
|-- app.ts              Express app setup
|-- server.ts           Runtime entrypoint
|-- config/             Environment configuration
|-- controllers/        HTTP request handling
|-- middleware/         Validation and error handling
|-- routes/             Route registration
|-- schemas/            Zod request schemas
`-- services/compiler/  Compiler process integration and diagnostics
tests/
|-- integration/        Supertest API tests
|-- unit/               Focused unit tests
`-- helpers/            Shared test utilities
```

Tests use fake compiler binaries where possible, so the native compiler does not need to be built for most server tests.
