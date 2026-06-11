#!/usr/bin/env python3
"""Time one compiler invocation over one source file and emit a JSON result.

Usage:
    benchmark.py <compiler> <source> <output-midi> <warmup> <iterations> [json-out]

Runs the compiler as a subprocess, measuring end-to-end wall clock with
``time.perf_counter`` over ``warmup`` discarded runs plus ``iterations`` measured
runs. When the compiler is a benchmark build it also reports per-stage timings and
the lowered event count, parsed from the ``MOTIVO_BENCHMARK_*`` stderr lines.

Driven by ``run-benchmark.sh``; usable standalone. Standard library only.
"""
from __future__ import annotations

import json
import os
import statistics
import subprocess
import sys
import time
from pathlib import Path

STAGE_PREFIX = "MOTIVO_BENCHMARK_STAGES "
EVENT_PREFIX = "MOTIVO_BENCHMARK_EVENTS "


def parse_stage_timings(stderr: str) -> dict[str, float] | None:
    for line in reversed(stderr.splitlines()):
        if not line.startswith(STAGE_PREFIX):
            continue
        stages: dict[str, float] = {}
        for token in line[len(STAGE_PREFIX):].split():
            if "=" not in token:
                continue
            key, value = token.split("=", 1)
            stages[key] = float(value)
        return stages if stages else None
    return None


def parse_event_count(stderr: str) -> int | None:
    for line in reversed(stderr.splitlines()):
        if not line.startswith(EVENT_PREFIX):
            continue
        for token in line[len(EVENT_PREFIX):].split():
            if token.startswith("note_events="):
                return int(token.split("=", 1)[1])
    return None


def source_loc(path: str) -> int:
    """Non-blank source lines, matching the LOC convention used in the thesis tables."""
    text = Path(path).read_text(encoding="utf-8", errors="replace")
    return sum(1 for line in text.splitlines() if line.strip())


def run_once(compiler: str, source: str, output: str) -> tuple[float, dict[str, float] | None, int | None]:
    start = time.perf_counter()
    # The tagged v1/v2 binaries gate benchmark output on this env var; current
    # benchmark builds emit unconditionally and ignore it.
    env = {**os.environ, "MOTIVO_BENCHMARK": "1"}
    proc = subprocess.run(
        [compiler, source],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        check=False,
        env=env,
    )
    elapsed_ms = (time.perf_counter() - start) * 1000.0
    if proc.returncode != 0:
        raise RuntimeError(
            f"compile failed (exit {proc.returncode})\nstdout:\n{proc.stdout}\nstderr:\n{proc.stderr}"
        )
    out_path = Path(output)
    if not out_path.exists():
        alt = Path(source).with_suffix(".mid")
        if alt.exists():
            out_path = alt
        else:
            raise RuntimeError(f"expected MIDI output at {output}")
    return elapsed_ms, parse_stage_timings(proc.stderr), parse_event_count(proc.stderr)


def main() -> None:
    compiler, source, output, warmup_s, iterations_s, json_out = (sys.argv[1:7] + [""])[:6]
    warmup = int(warmup_s)
    iterations = int(iterations_s)

    for _ in range(warmup):
        run_once(compiler, source, output)

    runs = [run_once(compiler, source, output) for _ in range(iterations)]
    samples = [elapsed for elapsed, _, _ in runs]
    stage_runs = [stages for _, stages, _ in runs if stages]
    event_counts = [events for _, _, events in runs if events is not None]
    note_events = event_counts[0] if event_counts else None

    mean = statistics.mean(samples)
    stdev = statistics.pstdev(samples) if len(samples) > 1 else 0.0

    mid_path = Path(output)
    if not mid_path.exists():
        mid_path = Path(source).with_suffix(".mid")

    def mean_stage(key: str) -> float | None:
        values = [run[key] for run in stage_runs if key in run]
        return round(statistics.mean(values), 4) if values else None

    loc = source_loc(source)
    result = {
        "compiler": str(Path(compiler).resolve()),
        "source": str(Path(source).resolve()),
        "midi_output": str(mid_path.resolve()),
        "midi_bytes": mid_path.stat().st_size if mid_path.exists() else None,
        "note_events": note_events,
        "source_loc": loc,
        "events_per_loc": (round(note_events / loc, 2) if note_events is not None and loc else None),
        "warmup_runs": warmup,
        "measured_runs": iterations,
        "mean_ms": round(mean, 4),
        "stdev_ms": round(stdev, 4),
        "min_ms": round(min(samples), 4),
        "max_ms": round(max(samples), 4),
        "samples_ms": [round(x, 4) for x in samples],
        "stage_timing_available": bool(stage_runs),
        "stage_timing_runs": len(stage_runs),
        "stages_mean_ms": {
            "parse_ms": mean_stage("parse_ms"),
            "semantic_ms": mean_stage("semantic_ms"),
            "lowering_ms": mean_stage("lowering_ms"),
            "midi_ms": mean_stage("midi_ms"),
        },
    }

    print(json.dumps(result, indent=2))
    if json_out:
        Path(json_out).parent.mkdir(parents=True, exist_ok=True)
        Path(json_out).write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
