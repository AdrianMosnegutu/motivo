# Motivo Compiler Experiments

Reproducible benchmark suite for the thesis evaluation (Chapter 6). It (1) **reproduces** the
v1-vs-v2 comparison on the original B1–B3 fixtures and (2) **extends** the evaluation with a
stress suite and a general-case suite measured on the current compiler.

All timing uses a wall-clock harness (Python `time.perf_counter` around the compiler
subprocess, 5 warmup + 50 measured runs) plus in-process per-stage timers and an event counter
exposed under `MOTIVO_BENCHMARK=1`.

## Layout

```
experiments/
  Makefile             # build / run / aggregate / clean entry points
  harness/
    run-benchmark.sh   # CLI wrapper: parses args, calls benchmark.py
    benchmark.py       # times one fixture with one compiler -> JSON
    aggregate.py       # results dir -> SUMMARY.md + results.csv (auto-detects suite type)
    run-all.sh         # build/reuse compilers, run all suites, aggregate
  fixtures/
    reproduction/{v1,v2}/   # B1-B3 (.dsl for v1, .motivo for v2)
    stress/                 # synthetic worst-cases, all <= 20000-event cap
      scaling/  nesting/  voices/  chords/  expr/  cap/
    general/                # real compositions (Fur Elise, Come As You Are, Pirates, example)
  results/                              # generated, git-ignored; regenerate with run-all.sh
    reproduction/  stress/  general/    # SUMMARY.md + results.csv + per-fixture JSON
```

Results are reproducible artifacts and are **not** versioned (see `.gitignore`); run the
harness to (re)generate them.

## Prerequisites

- CMake ≥ 3.x, a C++23 compiler, and GNU `bison`/`flex` (on macOS: `brew install bison flex`;
  the build picks them up from `/opt/homebrew/opt/{bison,flex}/bin`).
- `python3` (standard library only — no third-party packages).

## Make targets

From `experiments/`:

| Target | Action |
|--------|--------|
| `make build` | Build the current `motivoc` (Release) with benchmark instrumentation compiled in. |
| `make run` | Build/reuse all compilers, run every suite, and aggregate (wraps `run-all.sh`). |
| `make aggregate` | Regenerate `SUMMARY.md` + `results.csv` from existing JSON (no recompile). |
| `make clean` | Remove generated `results/` and stray `*.mid`. |
| `make distclean` | `clean` plus removing the experiment build dirs and the v1/v2 tag worktrees. |

## One-command reproduction

```bash
cd experiments && make run          # or: bash experiments/harness/run-all.sh
```

This builds three Release compilers (reusing any that already exist), runs every suite, asserts
the over-cap fixture is rejected, and regenerates all `SUMMARY.md` + `results.csv`:

- **current `motivoc`** → `build/bench-current/apps/motivoc`, built with
  `-DMOTIVO_ENABLE_BENCHMARK=ON` so the per-stage timers and event-count emission are
  compiled in.
- **v1.0.0-base `dslrc`** and **v2.0.0-explicit-types `motivoc`** → built from git tags in
  self-contained worktrees under `build/wt-v1` and `build/wt-v2`.

To skip a build, point at an existing binary:

```bash
MOTIVOC=/path/to/motivoc DSLRC_V1=/path/to/dslrc MOTIVOC_V2=/path/to/motivoc \
  bash experiments/harness/run-all.sh
```

## Running a single fixture

```bash
bash experiments/harness/run-benchmark.sh \
  build/bench-current/apps/motivoc \
  experiments/fixtures/general/fur_elise.motivo
# options: -w warmup (5)  -n measured (50)  -j out.json  -o midi-path
```

The JSON records `mean_ms`/`stdev_ms`, per-stage means, `note_events`, `source_loc`
(non-blank lines), `events_per_loc`, and `midi_bytes`.

## Suites

| Suite | Compiler(s) | What it measures |
|-------|-------------|------------------|
| `reproduction` | v1 `dslrc` + v2 `motivoc` | Reproduces the thesis B1–B3 tables: wall clock, byte-identical MIDI, per-stage split. |
| `stress` | current `motivoc` | Worst-case throughput within the 20000-event cap. |
| `general` | current `motivoc` | Realistic medium compositions (expansion ratio + compile time). |

### Stress dimensions
- **scaling/** — flat single-note loop at 1k…20k events: empirical O(E log E) growth curve.
- **nesting/** — deep (5-level) and asymmetric nested loops at the cap: lowering frame-walking.
- **voices/** — 20 parallel tracks / 10 overlapping voices: multi-track serialization + tick-sort.
- **chords/** — 4- and 8-note chords at the cap: chord flattening, simultaneous onsets.
- **expr/** — per-note nested modulo/ternary pitch and duration: the expression evaluator.
- **cap/** — `CAP_over_20001.motivo` is an **expected failure** documenting the safety limit
  (excluded from the timed suite; `run-all.sh` asserts it is rejected).

New stress fixtures are v2-only because the real compositions and several constructs require
v2 syntax; the v1-vs-v2 comparison stays scoped to the reproduced B1–B3.

## Notes on the compiler change

The benchmark instrumentation is **compile-time gated**. The CMake option
`MOTIVO_ENABLE_BENCHMARK` (default OFF) defines the `MOTIVO_BENCHMARK` macro on the
`motivo_compiler` target; without it, the timers and the `MOTIVO_BENCHMARK_*` stderr lines
are not compiled into the binary at all (a production `motivoc` contains none of this code).
A benchmark build emits two stderr lines per compile — `MOTIVO_BENCHMARK_STAGES …` and
`MOTIVO_BENCHMARK_EVENTS note_events=<n>` — which `benchmark.py` parses.

The tagged v1/v2 binaries predate this and use the older runtime `MOTIVO_BENCHMARK=1`
env-var gate (still set by the harness), so they emit per-stage timings but no event count;
B1–B3 counts are known by construction (20000 / 9980 / 20000).

To build the current compiler with instrumentation manually:

```bash
cmake -B build/bench-current -S code/compiler -DCMAKE_BUILD_TYPE=Release \
  -DBUILD_TESTING=OFF -DMOTIVO_ENABLE_BENCHMARK=ON
cmake --build build/bench-current -j
```

## Reference machine

Results committed here were collected on an Apple M3 Pro (arm64, macOS 26.5), Release builds.
Absolute times are hardware-dependent; the **shape** (v2 ≈ v1; lowering + MIDI dominate;
monotonic growth with event count) is the reproducible claim.
