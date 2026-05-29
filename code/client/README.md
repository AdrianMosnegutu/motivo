# Motivo Studio Client

Next.js editor for writing Motivo programs, compiling them through the server, visualizing generated MIDI, and controlling playback.
Authenticated users can also manage multiple saved Motivo files through the file explorer.

## Requirements

- Node.js 20 or newer
- npm
- A running API server for real compile requests

## Setup

```sh
npm install
npm run dev
```

The development server runs at `http://localhost:3000`. By default, `/api/*` requests are proxied to `http://localhost:3001`.

To point the client at another API server:

```sh
API_PROXY_URL=http://localhost:3001 npm run dev
```

## Scripts

```sh
npm run dev            # Start the Next.js dev server
npm run build          # Build the production app
npm start              # Run the production server
npm test               # Run Vitest in watch mode
npm run test:run       # Run tests once
npm run test:coverage  # Run tests with coverage
npm run typecheck      # Check TypeScript types
npm run lint           # Run ESLint
npm run format:check   # Check Prettier formatting
npm run ci             # Static checks, CI tests, build, and package image
```

## Structure

```text
src/
|-- app/                Next.js app shell and global styles
|-- config/             App constants and routes
|-- features/
|   |-- compile/        API client and diagnostic mapping
|   |-- editor/         Monaco Motivo editor integration
|   |-- auth/           Account state and login/register UI
|   |-- examples/       Bundled read-only Motivo examples
|   |-- files/          File explorer, API client, downloads, autosave
|   |-- ide/            Main workspace layout and workflow hooks
|   |-- midi/           MIDI parsing and context
|   |-- piano-roll/     Piano-roll visualization
|   `-- playback/       Playback controls and audio helpers
`-- shared/             Shared UI components
tests/
|-- integration/        Component-level integration tests
`-- unit/               Utility and hook tests
```

## API Proxy

`next.config.ts` rewrites `/api/:path*` to `API_PROXY_URL`, falling back to `NEXT_PUBLIC_API_URL` and then `http://localhost:3001`. Docker Compose sets this to the internal server URL automatically.

## Persistence Model

Motivo source is not stored in `localStorage`. Authenticated user files are saved through `/api/files` with debounced autosave; unauthenticated editor content is scratch-only. Bundled examples are available to every user as read-only documents, and dark/light theme preference remains browser-local.
