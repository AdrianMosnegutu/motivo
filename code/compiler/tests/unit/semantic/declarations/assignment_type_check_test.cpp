#include <gtest/gtest.h>

#include "support/semantic_test_utils.hpp"

using namespace motivo::testing::semantic;

TEST(AssignmentTypeCheck, IntVariableRejectsDoubleAssignment) {
    const auto analyzed = analyze(R"(
        int x = 1;
        x = 1.5;
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(AssignmentTypeCheck, IntVariableAcceptsIntAssignment) {
    analyze_ok(R"(
        int x = 1;
        x = 2;
    )");
}

TEST(AssignmentTypeCheck, DoubleVariableAcceptsIntLiteralAssignment) {
    analyze_ok(R"(
        double x = 1.0;
        x = 2;
    )");
}

TEST(AssignmentTypeCheck, DoubleVariableAcceptsDoubleAssignment) {
    analyze_ok(R"(
        double x = 1.0;
        x = 2.5;
    )");
}

TEST(AssignmentTypeCheck, BoolVariableRejectsIntAssignment) {
    const auto analyzed = analyze(R"(
        bool flag = true;
        flag = 1;
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(AssignmentTypeCheck, NoteVariableRejectsIntAssignment) {
    const auto analyzed = analyze(R"(
        note pitch = A4;
        pitch = 42;
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(AssignmentTypeCheck, SeqVariableRejectsChordAssignment) {
    const auto analyzed = analyze(R"(
        seq s = [A4, B4];
        s = (A4, C5);
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}
