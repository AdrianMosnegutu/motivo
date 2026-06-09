#pragma once

// Production builds carry none of this code: MOTIVO_BENCH(...) expands to nothing.

#ifdef MOTIVO_BENCHMARK

#include <chrono>
#include <cstddef>
#include <iostream>

namespace motivo::benchmark {

using Clock = std::chrono::steady_clock;

inline double elapsed_ms(const Clock::time_point start) {
    const auto delta = Clock::now() - start;
    return std::chrono::duration<double, std::milli>(delta).count();
}

// Accumulates per-stage timings plus the lowered event count and emits them on stderr
// in the format the benchmark harness parses.
struct StageTimings {
    double parse_ms = 0.0;
    double semantic_ms = 0.0;
    double lowering_ms = 0.0;
    double midi_ms = 0.0;
    std::size_t note_events = 0;

    void emit() const {
        std::cerr << "MOTIVO_BENCHMARK_STAGES parse_ms=" << parse_ms << " semantic_ms=" << semantic_ms
                  << " lowering_ms=" << lowering_ms << " midi_ms=" << midi_ms << '\n';
        std::cerr << "MOTIVO_BENCHMARK_EVENTS note_events=" << note_events << '\n';
    }
};

}  // namespace motivo::benchmark

// Evaluate benchmark-only statement(s). Variadic so the argument may contain commas.
#define MOTIVO_BENCH(...) __VA_ARGS__

#else  // !MOTIVO_BENCHMARK

#define MOTIVO_BENCH(...)

#endif  // MOTIVO_BENCHMARK
