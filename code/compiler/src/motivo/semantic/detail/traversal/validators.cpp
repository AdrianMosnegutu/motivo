#include <sstream>
#include <vector>

#include "motivo/common/ast/definitions.hpp"
#include "motivo/common/types/type_rules.hpp"
#include "motivo/semantic/detail/traversal.hpp"

namespace motivo::semantic::detail {

void Traversal::validate_binary_operands(const operators::BinaryOperator op,
                                         const Type left_type,
                                         const Type right_type,
                                         const source::Location& location) const {
    using Op = operators::BinaryOperator;

    switch (op) {
        case Op::Add:
        case Op::Subtract:
        case Op::Multiply:
        case Op::Divide:
        case Op::Less:
        case Op::Greater:
        case Op::LessOrEqual:
        case Op::GreaterOrEqual: {
            validate_numeric_operand(left_type, "left", location);
            validate_numeric_operand(right_type, "right", location);

            return;
        }
        case Op::Modulo: {
            if ((is_known(left_type) && !is_integral(left_type)) ||
                (is_known(right_type) && !is_integral(right_type))) {
                diagnose(location, "modulo requires integer operands");
            }

            return;
        }
        case Op::Equals:
        case Op::NotEquals: {
            if (!is_known(left_type) || !is_known(right_type)) {
                return;
            }

            if ((is_numeric(left_type) && is_numeric(right_type)) ||
                (is_boolean(left_type) && is_boolean(right_type))) {
                return;
            }

            diagnose(location, "'==' requires numeric or boolean operands");
            return;
        }
        case Op::And:
        case Op::Or: {
            if ((is_known(left_type) && !is_boolean(left_type)) || (is_known(right_type) && !is_boolean(right_type))) {
                diagnose(location, "'&&' requires boolean operands");
            }

            return;
        }
    }

    diagnose(location, "invalid binary operator");
}

void Traversal::validate_numeric_operand(const Type type, const char* side, const source::Location& location) const {
    if (is_known(type) && !is_numeric(type)) {
        diagnose(location, std::string(side) + " operand must be numeric");
    }
}

void Traversal::validate_call(const ast::PatternCallExpression& call,
                              const source::Location& location,
                              const std::vector<Type>& argument_types) {
    const auto* symbol = scopes_.find_pattern_visible_by_signature(call.callee, argument_types);
    if (!symbol) {
        const auto* any_overload = scopes_.find_visible(call.callee, {SymbolKind::Pattern});
        if (!any_overload) {
            diagnose(location, "undefined pattern '" + call.callee + "'");
        } else {
            diagnose(location, "no matching overload of pattern '" + call.callee + "'");
        }
        return;
    }

    const auto* pattern = static_cast<const ast::PatternDefinition*>(symbol->declaration);
    if (!pattern) {
        diagnose(location, "pattern '" + call.callee + "' is missing declaration metadata");
        return;
    }

    for (std::size_t i = 0; i < pattern->params.size(); ++i) {
        if (is_known(argument_types[i]) && !is_assignable(pattern->params[i].type, argument_types[i])) {
            diagnose(location,
                     "argument " + std::to_string(i + 1) + " of pattern '" + call.callee + "' has incompatible type");
        }
    }
}

}  // namespace motivo::semantic::detail
