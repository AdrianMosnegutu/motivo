#include <gtest/gtest.h>

#include "motivo/common/types/type_kind.hpp"
#include "support/semantic_test_utils.hpp"

using namespace motivo::testing::semantic;
using motivo::types::TypeKind;

// -- Basic typed declarations --------------------------------------------------

TEST(VarDecl, IntLiteralMatchesDeclaredType) {
    const auto [prog, result] = analyze_ok("int x = 42;");
    const auto& decl =
        std::get<motivo::ast::VarDeclStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(*t, TypeKind::Int);
}

TEST(VarDecl, DoubleLiteralMatchesDeclaredType) {
    const auto [prog, result] = analyze_ok("double x = 1.5;");
    const auto& decl =
        std::get<motivo::ast::VarDeclStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(*t, TypeKind::Double);
}

TEST(VarDecl, BoolLiteralMatchesDeclaredType) {
    const auto [prog, result] = analyze_ok("bool x = true;");
    const auto& decl =
        std::get<motivo::ast::VarDeclStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(*t, TypeKind::Bool);
}

TEST(VarDecl, NoteLiteralMatchesDeclaredType) {
    const auto [prog, result] = analyze_ok("note x = A4;");
    const auto& decl =
        std::get<motivo::ast::VarDeclStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(*t, TypeKind::Note);
}

TEST(VarDecl, ChordLiteralMatchesDeclaredType) {
    const auto [prog, result] = analyze_ok("chord c = (A4, C5);");
    const auto& decl =
        std::get<motivo::ast::VarDeclStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(*t, TypeKind::Chord);
}

TEST(VarDecl, SequenceLiteralMatchesDeclaredType) {
    const auto [prog, result] = analyze_ok("seq s = [A4, B4];");
    const auto& decl =
        std::get<motivo::ast::VarDeclStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(*t, TypeKind::Sequence);
}

// -- Declarations with complex expressions -------------------------------------

TEST(VarDecl, IntDeclWithIntExpressionIsValid) {
    const auto [prog, result] = analyze_ok("int x = 1 + 2;");
    const auto& decl =
        std::get<motivo::ast::VarDeclStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(*t, TypeKind::Int);
}

TEST(VarDecl, IntDeclBoundToAnotherIntIdentifierIsValid) {
    analyze_ok(R"(
        int a = 5;
        int b = a;
    )");
}

TEST(VarDecl, DoubleDeclWithIntLiteralIsError) {
    EXPECT_TRUE(has_semantic_error(analyze("double x = 1;").diagnostics));
}

TEST(VarDecl, DoubleDeclWithDoubleLiteralIsValid) { analyze_ok("double x = 1.0;"); }

TEST(VarDecl, DoubleDeclWithTernaryIsValid) {
    const auto [prog, result] = analyze_ok("double x = true ? 1.3 : 2.4;");
    const auto& decl =
        std::get<motivo::ast::VarDeclStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(*t, TypeKind::Double);
}

// -- Type mismatches on declaration --------------------------------------------

TEST(VarDecl, IntDeclWithDoubleLiteralIsError) {
    const auto analyzed = analyze("int x = 1.5;");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(VarDecl, BoolDeclWithIntLiteralIsError) {
    const auto analyzed = analyze("bool x = 1;");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(VarDecl, NoteDeclWithIntLiteralIsError) {
    const auto analyzed = analyze("note x = 42;");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

// -- Redeclaration -------------------------------------------------------------

TEST(VarDecl, RedeclarationInSameScopeIsError) {
    const auto analyzed = analyze(R"(
        int x = 1;
        int x = 2;
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(VarDecl, RedeclarationInSameTrackScopeIsError) {
    const auto analyzed = analyze(R"(
        track {
            int x = 1;
            int x = 2;
        }
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(VarDecl, RedeclarationInSamePatternScopeIsError) {
    const auto analyzed = analyze(R"(
        track {
            pattern foo() {
                int x = 1;
                int x = 2;
            }
        }
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(VarDecl, RedeclarationInSameVoiceScopeIsError) {
    const auto analyzed = analyze(R"(
        track {
            voice {
                int x = 1;
                int x = 2;
            }
        }
    )");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

// -- For-init typed declaration ------------------------------------------------

TEST(VarDecl, ForInitTypedDeclarationIsValid) {
    analyze_ok(R"(
        track {
            for (int i = 0; i < 4; i = i + 1) { play A4; }
        }
    )");
}
