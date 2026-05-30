#include <gtest/gtest.h>

#include "motivo/common/types/type.hpp"
#include "support/semantic_test_utils.hpp"

using namespace motivo::testing::semantic;
using motivo::types::Type;

// -- Happy flows: result type annotation --------------------------------------

TEST(ArithmeticTypeCheck, IntPlusIntIsInt) {
    const auto [prog, result] = analyze_ok("int x = 1 + 2;");
    const auto& decl =
        std::get<motivo::ast::VarDeclStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(*t, Type::Int);
}

TEST(ArithmeticTypeCheck, IntPlusDoubleIsDouble) {
    const auto [prog, result] = analyze_ok("double x = 1 + 2.5;");
    const auto& decl =
        std::get<motivo::ast::VarDeclStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(*t, Type::Double);
}

TEST(ArithmeticTypeCheck, DoublePlusIntIsDouble) {
    const auto [prog, result] = analyze_ok("double x = 2.5 + 1;");
    const auto& decl =
        std::get<motivo::ast::VarDeclStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(*t, Type::Double);
}

TEST(ArithmeticTypeCheck, DoublePlusDoubleIsDouble) {
    const auto [prog, result] = analyze_ok("double x = 1.5 + 2.5;");
    const auto& decl =
        std::get<motivo::ast::VarDeclStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(*t, Type::Double);
}

TEST(ArithmeticTypeCheck, IntMinusIntIsInt) {
    const auto [prog, result] = analyze_ok("int x = 5 - 3;");
    const auto& decl =
        std::get<motivo::ast::VarDeclStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(*t, Type::Int);
}

TEST(ArithmeticTypeCheck, IntMultiplyDoubleIsDouble) {
    const auto [prog, result] = analyze_ok("double x = 2 * 1.5;");
    const auto& decl =
        std::get<motivo::ast::VarDeclStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(*t, Type::Double);
}

TEST(ArithmeticTypeCheck, IntDivideIntIsInt) {
    const auto [prog, result] = analyze_ok("int x = 6 / 2;");
    const auto& decl =
        std::get<motivo::ast::VarDeclStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(*t, Type::Int);
}

TEST(ArithmeticTypeCheck, IntDivideDoubleIsDouble) {
    const auto [prog, result] = analyze_ok("double x = 6 / 2.0;");
    const auto& decl =
        std::get<motivo::ast::VarDeclStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(*t, Type::Double);
}

TEST(ArithmeticTypeCheck, DoubleDivideIntIsDouble) {
    const auto [prog, result] = analyze_ok("double x = 6.0 / 2;");
    const auto& decl =
        std::get<motivo::ast::VarDeclStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(*t, Type::Double);
}

TEST(ArithmeticTypeCheck, DoubleDivideDoubleIsDouble) {
    const auto [prog, result] = analyze_ok("double x = 6.0 / 2.0;");
    const auto& decl =
        std::get<motivo::ast::VarDeclStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(*t, Type::Double);
}

TEST(ArithmeticTypeCheck, IntModuloIntIsInt) {
    const auto [prog, result] = analyze_ok("int x = 7 % 3;");
    const auto& decl =
        std::get<motivo::ast::VarDeclStatement>(std::get<motivo::ast::StatementPtr>(prog->globals[0])->kind);
    const auto t = result.get_expression_type(*decl.value);
    ASSERT_TRUE(t.has_value());
    EXPECT_EQ(*t, Type::Int);
}

// -- Error cases ---------------------------------------------------------------

TEST(ArithmeticTypeCheck, BoolPlusIntIsError) {
    const auto analyzed = analyze("bool x = true + 1;");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
    EXPECT_TRUE(has_error(analyzed.diagnostics, "numeric"));
}

TEST(ArithmeticTypeCheck, IntPlusBoolIsError) {
    const auto analyzed = analyze("int x = 1 + true;");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
    EXPECT_TRUE(has_error(analyzed.diagnostics, "numeric"));
}

TEST(ArithmeticTypeCheck, NotePlusIntIsError) {
    const auto analyzed = analyze("note x = A4 + 1;");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
    EXPECT_TRUE(has_error(analyzed.diagnostics, "numeric"));
}

TEST(ArithmeticTypeCheck, IntPlusNoteIsError) {
    const auto analyzed = analyze("int x = 1 + A4;");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
    EXPECT_TRUE(has_error(analyzed.diagnostics, "numeric"));
}

TEST(ArithmeticTypeCheck, DoubleModuloIntIsError) {
    const auto analyzed = analyze("double x = 1.5 % 1;");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
    EXPECT_TRUE(has_error(analyzed.diagnostics, "modulo"));
}

TEST(ArithmeticTypeCheck, IntModuloDoubleIsError) {
    const auto analyzed = analyze("int x = 3 % 1.5;");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
    EXPECT_TRUE(has_error(analyzed.diagnostics, "modulo"));
}

TEST(ArithmeticTypeCheck, DoubleModuloDoubleIsError) {
    const auto analyzed = analyze("double x = 1.5 % 2.5;");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
    EXPECT_TRUE(has_error(analyzed.diagnostics, "modulo"));
}

TEST(ArithmeticTypeCheck, ModuloWithKnownDoubleVariableIsError) {
    const auto analyzed = analyze("double d = 1.5; int x = d % 2;");
    EXPECT_TRUE(has_semantic_error(analyzed.diagnostics));
    EXPECT_TRUE(has_error(analyzed.diagnostics, "modulo"));
}
