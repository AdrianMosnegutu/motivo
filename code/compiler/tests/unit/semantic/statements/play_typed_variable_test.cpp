#include <gtest/gtest.h>

#include "support/semantic_test_utils.hpp"

using namespace motivo::testing::semantic;

TEST(PlayTypedVariable, PlayIntVariableIsError) {
    const auto analyzed = analyze(R"(
        int x = 1;
        track { play x; }
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(PlayTypedVariable, PlayBoolVariableIsError) {
    const auto analyzed = analyze(R"(
        bool flag = true;
        track { play flag; }
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(PlayTypedVariable, PlayDoubleVariableIsError) {
    const auto analyzed = analyze(R"(
        double x = 1.0;
        track { play x; }
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}
