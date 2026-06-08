#pragma once

#include <chrono>
#include <cstdlib>
#include <iostream>
#include <string_view>

namespace motivo::benchmark {

inline bool enabled() {
    const char* value = std::getenv("MOTIVO_BENCHMARK");
    return value != nullptr && std::string_view(value) == "1";
}

using Clock = std::chrono::steady_clock;

inline double elapsed_ms(const Clock::time_point start) {
    const auto delta = Clock::now() - start;
    return std::chrono::duration<double, std::milli>(delta).count();
}

inline void emit_stage_timings(const double parse_ms,
                               const double semantic_ms,
                               const double lowering_ms,
                               const double midi_ms) {
    std::cerr << "MOTIVO_BENCHMARK_STAGES parse_ms=" << parse_ms << " semantic_ms=" << semantic_ms
              << " lowering_ms=" << lowering_ms << " midi_ms=" << midi_ms << '\n';
}

}  // namespace motivo::benchmark
