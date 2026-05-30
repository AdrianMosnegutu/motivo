#include <gtest/gtest.h>

#include "support/semantic_test_utils.hpp"

using namespace motivo::testing::semantic;

TEST(BoolStrictness, BoolDeclAcceptsTrueAndFalse) {
    analyze_ok("bool t = true;");
    analyze_ok("bool f = false;");
}

TEST(BoolStrictness, BoolDeclRejectsIntLiteral) {
    EXPECT_TRUE(has_semantic_error(analyze("bool x = 1;").diagnostics));
    EXPECT_TRUE(has_semantic_error(analyze("bool x = 0;").diagnostics));
}

TEST(BoolStrictness, BoolDeclRejectsDoubleLiteral) {
    EXPECT_TRUE(has_semantic_error(analyze("bool x = 1.0;").diagnostics));
}

TEST(BoolStrictness, LogicalOpsRequireBoolOperands) {
    EXPECT_TRUE(has_semantic_error(analyze("bool x = 1 && true;").diagnostics));
    EXPECT_TRUE(has_semantic_error(analyze("bool x = true && 1;").diagnostics));
    EXPECT_TRUE(has_semantic_error(analyze("bool x = 1 || 2;").diagnostics));
}

TEST(BoolStrictness, IfConditionRequiresBool) {
    const auto analyzed = analyze(R"(
        track {
            if (1) { play A4; }
        }
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}
