#include <gtest/gtest.h>

#include <optional>
#include <variant>

#include "motivo/common/ast/definitions.hpp"
#include "motivo/common/ast/expressions.hpp"
#include "motivo/common/ast/program.hpp"
#include "motivo/common/ast/statements.hpp"
#include "support/semantic_test_utils.hpp"

using namespace motivo::testing::semantic;

namespace {

using motivo::ast::Expression;
using motivo::ast::PatternCallExpression;
using motivo::ast::PatternDefinition;
using motivo::ast::PlayStatement;
using motivo::ast::Program;
using motivo::ast::Statement;
using motivo::ast::StatementPtr;

const PatternDefinition* find_track_pattern(const Program& program, const std::string& name) {
    for (const auto& track : program.tracks) {
        for (const auto& item : track.body) {
            if (const auto* pattern = std::get_if<PatternDefinition>(&item)) {
                if (pattern->name == name) {
                    return pattern;
                }
            }
        }
    }
    return nullptr;
}

const Expression* find_pattern_call_in_play(const PlayStatement& play, const std::string& callee) {
    if (const auto* expression = std::get_if<motivo::ast::ExpressionPtr>(&play.target.source)) {
        if (*expression && std::holds_alternative<PatternCallExpression>((*expression)->kind)) {
            const auto& call = std::get<PatternCallExpression>((*expression)->kind);
            if (call.callee == callee) {
                return expression->get();
            }
        }
    }
    return nullptr;
}

const Expression* find_pattern_call_in_statement(const Statement& statement, const std::string& callee) {
    if (const auto* play = std::get_if<PlayStatement>(&statement.kind)) {
        return find_pattern_call_in_play(*play, callee);
    }
    return nullptr;
}

const Expression* find_first_pattern_call(const Program& program, const std::string& callee) {
    for (const auto& item : program.globals) {
        if (const auto* statement_ptr = std::get_if<StatementPtr>(&item)) {
            if (*statement_ptr) {
                if (const Expression* found = find_pattern_call_in_statement(**statement_ptr, callee)) {
                    return found;
                }
            }
        }
    }

    for (const auto& track : program.tracks) {
        for (const auto& item : track.body) {
            if (const auto* statement_ptr = std::get_if<StatementPtr>(&item)) {
                if (*statement_ptr) {
                    if (const Expression* found = find_pattern_call_in_statement(**statement_ptr, callee)) {
                        return found;
                    }
                }
            }
        }
    }

    return nullptr;
}

}  // namespace

// -- Strict typing (no widening) ------------------------------------------------

TEST(StrictTyping, DoubleDeclWithIntTernaryBranchesIsError) {
    const auto analyzed = analyze("double x = true ? 1 : 2;");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(StrictTyping, IntVariableCannotCallDoubleOnlyPattern) {
    const auto analyzed = analyze(R"(
        pattern p(double n) { play A4 :n; }
        track {
            int x = 1;
            play p(x);
        }
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(StrictTyping, DoubleVariableCannotCallIntOnlyPattern) {
    const auto analyzed = analyze(R"(
        pattern p(int n) { play A4 :n; }
        track {
            double x = 1.0;
            play p(x);
        }
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(StrictTyping, IntLiteralDoesNotMatchDoubleOnlyPattern) {
    const auto analyzed = analyze(R"(
        pattern p(double n) { play A4 :n; }
        track { play p(1); }
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(StrictTyping, IntAndDoubleOverloadsResolveByExactArgumentType) {
    analyze_ok(R"(
        pattern p(int n) { play A4 :n; }
        pattern p(double n) { play B4 :n; }
        track {
            play p(1);
            play p(1.0);
        }
    )");
}

// -- Pattern resolution ---------------------------------------------------------

TEST(TypingEdgeCases, TrackLocalPatternWinsOverGlobalWithSameSignature) {
    const auto [prog, result] = analyze_ok(R"(
        pattern p(int n) { play A4 :n; }
        track {
            pattern p(int n) { play B4 :n; }
            play p(1);
        }
    )");

    const PatternDefinition* inner = find_track_pattern(*prog, "p");
    ASSERT_NE(inner, nullptr);

    const Expression* call = find_first_pattern_call(*prog, "p");
    ASSERT_NE(call, nullptr);

    const std::optional<motivo::semantic::SymbolId> resolved = result.get_resolved_symbol(*call);
    ASSERT_TRUE(resolved.has_value());

    const motivo::semantic::Symbol* symbol = result.get_symbol_by_id(*resolved);
    ASSERT_NE(symbol, nullptr);
    EXPECT_EQ(symbol->declaration, inner);
}

TEST(TypingEdgeCases, NoMatchingOverloadWhenArgumentTypesAreStrict) {
    const auto analyzed = analyze(R"(
        pattern p(int a, double b) { play A4; }
        pattern p(double a, int b) { play B4; }
        track { play p(1, 1); }
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
    EXPECT_TRUE(has_error(analyzed.diagnostics, "no matching overload"));
}

// -- Musical pattern parameters -------------------------------------------------

TEST(TypingEdgeCases, PatternNoteParamCanBePlayed) {
    analyze_ok(R"(
        pattern p(note n) { play n; }
        track { play p(A4); }
    )");
}

TEST(TypingEdgeCases, PatternNoteParamUsedInNumericContextIsError) {
    const auto analyzed = analyze(R"(
        pattern p(note n) { int x = n + 1; }
        track { play p(A4); }
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(TypingEdgeCases, PatternSeqParamCanBePlayed) {
    analyze_ok(R"(
        pattern p(seq s) { play s; }
        track { play p([A4, B4]); }
    )");
}

TEST(TypingEdgeCases, PatternSeqParamCalledWithChordIsError) {
    const auto analyzed = analyze(R"(
        pattern p(seq s) { play s; }
        track { play p((A4, C5)); }
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(TypingEdgeCases, PatternSeqParamCalledWithSeqVariableIsValid) {
    analyze_ok(R"(
        pattern p(seq s) { play s; }
        track {
            seq melody = [A4, B4];
            play p(melody);
        }
    )");
}

TEST(TypingEdgeCases, PatternChordParamCalledWithSeqVariableIsError) {
    const auto analyzed = analyze(R"(
        pattern p(chord c) { play c; }
        track {
            seq s = [A4, B4];
            play p(s);
        }
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(TypingEdgeCases, PlayTypedMusicalVariables) {
    analyze_ok(R"(
        note pitch = A4;
        chord harmony = (A4, C5);
        seq melody = [A4, B4];
        track {
            play pitch;
            play harmony;
            play melody;
        }
    )");
}
