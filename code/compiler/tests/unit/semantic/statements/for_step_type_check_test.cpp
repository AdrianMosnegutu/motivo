#include <gtest/gtest.h>

#include "support/semantic_test_utils.hpp"

using namespace motivo::testing::semantic;

TEST(ForStepTypeCheck, AssignDoubleToIntStepIsError) {
    const auto analyzed = analyze(R"(
        track {
            for (int i = 0; i < 4; i = 1.5) { play A4; }
        }
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(ForStepTypeCheck, AssignBoolToIntStepIsError) {
    const auto analyzed = analyze(R"(
        track {
            for (int i = 0; i < 4; i = true) { play A4; }
        }
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(ForStepTypeCheck, AssignIntExpressionToIntStepIsValid) {
    analyze_ok(R"(
        track {
            for (int i = 0; i < 4; i = i + 1) { play A4; }
        }
    )");
}
