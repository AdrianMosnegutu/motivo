#include <gtest/gtest.h>

#include "support/semantic_test_utils.hpp"

using namespace motivo::testing::semantic;

// -- Global scope visibility ----------------------------------------------------

TEST(VariableScoping, GlobalLetIsVisibleInsideTrack) {
    const auto [prog, result] = analyze_ok(R"(
        int x = 5;
        track { int y = x; }
    )");
}

TEST(VariableScoping, GlobalLetIsVisibleInsidePattern) {
    const auto [prog, result] = analyze_ok(R"(
        int x = 5;
        pattern p() { int y = x; }
    )");
}

TEST(VariableScoping, GlobalLetIsVisibleInsideVoice) {
    const auto [prog, result] = analyze_ok(R"(
        int x = 5;
        track { voice { int y = x; } }
    )");
}

// -- Track-local scope ---------------------------------------------------------

TEST(VariableScoping, TrackLocalLetNotVisibleInGlobalScope) {
    // A variable declared inside a track body should not bleed into global scope.
    // The only way to test this is via a pattern defined at global scope — it
    // must not see variables from any specific track.
    const auto analyzed = analyze(R"(
        pattern p() { int y = x; }
        track { int x = 5; }
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(VariableScoping, TrackLocalLetNotVisibleInSiblingTrack) {
    const auto analyzed = analyze(R"(
        track { int x = 5; }
        track { int y = x; }
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(VariableScoping, TrackLocalLetVisibleWithinSameTrack) {
    const auto [prog, result] = analyze_ok(R"(
        track {
            int x = 5;
            int y = x;
        }
    )");
}

// -- Voice-local scope ---------------------------------------------------------

TEST(VariableScoping, VoiceLocalLetNotVisibleAfterVoiceInTrack) {
    // Variables declared inside a voice body must not be visible in the enclosing
    // track after the voice block ends.
    const auto analyzed = analyze(R"(
        track {
            voice { int x = 5; }
            int y = x;
        }
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(VariableScoping, VoiceLocalLetVisibleWithinSameVoice) {
    const auto [prog, result] = analyze_ok(R"(
        track {
            voice {
                int x = 5;
                int y = x;
            }
        }
    )");
}

TEST(VariableScoping, VoiceLocalLetNotVisibleInSiblingVoice) {
    const auto analyzed = analyze(R"(
        track {
            voice { int x = 5; }
            voice { int y = x; }
        }
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

// -- For-loop variable scope ----------------------------------------------------

TEST(VariableScoping, ForLoopVariableVisibleInsideBody) {
    const auto [prog, result] = analyze_ok(R"(
        track {
            for (int i = 0; i < 4; i = i + 1) { int y = i; }
        }
    )");
}

TEST(VariableScoping, ForLoopVariableNotVisibleAfterLoop) {
    const auto analyzed = analyze(R"(
        track {
            for (int i = 0; i < 4; i = i + 1) { }
            int y = i;
        }
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

// -- Sequential visibility -----------------------------------------------------

TEST(VariableScoping, LetNotVisibleBeforeItsDeclaration) {
    const auto analyzed = analyze(R"(
        track {
            int y = x;
            int x = 5;
        }
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}
