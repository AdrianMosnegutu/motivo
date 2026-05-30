#include <gtest/gtest.h>

#include "motivo/common/types/type.hpp"
#include "support/semantic_test_utils.hpp"

using namespace motivo::testing::semantic;
using motivo::types::Type;

// -- Happy flows: result type is Bool -----------------------------------------

TEST(ComparisonTypeCheck, IntLessThanIntIsBool) {
    const auto [prog, result] = analyze_ok("bool x = 1 < 2;");
    const auto& decl =
        std::get<motivo::ast::VarDeclStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(*t, Type::Bool);
}

TEST(ComparisonTypeCheck, DoubleGreaterThanDoubleIsBool) {
    const auto [prog, result] = analyze_ok("bool x = 2.5 > 1.5;");
    const auto& decl =
        std::get<motivo::ast::VarDeclStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(*t, Type::Bool);
}

TEST(ComparisonTypeCheck, IntLessOrEqualDoubleIsBool) {
    const auto [prog, result] = analyze_ok("bool x = 1 <= 2.5;");
    const auto& decl =
        std::get<motivo::ast::VarDeclStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(*t, Type::Bool);
}

TEST(ComparisonTypeCheck, IntGreaterOrEqualIntIsBool) {
    const auto [prog, result] = analyze_ok("bool x = 5 >= 3;");
    const auto& decl =
        std::get<motivo::ast::VarDeclStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(*t, Type::Bool);
}

TEST(ComparisonTypeCheck, IntEqualsIntIsBool) {
    const auto [prog, result] = analyze_ok("bool x = 1 == 1;");
    const auto& decl =
        std::get<motivo::ast::VarDeclStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(*t, Type::Bool);
}

TEST(ComparisonTypeCheck, BoolEqualsBoolIsBool) {
    const auto [prog, result] = analyze_ok("bool x = true == false;");
    const auto& decl =
        std::get<motivo::ast::VarDeclStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(*t, Type::Bool);
}

TEST(ComparisonTypeCheck, IntNotEqualsIntIsBool) {
    const auto [prog, result] = analyze_ok("bool x = 1 != 2;");
    const auto& decl =
        std::get<motivo::ast::VarDeclStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(*t, Type::Bool);
}

// -- Error cases ---------------------------------------------------------------

TEST(ComparisonTypeCheck, NoteLessThanNoteIsError) {
    const auto analyzed = analyze("note x = A4 < B4;");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(ComparisonTypeCheck, NoteGreaterThanNoteIsError) {
    const auto analyzed = analyze("note x = A4 > B4;");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(ComparisonTypeCheck, BoolLessThanBoolIsError) {
    const auto analyzed = analyze("bool x = true < false;");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}

TEST(ComparisonTypeCheck, NoteEqualsNoteIsError) {
    const auto analyzed = analyze("note x = A4 == B4;");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
    EXPECT_TRUE(has_error(analyzed.diagnostics, "'=='"));
}

TEST(ComparisonTypeCheck, NoteNotEqualsNoteIsError) {
    const auto analyzed = analyze("note x = A4 != B4;");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
    EXPECT_TRUE(has_error(analyzed.diagnostics, "'=='"));
}

TEST(ComparisonTypeCheck, IntEqualsBoolIsError) {
    const auto analyzed = analyze("int x = 1 == true;");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
    EXPECT_TRUE(has_error(analyzed.diagnostics, "'=='"));
}

TEST(ComparisonTypeCheck, BoolLessThanIntIsError) {
    const auto analyzed = analyze("bool x = true < 1;");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
}
