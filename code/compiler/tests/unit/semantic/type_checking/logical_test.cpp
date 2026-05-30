#include <gtest/gtest.h>

#include "motivo/semantic/type.hpp"
#include "support/semantic_test_utils.hpp"

using namespace motivo::testing::semantic;
using motivo::semantic::TypeKind;

// -- Happy flows ---------------------------------------------------------------

TEST(LogicalTypeCheck, BoolAndBoolIsBool) {
    const auto [prog, result] = analyze_ok("bool x = true && false;");
    const auto& decl = std::get<motivo::ast::LetStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(t->kind, TypeKind::Bool);
}

TEST(LogicalTypeCheck, BoolOrBoolIsBool) {
    const auto [prog, result] = analyze_ok("bool x = true || false;");
    const auto& decl = std::get<motivo::ast::LetStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(t->kind, TypeKind::Bool);
}

// -- Error cases ---------------------------------------------------------------

TEST(LogicalTypeCheck, IntAndBoolIsError) {
    const auto analyzed = analyze("int x = 1 && true;");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
    EXPECT_TRUE(has_error(analyzed.diagnostics, "'&&'"));
}

TEST(LogicalTypeCheck, BoolAndIntIsError) {
    const auto analyzed = analyze("bool x = true && 1;");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
    EXPECT_TRUE(has_error(analyzed.diagnostics, "'&&'"));
}

TEST(LogicalTypeCheck, IntOrIntIsError) {
    const auto analyzed = analyze("int x = 1 || 2;");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
    EXPECT_TRUE(has_error(analyzed.diagnostics, "boolean"));
}

TEST(LogicalTypeCheck, BoolOrDoubleIsError) {
    const auto analyzed = analyze("bool x = true || 1.5;");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
    EXPECT_TRUE(has_error(analyzed.diagnostics, "boolean"));
}

TEST(LogicalTypeCheck, NoteAndBoolIsError) {
    const auto analyzed = analyze("note x = A4 && true;");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
    EXPECT_TRUE(has_error(analyzed.diagnostics, "'&&'"));
}
