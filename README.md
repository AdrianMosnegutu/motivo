# Bachelor Thesis

This repository contains the thesis paper and implementation for **Design and Implementation of a Domain-Specific Language for Music Composition**.

The project has three main parts:

- `paper/` - LaTeX source for the written thesis.
- `code/compiler/` - C++23 compiler for the music DSL.
- `code/server/` and `code/client/` - web IDE backend and frontend for compiling, visualizing, and playing DSL programs.

## Repository Layout

```text
.
|-- paper/             Thesis source, bibliography, style file, and paper scripts
|-- code/
|   |-- compiler/      Native DSL compiler and tests
|   |-- server/        Express API that wraps the compiler
|   |-- client/        Next.js web IDE
|   |-- nginx/         Reverse proxy used by Docker Compose
|   `-- docker-compose.yml
`-- .github/           CI workflows and report summarizers
```

## Quick Start

Run the complete application stack with Docker Compose:

```sh
cd code
make up
```

The stack builds the compiler into the server image, starts the Next.js client, and exposes the app through nginx on ports `80` and `443`.

Stop the stack with:

```sh
make down
```

For component-specific development, use the README in each subdirectory:

- `paper/README.md`
- `code/README.md`
- `code/compiler/README.md`
- `code/server/README.md`
- `code/client/README.md`

## CI

GitHub Actions runs separate workflows for the paper, compiler, server, and client. The workflows build the paper PDF, check compiler formatting/build/tests/package, and run web linting, type checks, tests, builds, and Docker image packaging.
