#include <gtest/gtest.h>

#include "motivo/semantic/type.hpp"
#include "support/semantic_test_utils.hpp"

using namespace motivo::testing::semantic;
using motivo::semantic::TypeKind;

// -- Happy flows ---------------------------------------------------------------

TEST(UnaryTypeCheck, NegativeIntIsInt) {
    const auto [prog, result] = analyze_ok("int x = -(1);");
    const auto& decl = std::get<motivo::ast::LetStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(t->kind, TypeKind::Int);
}

TEST(UnaryTypeCheck, NegativeDoubleIsDouble) {
    const auto [prog, result] = analyze_ok("double x = -(1.5);");
    const auto& decl = std::get<motivo::ast::LetStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(t->kind, TypeKind::Double);
}

TEST(UnaryTypeCheck, NotBoolIsBool) {
    const auto [prog, result] = analyze_ok("bool x = !true;");
    const auto& decl = std::get<motivo::ast::LetStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(t->kind, TypeKind::Bool);
}

// -- Error cases ---------------------------------------------------------------

TEST(UnaryTypeCheck, NotIntIsError) {
    const auto analyzed = analyze("int x = !1;");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
    EXPECT_TRUE(has_error(analyzed.diagnostics, "boolean"));
}

TEST(UnaryTypeCheck, NegativeBoolIsError) {
    const auto analyzed = analyze("int x = -true;");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
    EXPECT_TRUE(has_error(analyzed.diagnostics, "numeric"));
}

TEST(UnaryTypeCheck, NegativeNoteIsError) {
    const auto analyzed = analyze("int x = -A4;");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
    EXPECT_TRUE(has_error(analyzed.diagnostics, "numeric"));
}

TEST(UnaryTypeCheck, NotDoubleIsError) {
    const auto analyzed = analyze("int x = !1.5;");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
    EXPECT_TRUE(has_error(analyzed.diagnostics, "boolean"));
}
