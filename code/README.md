# Code

This directory contains the runnable Motivo implementation: the native compiler, the Motivo Studio API server, the web client, and the Motivo Studio Docker Compose stack that ties them together.

## Layout

```text
code/
|-- compiler/           C++23 compiler and test suite
|-- server/             Motivo Studio API backend
|-- client/             Motivo Studio web client
|-- nginx/              Motivo Studio gateway for the composed app
|-- docker-compose.yml  Production-like local stack
`-- Makefile            Thin Docker Compose wrapper
```

## Docker Compose

The Compose project is named `motivo-studio` and defines these services:

- `motivo-studio-db` - PostgreSQL database for accounts, sessions, and saved Motivo files.
- `motivo-studio-server` - Express API backend with `motivoc` embedded in the image.
- `motivo-studio-client` - Next.js frontend.
- `motivo-studio-gateway` - nginx HTTPS gateway and local load balancer.

From this directory:

```sh
make up
make down
```

`make up` runs `docker compose up --build`. The server image builds the C++ compiler first and embeds the `motivoc` binary at `/usr/local/bin/motivoc`; the client proxies `/api/*` requests to `motivo-studio-server` inside the Compose network.
The server runs database migrations before startup. PostgreSQL is exposed on `localhost:5432` with the development credentials from `docker-compose.yml`.

The nginx gateway exposes the stack at `https://motivo-studio.local`. Add the hostname locally before opening the app:

```sh
grep -qxF '127.0.0.1 motivo-studio.local' /etc/hosts || echo '127.0.0.1 motivo-studio.local' | sudo tee -a /etc/hosts
```

The gateway image creates a self-signed certificate for `motivo-studio.local`, so browsers will show the usual local-certificate warning until it is trusted.

## Accounts and Files

Motivo Studio now supports optional email/password accounts. Authenticated users can create, rename, delete, download, and autosave multiple Motivo files backed by PostgreSQL. The editor no longer persists Motivo source in `localStorage`; unauthenticated users can still use the editor as scratch space and open the frontend-owned bundled read-only examples.

The only browser-local persistence is UI preference state such as dark/light theme.

## Component Development

Use the component READMEs for local workflows:

- `compiler/README.md` - CMake, tests, coverage, formatting, and examples.
- `server/README.md` - Node setup, environment variables, API routes, and tests.
- `client/README.md` - Next.js setup, scripts, API proxying, and tests.

## CI Entry Points

The compiler workflow calls `make ci-static`, `make ci-build`, `make ci-test`, and `make ci-package` from `compiler/`. The server and client workflows use their npm scripts directly.
