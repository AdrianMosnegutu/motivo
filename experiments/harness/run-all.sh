#!/usr/bin/env bash
# One-command reproduction of the Motivo evaluation suites.
#
#   bash experiments/harness/run-all.sh
#
# Builds (or reuses) three compilers, runs the reproduction / stress / general
# suites, asserts the over-cap fixture is rejected, and regenerates every
# SUMMARY.md + results.csv. Override any binary to skip its build, e.g.:
#
#   MOTIVOC=/path/to/motivoc DSLRC_V1=/path/to/dslrc MOTIVOC_V2=/path/to/motivoc \
#     bash experiments/harness/run-all.sh
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXP="$(dirname "$HERE")"
REPO="$(cd "$EXP/.." && pwd)"
cd "$REPO"

BISON="${BISON_EXECUTABLE:-$(command -v bison || true)}"
FLEX="${FLEX_EXECUTABLE:-$(command -v flex || true)}"
NP="$(sysctl -n hw.ncpu 2>/dev/null || nproc)"
H="$EXP/harness/run-benchmark.sh"

build_compiler() { # <build-dir> <src-dir> [extra cmake args...]
  local bdir="$1" src="$2"; shift 2
  cmake -B "$bdir" -S "$src" -DCMAKE_BUILD_TYPE=Release -DBUILD_TESTING=OFF "$@" \
    ${BISON:+-DBISON_EXECUTABLE="$BISON"} ${FLEX:+-DFLEX_EXECUTABLE="$FLEX"} >/dev/null
  cmake --build "$bdir" -j"$NP" >/dev/null
}

ensure_worktree() { # <path> <tag>
  [[ -d "$1" ]] || git worktree add --detach "$1" "$2" >/dev/null
}

# --- Current motivoc, built with benchmark instrumentation compiled in ---
if [[ -z "${MOTIVOC:-}" || ! -x "${MOTIVOC:-}" ]]; then
  echo "==> building current motivoc (Release, MOTIVO_ENABLE_BENCHMARK=ON)"
  build_compiler "$REPO/build/bench-current" "$REPO/code/compiler" -DMOTIVO_ENABLE_BENCHMARK=ON
  MOTIVOC="$REPO/build/bench-current/apps/motivoc"
fi

# --- v1 / v2 from tags (self-contained worktrees under build/) ---
if [[ -z "${DSLRC_V1:-}" || ! -x "${DSLRC_V1:-}" ]]; then
  echo "==> building v1.0.0-base dslrc (Release)"
  ensure_worktree "$REPO/build/wt-v1" v1.0.0-base
  build_compiler "$REPO/build/wt-v1/build/rel" "$REPO/build/wt-v1/code/compiler"
  DSLRC_V1="$REPO/build/wt-v1/build/rel/apps/dslrc"
fi
if [[ -z "${MOTIVOC_V2:-}" || ! -x "${MOTIVOC_V2:-}" ]]; then
  echo "==> building v2.0.0-explicit-types motivoc (Release)"
  ensure_worktree "$REPO/build/wt-v2" v2.0.0-explicit-types
  build_compiler "$REPO/build/wt-v2/build/rel" "$REPO/build/wt-v2/code/compiler"
  MOTIVOC_V2="$REPO/build/wt-v2/build/rel/apps/motivoc"
fi

echo "==> reproduction suite (B1-B3, v1 vs v2)"
for id in B1 B2 B3; do
  bash "$H" -j "$EXP/results/reproduction/${id}-v1.json" "$DSLRC_V1"   "$EXP"/fixtures/reproduction/v1/${id}_*.dsl    >/dev/null
  bash "$H" -j "$EXP/results/reproduction/${id}-v2.json" "$MOTIVOC_V2" "$EXP"/fixtures/reproduction/v2/${id}_*.motivo >/dev/null
done

echo "==> stress suite (current motivoc)"
while IFS= read -r f; do
  bash "$H" -j "$EXP/results/stress/$(basename "$f" .motivo).json" "$MOTIVOC" "$f" >/dev/null
done < <(find "$EXP/fixtures/stress" -name '*.motivo' ! -name 'CAP_over*' | sort)

echo "==> general suite (current motivoc)"
for f in "$EXP"/fixtures/general/*.motivo; do
  bash "$H" -j "$EXP/results/general/$(basename "$f" .motivo).json" "$MOTIVOC" "$f" >/dev/null
done

echo "==> safety-limit check (over-cap fixture must be rejected)"
if "$MOTIVOC" "$EXP/fixtures/stress/cap/CAP_over_20001.motivo" >/dev/null 2>&1; then
  echo "    WARNING: over-cap fixture unexpectedly compiled" >&2
else
  echo "    OK: over-cap fixture rejected by the 20000-event limit"
fi

find "$EXP/fixtures" -name '*.mid' -delete 2>/dev/null || true

echo "==> aggregating"
python3 "$EXP/harness/aggregate.py" "$EXP/results/reproduction" --title "Reproduction: B1-B3 (v1 vs v2)" >/dev/null
python3 "$EXP/harness/aggregate.py" "$EXP/results/stress"       --title "Stress Suite (current motivoc)"  >/dev/null
python3 "$EXP/harness/aggregate.py" "$EXP/results/general"      --title "General-Case Compositions (current motivoc)" >/dev/null

echo "Done. SUMMARY.md + results.csv written under experiments/results/{reproduction,stress,general}/."
