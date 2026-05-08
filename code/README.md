# Code

This directory contains the runnable implementation for the thesis project: the native DSL compiler, the API server, the web client, and the Docker Compose stack that ties them together.

## Layout

```text
code/
|-- compiler/           C++23 compiler and test suite
|-- server/             Express API backend
|-- client/             Next.js web IDE
|-- nginx/              Reverse proxy for the composed app
|-- docker-compose.yml  Production-like local stack
`-- Makefile            Thin Docker Compose wrapper
```

## Docker Compose

From this directory:

```sh
make up
make down
```

`make up` runs `docker compose up --build`. The server image builds the C++ compiler first and embeds the `dslrc` binary at `/usr/local/bin/dslrc`; the client proxies `/api/*` requests to the server inside the Compose network.

## Component Development

Use the component READMEs for local workflows:

- `compiler/README.md` - CMake, tests, coverage, formatting, and examples.
- `server/README.md` - Node setup, environment variables, API routes, and tests.
- `client/README.md` - Next.js setup, scripts, API proxying, and tests.

## CI Entry Points

The compiler workflow calls `make ci-static`, `make ci-build`, `make ci-test`, and `make ci-package` from `compiler/`. The server and client workflows use their npm scripts directly.
