# DSL Compiler Server

Express API backend for the DSL music compiler web IDE. The server accepts DSL
source code, invokes the native `dslrc` compiler, and returns either generated
MIDI bytes or structured compile diagnostics.

## Requirements

- Node.js 20 or newer
- npm
- A built `dslrc` compiler binary for real compile requests

The compiler binary path is configured with `COMPILER_BIN`. In Docker, the
compiler is built into the image and placed at `/usr/local/bin/dslrc`.

## Setup

```sh
npm install
cp .env.example .env
```

Common environment variables:

```sh
PORT=3001
COMPILER_BIN=/usr/local/bin/dslrc
```

For local development, point `COMPILER_BIN` at your locally built compiler
binary.

## Scripts

```sh
npm run dev            # Start the server with tsx watch mode
npm run build          # Compile TypeScript to dist/
npm start              # Run the compiled server
npm test               # Run Vitest tests
npm run test:coverage  # Run tests with V8 coverage
npm run lint           # Run ESLint
npm run lint:fix       # Run ESLint autofix
npm run format         # Format source and tests with Prettier
npm run format:check   # Check Prettier formatting
```

Coverage reports are written to `coverage/` and are intentionally ignored by
Git.

## Project Structure

```text
src/
  app.ts                  Express app setup
  server.ts               Runtime entrypoint
  config/                 Environment config
  controllers/            HTTP request/response mapping
  middleware/             Validation and error middleware
  routes/                 Route registration only
  schemas/                Zod request schemas
  services/compiler/      Compiler process and diagnostic parsing
tests/
  helpers/                Shared test utilities
  integration/            Supertest app-level tests
  unit/                   Focused unit tests
```

Imports use aliases to avoid long relative paths:

- `@/*` maps to `src/*`
- `@tests/*` maps to `tests/*`

## API

### `GET /health`

Returns:

```json
{ "status": "ok" }
```

### `POST /compile`

Request body:

```json
{ "source": "track main { ... }" }
```

On success, the response body is MIDI binary data with `Content-Type:
audio/midi`.

Compilation diagnostics use the compile-only shape:

```json
{
  "kind": "error",
  "diagnostics": [
    {
      "severity": "error",
      "type": "semantic",
      "message": "unknown identifier",
      "line": 3,
      "column": 5
    }
  ]
}
```

Validation and server infrastructure failures use the standard API error shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "request validation failed",
    "details": {
      "issues": []
    }
  }
}
```

Compiler binary failures and missing output are treated as infrastructure
errors, not compilation diagnostics.

## Testing

Tests use Vitest and Supertest. Integration tests create temporary fake compiler
binaries, so the test suite does not require the native C++ compiler to be built.

Run coverage with:

```sh
npm run test:coverage
```

## Linting

ESLint is configured with type-aware TypeScript rules, Node globals, async-safety
checks, type-only import enforcement, and deterministic import ordering.

Import groups are sorted as:

1. Node built-ins
2. External packages
3. `@/*` source aliases
4. `@tests/*` test aliases
5. Relative imports
