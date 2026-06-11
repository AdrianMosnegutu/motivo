#include "motivo/compiler.hpp"

#include <algorithm>
#include <exception>
#include <utility>

#include "motivo/benchmark_timing.hpp"
#include "motivo/common/diagnostics/diagnostics_engine.hpp"
#include "motivo/lowering/lower.hpp"
#include "motivo/midi/write_midi.hpp"
#include "motivo/parsing/parse.hpp"
#include "motivo/semantic/analyze.hpp"

namespace motivo {

CompileResult::CompileResult(Diagnostics diagnostics) : diagnostics_(std::move(diagnostics)) {}

bool CompileResult::ok() const { return !has_errors(); }

bool CompileResult::has_errors() const {
    return std::ranges::any_of(diagnostics_, [](const Diagnostic& diagnostic) { return diagnostic.is_error(); });
}

void CompileResult::add_diagnostic(const Diagnostic& diagnostic) { diagnostics_.push_back(diagnostic); }

void CompileResult::add_diagnostic(const DiagnosticStage stage,
                                   const std::string& message,
                                   const DiagnosticSeverity severity) {
    diagnostics_.push_back(Diagnostic{
        .stage = stage,
        .severity = severity,
        .location = std::nullopt,
        .message = message,
    });
}

const Diagnostics& CompileResult::get_diagnostics() const { return diagnostics_; }

CompileResult compile(FILE* input, const std::string& source_name, const std::string& output_path) {
    DiagnosticsEngine diagnostics;
    MOTIVO_BENCH(benchmark::StageTimings timings;)

    if (input == nullptr) {
        diagnostics.report(DiagnosticStage::Parsing, DiagnosticSeverity::Error, "input stream is null");
        return CompileResult(diagnostics.take_diagnostics());
    }

    MOTIVO_BENCH(const auto parse_start = benchmark::Clock::now();)
    const auto parse_result = parsing::parse_stream(input, source_name, diagnostics);
    MOTIVO_BENCH(timings.parse_ms = benchmark::elapsed_ms(parse_start);)
    if (!parse_result.ok()) {
        MOTIVO_BENCH(timings.emit();)
        return CompileResult(diagnostics.take_diagnostics());
    }

    MOTIVO_BENCH(const auto semantic_start = benchmark::Clock::now();)
    const auto analysis = semantic::analyze(*parse_result.program(), diagnostics);
    MOTIVO_BENCH(timings.semantic_ms = benchmark::elapsed_ms(semantic_start);)
    if (diagnostics.has_errors(DiagnosticStage::Semantic)) {
        MOTIVO_BENCH(timings.emit();)
        return CompileResult(diagnostics.take_diagnostics());
    }

    MOTIVO_BENCH(const auto lowering_start = benchmark::Clock::now();)
    const auto lowered = lowering::lower(analysis, diagnostics);
    MOTIVO_BENCH(timings.lowering_ms = benchmark::elapsed_ms(lowering_start);)
    if (!lowered.ok()) {
        MOTIVO_BENCH(timings.emit();)
        return CompileResult(diagnostics.take_diagnostics());
    }

    try {
        MOTIVO_BENCH(const auto midi_start = benchmark::Clock::now();)
        midi::write_midi(*lowered.program(), output_path);
        MOTIVO_BENCH(timings.midi_ms = benchmark::elapsed_ms(midi_start);)
    } catch (const std::exception& error) {
        diagnostics.report(DiagnosticStage::Output, DiagnosticSeverity::Error, error.what());
    }

    MOTIVO_BENCH(for (const auto& track
                      : lowered.program()->tracks) { timings.note_events += track.events.size(); } timings.emit();)

    return CompileResult(diagnostics.take_diagnostics());
}

}  // namespace motivo
