#include "motivo/common/ast/expressions.hpp"
#include "motivo/common/ir/values.hpp"
#include "motivo/lowering/detail/expression_evaluator.hpp"
#include "motivo/lowering/detail/lowerer_context.hpp"

namespace motivo::lowering::detail {

namespace {

using ir::Value;
using ir::ValueKind;

}  // namespace

Value evaluate_unary_expression(const ast::UnaryExpression& unary,
                                const source::Location& loc,
                                LowererContext& context) {
    const ValueKind operand = evaluate_expression(*unary.operand, context).kind;

    switch (unary.operation) {
        case operators::UnaryOperator::Negative: {
            if (const auto* integer = std::get_if<int>(&operand)) {
                return Value{-*integer};
            }

            return Value{-std::get<double>(operand)};
        }
        case operators::UnaryOperator::Not: {
            return Value{!std::get<bool>(operand)};
        }
    }

    throw LoweringFailure(loc, "lowering reached invalid unary operator");
}

}  // namespace motivo::lowering::detail
