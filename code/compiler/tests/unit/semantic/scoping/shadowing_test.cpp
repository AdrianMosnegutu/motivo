#include <gtest/gtest.h>

#include "support/semantic_test_utils.hpp"

using namespace motivo::testing::semantic;

// -- Variable shadowing --------------------------------------------------------

TEST(Shadowing, TrackLocalShadowsGlobal) {
    // A typed declaration inside a track with the same name as a global declaration is valid —
    // the inner binding shadows the outer one within the track.
    const auto [prog, result] = analyze_ok(R"(
        int x = 1
        track { note x = A4 }
    )");
}

TEST(Shadowing, TrackLocalShadowTakesInnerType) {
    // The inner declaration's type is what the inner binding resolves to.
    const auto [prog, result] = analyze_ok(R"(
        int x = 1
        track {
            note x = A4
            play x;
        }
    )");
}

TEST(Shadowing, GlobalStillAccessibleViaDifferentName) {
    // After shadowing, the original global is inaccessible under the same name,
    // but accessible under a different alias.
    const auto [prog, result] = analyze_ok(R"(
        int g = 1
        track {
            int alias_g = g
            note g = A4
            play g;
        }
    )");
}

TEST(Shadowing, VoiceShadowsTrackLocal) {
    const auto [prog, result] = analyze_ok(R"(
        track {
            int x = 1;
            voice { note x = A4 play x; }
        }
    )");
}

TEST(Shadowing, ForLoopVarShadowsOuterVar) {
    const auto [prog, result] = analyze_ok(R"(
        track {
            note i = A4
            for (int i = 0; i < 4; i = i + 1) { }
        }
    )");
}

TEST(Shadowing, PatternParamShadowsGlobal) {
    const auto [prog, result] = analyze_ok(R"(
        note n = A4
        pattern p(int n) { int x = n + 1 }
        track { play p(3); }
    )");
}
