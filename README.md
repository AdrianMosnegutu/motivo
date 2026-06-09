# Motivo

Motivo is a music composition language with a native compiler and Motivo Studio, a web editor for compiling, visualizing, and playing Motivo programs.

This project is also my bachelor thesis implementation. The accompanying paper remains under its academic title, **Design and Implementation of a Domain-Specific Language for Music Composition**.

The project has these main parts:

- `paper/` - LaTeX source for the written thesis.
- `code/compiler/` - C++23 compiler for Motivo.
- `code/server/` and `code/client/` - Motivo Studio backend and frontend.
- `experiments/` - reproducible compiler benchmark suite backing the thesis evaluation.

## Repository Layout

```text
.
|-- paper/             Thesis source, bibliography, style file, and paper scripts
|-- code/
|   |-- compiler/      Native Motivo compiler and tests
|   |-- server/        Express API that wraps motivoc
|   |-- client/        Motivo Studio Next.js app
|   |-- nginx/         Motivo Studio HTTPS gateway
|   `-- docker-compose.yml
|-- experiments/       Reproducible compiler benchmark suite (evaluation)
`-- .github/           CI workflows and report summarizers
```

## Experiments

The `experiments/` module reproduces the thesis evaluation (the v1-vs-v2 comparison on the
B1-B3 fixtures) and extends it with stress and general-case benchmark suites. Run the whole
thing with:

```sh
cd experiments
make run
```

This builds the compilers (current `motivoc` plus the v1/v2 tags), runs every suite, and writes
`SUMMARY.md` + `results.csv` under `experiments/results/`. See `experiments/README.md` for
details.

## Quick Start

Run the complete application stack with Docker Compose:

```sh
cd code
make up
```

The stack builds the compiler into the server image, starts the Next.js client, and exposes Motivo Studio through the nginx gateway at `https://motivo-studio.local`.

Map the local hostname once before using the HTTPS endpoint:

```sh
grep -qxF '127.0.0.1 motivo-studio.local' /etc/hosts || echo '127.0.0.1 motivo-studio.local' | sudo tee -a /etc/hosts
```

The local gateway uses a self-signed certificate, so your browser may ask you to trust it for local development.

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
- `experiments/README.md`

## CI

GitHub Actions runs separate workflows for the paper, compiler, server, and client. The workflows build the paper PDF, check compiler formatting/build/tests/package, and run web linting, type checks, tests, builds, and Docker image packaging.
