#include <gtest/gtest.h>

#include "support/semantic_test_utils.hpp"

using namespace motivo::testing::semantic;

TEST(TypedPatternOverload, OverloadByParameterTypeIsValid) {
    analyze_ok(R"(
        pattern p(int n) { play A4; }
        pattern p(double n) { play B4; }
        track {
            play p(1);
            play p(1.0);
        }
    )");
}

TEST(TypedPatternOverload, DuplicateSignatureIsError) {
    const auto analyzed = analyze(R"(
        pattern p(int a) { play A4; }
        pattern p(int b) { play B4; }
        track { play p(1); }
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(TypedPatternOverload, CallWithMismatchedArgumentTypeIsError) {
    const auto analyzed = analyze(R"(
        pattern p(int n) { play A4; }
        track { play p(1.0); }
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(TypedPatternOverload, ChordAndIntOverloadsResolveCorrectly) {
    analyze_ok(R"(
        track {
            pattern foo(chord c) { play c; }
            pattern foo(int n) { play A4 :n; }

            play foo((A4, C5));
            play foo(2);
        }
    )");
}

TEST(TypedPatternOverload, SameNameDifferentArityAndTypesResolve) {
    analyze_ok(R"(
        track {
            pattern foo(int a, int b, int c) { play A4; }
            pattern foo(int a, int b) { play B4; }

            play foo(1, 2, 3);
            play foo(4, 5);
        }
    )");
}

TEST(TypedPatternOverload, IntLiteralResolvesToIntOverload) {
    analyze_ok(R"(
        pattern p(int n) { play A4; }
        pattern p(double n) { play B4; }
        track { play p(1); }
    )");
}
