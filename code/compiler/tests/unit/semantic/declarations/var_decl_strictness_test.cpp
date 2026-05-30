#include <gtest/gtest.h>

#include "support/semantic_test_utils.hpp"

using namespace motivo::testing::semantic;

TEST(VarDeclStrictness, IntDeclWithDivisionExpressionIsValid) { analyze_ok("int x = 6 / 2;"); }

TEST(VarDeclStrictness, IntDeclWithDoubleVariableIsError) {
    const auto analyzed = analyze(R"(
        double y = 1.0;
        int x = y;
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(VarDeclStrictness, IntDeclWithIntVariableIsValid) {
    analyze_ok(R"(
        int y = 1;
        int x = y;
    )");
}

TEST(VarDeclStrictness, DoubleDeclWithIntVariableIsError) {
    const auto analyzed = analyze(R"(
        int y = 1;
        double x = y;
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(VarDeclStrictness, IntDeclWithMixedTernaryBranchesIsError) {
    const auto analyzed = analyze("int x = true ? 1 : 2.0;");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(VarDeclStrictness, SeqDeclWithChordInitializerIsError) {
    const auto analyzed = analyze("seq s = (A4, C5);");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(VarDeclStrictness, ChordDeclWithSequenceInitializerIsError) {
    const auto analyzed = analyze("chord c = [A4, B4];");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}
