#include "motivo/common/types/type_rules.hpp"

namespace motivo::types {

bool is_known(const Type type) { return type != Type::Unknown; }

bool is_numeric(const Type type) { return type == Type::Int || type == Type::Double; }

bool is_integral(const Type type) { return type == Type::Int; }

bool is_boolean(const Type type) { return type == Type::Bool; }

bool is_note(const Type type) { return type == Type::Note; }

bool same_known_type(const Type left, const Type right) { return is_known(left) && is_known(right) && left == right; }

bool is_assignable(const Type target, const Type source) { return target == source; }

Type numeric_result(const Type left, const Type right) {
    if (!is_numeric(left) || !is_numeric(right)) {
        return Type::Unknown;
    }

    return left == Type::Double || right == Type::Double ? Type::Double : Type::Int;
}

Type binary_result_type(const operators::BinaryOperator op, const Type left, const Type right) {
    using Op = operators::BinaryOperator;

    switch (op) {
        case Op::Add:
        case Op::Subtract:
        case Op::Multiply:
        case Op::Divide: {
            return numeric_result(left, right);
        }
        case Op::Modulo: {
            return is_integral(left) && is_integral(right) ? Type::Int : Type::Unknown;
        }
        case Op::Equals:
        case Op::NotEquals:
        case Op::Less:
        case Op::Greater:
        case Op::LessOrEqual:
        case Op::GreaterOrEqual:
        case Op::And:
        case Op::Or: {
            return Type::Bool;
        }
    }

    return Type::Unknown;
}

}  // namespace motivo::types
