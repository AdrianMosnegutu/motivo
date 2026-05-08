# Motivo Compiler

C++23 compiler for the Motivo music language. It parses Motivo source, performs semantic analysis, lowers the program into an internal musical representation, and writes MIDI output through the `motivoc` command-line tool.

## Requirements

- CMake 3.20 or newer
- A C++23 compiler
- Flex 2.6 or newer
- Bison 3.8 or newer
- Make
- `lcov` and `genhtml` for coverage reports
- `clang-format` for formatting

## Build And Run

```sh
make build
make run
```

`make run` compiles and runs `examples/example.motivo` through `build/apps/motivoc`.

To use another example:

```sh
make run EXAMPLE=examples/fur_elise.motivo
```

## Tests And Coverage

```sh
make test
make test COVERAGE=ON
make coverage
```

`make test` builds the compiler and runs the full CTest suite. Coverage builds use `build-coverage/` and write an HTML report to `build-coverage/coverage-html/index.html`.

## Other Useful Targets

```sh
make compile-commands
make format
make clean
make coverage-clean
```

`make compile-commands` configures CMake and symlinks `compile_commands.json` into the project root for clangd, CLion, or VS Code.

## Structure

```text
apps/          motivoc command-line entrypoint
docs/          grammar and lexical references
examples/      sample Motivo programs
include/       public compiler API headers
src/           parser, semantic analysis, lowering, and MIDI writer
tests/         unit, integration, and golden tests
cmake/         local CMake helpers
```

## CI Targets

The GitHub compiler workflow uses:

```sh
make ci-static
make ci-build
make ci-test
make ci-package
```

Keep those targets stable unless the workflow is updated at the same time.
