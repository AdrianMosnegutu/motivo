#include <gtest/gtest.h>

#include <algorithm>
#include <memory>
#include <string>

#include "motivo/common/ast/program.hpp"
#include "motivo/common/diagnostics/diagnostics_engine.hpp"
#include "motivo/diagnostics/diagnostic.hpp"
#include "motivo/lowering/lower.hpp"
#include "motivo/parsing/parse.hpp"
#include "motivo/semantic/analyze.hpp"

namespace {

struct LoweringInput {
    std::unique_ptr<motivo::ast::Program> program;
    motivo::semantic::AnalysisResult analysis;
    motivo::DiagnosticsEngine diagnostics;
};

LoweringInput analyze_for_lowering(const std::string& src) {
    motivo::DiagnosticsEngine diagnostics;
    auto parsed = motivo::parsing::parse_source(src, "<source>", diagnostics);
    EXPECT_TRUE(parsed.ok());
    auto program = parsed.take_program();
    auto analysis = motivo::semantic::analyze(*program, diagnostics);
    return {.program = std::move(program), .analysis = std::move(analysis), .diagnostics = std::move(diagnostics)};
}

bool has_lowering_error_containing(const motivo::Diagnostics& diagnostics, const std::string& text) {
    return std::ranges::any_of(diagnostics, [&](const motivo::Diagnostic& diagnostic) {
        return diagnostic.stage == motivo::DiagnosticStage::Lowering &&
               diagnostic.severity == motivo::DiagnosticSeverity::Error &&
               diagnostic.message.find(text) != std::string::npos;
    });
}

}  // namespace

TEST(LowererApi, ReportsMultipleLoweringDiagnosticsForSemanticallyValidProgram) {
    auto input = analyze_for_lowering(R"(
        track {
            loop (-1) { play A4; }
            loop (-2) { play B4; }
        }
    )");
    ASSERT_FALSE(input.diagnostics.has_errors(motivo::DiagnosticStage::Semantic));

    const auto result = motivo::lowering::lower(input.analysis, input.diagnostics);

    EXPECT_FALSE(result.ok());
    EXPECT_FALSE(result.program().has_value());
    EXPECT_TRUE(has_lowering_error_containing(input.diagnostics.diagnostics(), "loop count must be non-negative"));
    ASSERT_GE(input.diagnostics.diagnostics().size(), 2u);
    for (const auto& diagnostic : input.diagnostics.diagnostics()) {
        EXPECT_EQ(diagnostic.stage, motivo::DiagnosticStage::Lowering);
        EXPECT_EQ(diagnostic.severity, motivo::DiagnosticSeverity::Error);
    }
}

TEST(LowererApi, ReportsRuntimeExpressionFailuresAsLoweringDiagnostics) {
    auto input = analyze_for_lowering(R"(
        track {
            double first = 1 / 0;
            int second = 1 % 0;
        }
    )");
    ASSERT_FALSE(input.diagnostics.has_errors(motivo::DiagnosticStage::Semantic));

    const auto result = motivo::lowering::lower(input.analysis, input.diagnostics);

    EXPECT_FALSE(result.ok());
    EXPECT_FALSE(result.program().has_value());
    EXPECT_TRUE(has_lowering_error_containing(input.diagnostics.diagnostics(), "division by zero"));
    EXPECT_TRUE(has_lowering_error_containing(input.diagnostics.diagnostics(), "modulo by zero"));
}

TEST(LowererApi, SuccessfulLoweringReturnsProgram) {
    auto input = analyze_for_lowering("track { play A4; }");
    ASSERT_FALSE(input.diagnostics.has_errors(motivo::DiagnosticStage::Semantic));

    const auto result = motivo::lowering::lower(input.analysis, input.diagnostics);

    ASSERT_TRUE(result.ok());
    ASSERT_TRUE(result.program().has_value());
    EXPECT_TRUE(input.diagnostics.diagnostics().empty());
    ASSERT_EQ(result.program()->tracks.size(), 1u);
    ASSERT_EQ(result.program()->tracks[0].events.size(), 1u);
}
