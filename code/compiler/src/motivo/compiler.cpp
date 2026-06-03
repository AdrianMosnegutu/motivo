#include "motivo/compiler.hpp"

#include <algorithm>
#include <chrono>
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
    const bool bench = benchmark::enabled();
    double parse_ms = 0.0;
    double semantic_ms = 0.0;
    double lowering_ms = 0.0;
    double midi_ms = 0.0;

    if (input == nullptr) {
        diagnostics.report(DiagnosticStage::Parsing, DiagnosticSeverity::Error, "input stream is null");
        return CompileResult(diagnostics.take_diagnostics());
    }

    const auto parse_start = benchmark::Clock::now();
    const auto parse_result = parsing::parse_stream(input, source_name, diagnostics);
    if (bench) {
        parse_ms = benchmark::elapsed_ms(parse_start);
    }
    if (!parse_result.ok()) {
        if (bench) {
            benchmark::emit_stage_timings(parse_ms, 0.0, 0.0, 0.0);
        }
        return CompileResult(diagnostics.take_diagnostics());
    }

    const auto semantic_start = benchmark::Clock::now();
    const auto analysis = semantic::analyze(*parse_result.program(), diagnostics);
    if (bench) {
        semantic_ms = benchmark::elapsed_ms(semantic_start);
    }
    if (diagnostics.has_errors(DiagnosticStage::Semantic)) {
        if (bench) {
            benchmark::emit_stage_timings(parse_ms, semantic_ms, 0.0, 0.0);
        }
        return CompileResult(diagnostics.take_diagnostics());
    }

    const auto lowering_start = benchmark::Clock::now();
    const auto lowered = lowering::lower(analysis, diagnostics);
    if (bench) {
        lowering_ms = benchmark::elapsed_ms(lowering_start);
    }
    if (!lowered.ok()) {
        if (bench) {
            benchmark::emit_stage_timings(parse_ms, semantic_ms, lowering_ms, 0.0);
        }
        return CompileResult(diagnostics.take_diagnostics());
    }

    try {
        const auto midi_start = benchmark::Clock::now();
        midi::write_midi(*lowered.program(), output_path);
        if (bench) {
            midi_ms = benchmark::elapsed_ms(midi_start);
        }
    } catch (const std::exception& error) {
        diagnostics.report(DiagnosticStage::Output, DiagnosticSeverity::Error, error.what());
    }

    if (bench) {
        benchmark::emit_stage_timings(parse_ms, semantic_ms, lowering_ms, midi_ms);
    }

    return CompileResult(diagnostics.take_diagnostics());
}

}  // namespace motivo
