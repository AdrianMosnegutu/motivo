#include "motivo/lowering/detail/ast_lowerer.hpp"
#include "motivo/lowering/detail/expression_evaluator.hpp"

namespace motivo::lowering::detail {

void lower_assign_statement(const ast::AssignStatement& stmt, const source::Location& loc, LowererContext& ctx) {
    ctx.assign(ctx.analysis().get_assign_target(stmt), evaluate_expression(*stmt.value, ctx), loc);
}

void lower_var_decl_statement(const ast::VarDeclStatement& stmt, LowererContext& ctx) {
    const auto* symbol = ctx.analysis().get_symbol_by_declaration(&stmt);
    if (!symbol) {
        throw LoweringFailure(stmt.value->location, "lowering reached var declaration with no symbol annotation");
    }

    ctx.bind(symbol->id, evaluate_expression(*stmt.value, ctx));
}

}  // namespace motivo::lowering::detail
