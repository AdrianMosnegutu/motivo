#include <gtest/gtest.h>

#include "support/lowerer_test_support.hpp"

using namespace motivo::testing::lowerer;

TEST(IdentifierEval, VarDeclVariableResolvesToItsValue) {
    const auto ir = lower_ok("track { int x = 3; play A4 :x; play B4; }");
    ASSERT_EQ(ir.tracks[0].events.size(), 2u);
    EXPECT_DOUBLE_EQ(ir.tracks[0].events[0].duration_beats, 3.0);
    EXPECT_DOUBLE_EQ(ir.tracks[0].events[1].start_beat, 3.0);
}

TEST(IdentifierEval, VariableUsedInArithmetic) {
    const auto ir = lower_ok("track { int a = 2; int b = a + 1; play A4 :b; play B4; }");
    ASSERT_EQ(ir.tracks[0].events.size(), 2u);
    EXPECT_DOUBLE_EQ(ir.tracks[0].events[0].duration_beats, 3.0);
    EXPECT_DOUBLE_EQ(ir.tracks[0].events[1].start_beat, 3.0);
}

TEST(IdentifierEval, VariableUsedAsCondition) {
    const auto ir = lower_ok("track { bool flag = true; if (flag) { play A4; } play B4; }");
    ASSERT_EQ(ir.tracks[0].events.size(), 2u);
    EXPECT_EQ(ir.tracks[0].events[0].midi_note, 69);  // A4
}

TEST(IdentifierEval, ChainedVariableResolvesCorrectly) {
    const auto ir = lower_ok("track { int a = 2; int b = a; play A4 :b; play B4; }");
    ASSERT_EQ(ir.tracks[0].events.size(), 2u);
    EXPECT_DOUBLE_EQ(ir.tracks[0].events[0].duration_beats, 2.0);
    EXPECT_DOUBLE_EQ(ir.tracks[0].events[1].start_beat, 2.0);
}
