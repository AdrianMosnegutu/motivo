#!/usr/bin/env bash
# Reproducible wall-clock benchmark harness for motivoc (v2) or dslrc (v1).
# No external tools required beyond bash, python3, and a built compiler binary.
# Timing/aggregation logic lives in benchmark.py (this script only parses args).
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  cat <<'EOF'
Usage: run-benchmark.sh [options] <compiler-binary> <source-file>

Options:
  -o PATH     MIDI output path (default: <source>.mid beside the input)
  -n N        Measured iterations (default: 50)
  -w N        Warmup iterations (default: 5)
  -j PATH     Write JSON results to PATH
  -h          Show this help

Examples:
  ./run-benchmark.sh ../../build/bench-current/apps/motivoc \
    ../fixtures/general/fur_elise.motivo

  ./run-benchmark.sh ../../build/wt-v1/build/rel/apps/dslrc \
    ../fixtures/reproduction/v1/B1_single_loop_20000.dsl -j ../results/reproduction/B1-v1.json
EOF
}

WARMUP=5
ITERATIONS=50
OUTPUT=""
JSON_OUT=""

while getopts ":o:n:w:j:h" opt; do
  case "$opt" in
    o) OUTPUT="$OPTARG" ;;
    n) ITERATIONS="$OPTARG" ;;
    w) WARMUP="$OPTARG" ;;
    j) JSON_OUT="$OPTARG" ;;
    h) usage; exit 0 ;;
    *) usage; exit 1 ;;
  esac
done
shift $((OPTIND - 1))

if [[ $# -ne 2 ]]; then
  usage
  exit 1
fi

COMPILER="$1"
SOURCE="$2"

if [[ ! -x "$COMPILER" ]]; then
  echo "error: compiler binary not executable: $COMPILER" >&2
  exit 1
fi
if [[ ! -f "$SOURCE" ]]; then
  echo "error: source file not found: $SOURCE" >&2
  exit 1
fi

# motivoc/dslrc write <source>.mid alongside the input file (see apps/motivoc.cpp).
SOURCE_ABS="$(cd "$(dirname "$SOURCE")" && pwd)/$(basename "$SOURCE")"
if [[ -z "$OUTPUT" ]]; then
  OUTPUT="${SOURCE_ABS%.*}.mid"
fi

exec python3 "$HERE/benchmark.py" \
  "$COMPILER" "$SOURCE_ABS" "$OUTPUT" "$WARMUP" "$ITERATIONS" "${JSON_OUT:-}"
