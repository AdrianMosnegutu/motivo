#include "motivo/common/ast/expressions.hpp"
#include "motivo/common/ir/values.hpp"
#include "motivo/lowering/detail/expression_evaluator.hpp"
#include "motivo/lowering/detail/lowerer_context.hpp"

namespace motivo::lowering::detail {

ir::Value evaluate_ternary_expression(const ast::TernaryExpression& ternary, LowererContext& context) {
    const bool cond = std::get<bool>(evaluate_expression(*ternary.condition, context).kind);
    return cond ? evaluate_expression(*ternary.then_expression, context)
                : evaluate_expression(*ternary.else_expression, context);
}

}  // namespace motivo::lowering::detail
