# DSL Compiler

C++23 compiler for the thesis music DSL. It parses DSL source, performs semantic analysis, lowers the program into an internal musical representation, and writes MIDI output through the `dslrc` command-line tool.

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

`make run` compiles and runs `examples/example.dsl` through `build/apps/dslrc`.

To use another example:

```sh
make run EXAMPLE=examples/fur_elise.dsl
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
apps/          dslrc command-line entrypoint
docs/          grammar and lexical references
examples/      sample DSL programs
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
