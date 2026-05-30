#include <gtest/gtest.h>

#include "motivo/diagnostics/diagnostic.hpp"
#include "support/semantic_test_utils.hpp"

using namespace motivo::testing::semantic;

TEST(PatternEdgeCases, DuplicatePatternParameterNameIsError) {
    const auto analyzed = analyze(R"(
        pattern p(
            int first,
            int first
        ) { play A4; }
        track { play p(1, 2); }
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
    EXPECT_TRUE(has_error(analyzed.diagnostics, "duplicate pattern parameter"));

    const motivo::Diagnostic* duplicate = find_error(analyzed.diagnostics, "duplicate pattern parameter");
    ASSERT_NE(duplicate, nullptr);
    ASSERT_TRUE(duplicate->location.has_value());
    EXPECT_NE(duplicate->location->find("4:17"), std::string::npos);
}

TEST(PatternEdgeCases, ForwardReferenceInSameTrackIsValid) {
    analyze_ok(R"(
        track {
            play later();
            pattern later() { play A4; }
        }
    )");
}

TEST(PatternEdgeCases, TrackLocalPatternShadowsGlobalPattern) {
    analyze_ok(R"(
        pattern p(int n) { play A4 :n; }
        track {
            pattern p(int n) { play B4 :n; }
            play p(1);
        }
    )");
}

TEST(PatternEdgeCases, GlobalPatternStillVisibleFromOtherTrack) {
    analyze_ok(R"(
        pattern p(int n) { play A4 :n; }
        track {
            pattern p(int n) { play B4 :n; }
            play p(1);
        }
        track { play p(1); }
    )");
}

TEST(PatternEdgeCases, IntLiteralPrefersIntOverload) {
    analyze_ok(R"(
        pattern p(int n) { play A4 :n; }
        pattern p(double n) { play B4 :n; }
        track { play p(1); }
    )");
}
