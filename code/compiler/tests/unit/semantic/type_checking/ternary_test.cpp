#include <gtest/gtest.h>

#include "motivo/common/types/type_kind.hpp"
#include "support/semantic_test_utils.hpp"

using namespace motivo::testing::semantic;
using motivo::types::TypeKind;

// -- Happy flows ---------------------------------------------------------------

TEST(TernaryTypeCheck, BoolConditionWithIntBranchesIsInt) {
    const auto [prog, result] = analyze_ok("bool x = true ? 1 : 2;");
    const auto& decl = std::get<motivo::ast::VarDeclStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(*t, TypeKind::Int);
}

TEST(TernaryTypeCheck, BoolConditionWithDoubleBranchesIsDouble) {
    const auto [prog, result] = analyze_ok("bool x = false ? 1.5 : 2.5;");
    const auto& decl = std::get<motivo::ast::VarDeclStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(*t, TypeKind::Double);
}

TEST(TernaryTypeCheck, BoolConditionWithBoolBranchesIsBool) {
    const auto [prog, result] = analyze_ok("bool x = true ? false : true;");
    const auto& decl = std::get<motivo::ast::VarDeclStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(*t, TypeKind::Bool);
}

TEST(TernaryTypeCheck, BoolConditionWithNoteBranchesIsNote) {
    const auto [prog, result] = analyze_ok("bool x = true ? A4 : B4;");
    const auto& decl = std::get<motivo::ast::VarDeclStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(*t, TypeKind::Note);
}

TEST(TernaryTypeCheck, NoteInsidePlayViaTernary) {
    const auto [prog, result] = analyze_ok("track { play (true ? A4 : B4); }");
}

// -- Error cases ---------------------------------------------------------------

TEST(TernaryTypeCheck, IntConditionIsError) {
    const auto analyzed = analyze("track { play (1 ? A4 : B4); }");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
    EXPECT_TRUE(has_error(analyzed.diagnostics, "ternary condition"));
}

TEST(TernaryTypeCheck, NoteConditionIsError) {
    const auto analyzed = analyze("note x = A4 ? 1 : 2;");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
    EXPECT_TRUE(has_error(analyzed.diagnostics, "ternary condition"));
}

TEST(TernaryTypeCheck, MismatchedBranchTypesIsError) {
    const auto analyzed = analyze("bool x = true ? A4 : 3;");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
    EXPECT_TRUE(has_error(analyzed.diagnostics, "ternary branches"));
}

TEST(TernaryTypeCheck, IntBranchVsDoubleBranchIsError) {
    // Int and Double are different types — branches must be identical
    const auto analyzed = analyze("bool x = true ? 1 : 2.0;");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
    EXPECT_TRUE(has_error(analyzed.diagnostics, "ternary branches"));
}

TEST(TernaryTypeCheck, ParenthesisedTernaryEvaluatingToIntIsInvalidPlayTarget) {
    const auto analyzed = analyze("track { play (true ? 1 : 2); }");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}
