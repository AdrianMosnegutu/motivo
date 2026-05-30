#include <gtest/gtest.h>

#include "motivo/common/diagnostics/diagnostics_engine.hpp"
#include "motivo/parsing/parse.hpp"

TEST(TypedSyntax, LetSyntaxIsRejected) {
    motivo::DiagnosticsEngine engine;
    const auto result = motivo::parsing::parse_source("let x = 1;", "<test>", engine);
    EXPECT_FALSE(result.ok());
    EXPECT_TRUE(engine.has_errors(motivo::DiagnosticStage::Parsing));
}

TEST(TypedSyntax, LetSyntaxInsideTrackIsRejected) {
    motivo::DiagnosticsEngine engine;
    const auto result = motivo::parsing::parse_source("track { let x = 1; }", "<test>", engine);
    EXPECT_FALSE(result.ok());
    EXPECT_TRUE(engine.has_errors(motivo::DiagnosticStage::Parsing));
}
