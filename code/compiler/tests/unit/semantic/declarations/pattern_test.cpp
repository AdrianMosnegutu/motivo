#include <gtest/gtest.h>

#include "support/semantic_test_utils.hpp"

using namespace motivo::testing::semantic;

// -- Basic pattern declarations ------------------------------------------------

TEST(PatternDeclaration, ParameterlessPatternIsValid) {
    const auto [prog, result] = analyze_ok(R"(
        pattern melody() { play A4; }
        track { play melody(); }
    )");
}

TEST(PatternDeclaration, PatternWithOneParameterIsValid) {
    const auto [prog, result] = analyze_ok(R"(
        pattern p(int n) { int x = n + 1; }
        track { play p(3); }
    )");
}

TEST(PatternDeclaration, PatternWithMultipleParametersIsValid) {
    const auto [prog, result] = analyze_ok(R"(
        pattern p(int a, int b) { int x = a + b; }
        track { play p(1, 2); }
    )");
}

// -- Pattern call arity --------------------------------------------------------

TEST(PatternDeclaration, CallingPatternWithWrongArityIsError) {
    const auto analyzed = analyze(R"(
        pattern p(int a, int b) { int x = a + b; }
        track { play p(1); }
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(PatternDeclaration, CallingPatternWithExtraArgsIsError) {
    const auto analyzed = analyze(R"(
        pattern p() { play A4; }
        track { play p(1); }
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(PatternDeclaration, CallingUndeclaredPatternIsError) {
    const auto analyzed = analyze(R"(
        track { play melody(); }
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(PatternDeclaration, CallingPatternShouldResolveByArity) {
    const auto analyzed = analyze_ok(R"(
        track {
            pattern foo(int a, int b, int c) {
                play A4;
            }

            pattern foo(int a, int b) {
                play B4;
            }

            play foo(1, 2, 3);
            play foo(4, 5);
        }
    )");
}

TEST(PatternDeclaration, CallingPatternShouldResolveByArityUsingComplexParams) {
    const auto analyzed = analyze_ok(R"(
        track lead_piano using piano {
           pattern foo(chord chord1, chord chord2, chord chord3) {
              play [chord1, chord1, chord2:0.5, chord3:0.5];
           }

           pattern foo(chord chord1, chord chord2) {
              play foo(chord1, chord1, chord2);
           }

           play foo((F3, A3, D4), (A3, C4, E4));
           play foo((A#3, D4, F4), (G4, D4));
           play foo((E4, C4, A3), (D4, A3), (C4, G3));

           play foo((F3, A#3, D4), (A#3, D4), (A#3, E4));
           play foo((A3, C4, F4), (F4, C4), (C4, G4));
           play foo((A3, C4, E4), (A3, D4), (G3, C4));
        }
    )");
}

// -- Pattern local typed declarations ------------------------------------------

TEST(PatternDeclaration, PatternLocalVarDeclIsVisible) {
    const auto [prog, result] = analyze_ok(R"(
        pattern p() {
            int x = 1;
            int y = x + 2;
        }
        track { play p(); }
    )");
}

// -- Pattern overloading -------------------------------------------------------

TEST(PatternDeclaration, PatternOverloadByTypeIsValid) {
    const auto [prog, result] = analyze_ok(R"(
        pattern p() { play A4; }
        pattern p(int n) { play A4; }
        pattern p(double n) { play B4; }
        track {
            play p();
            play p(2);
            play p(2.0);
        }
    )");
}

TEST(PatternDeclaration, DuplicatePatternSignatureIsError) {
    const auto analyzed = analyze(R"(
        pattern p(int a) { play A4; }
        pattern p(int b) { play B4; }
        track { play p(1); }
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}
