#include "motivo/common/types/type_rules.hpp"

namespace motivo::types {

bool is_known(const TypeKind type) { return type != TypeKind::Unknown; }

bool is_numeric(const TypeKind type) { return type == TypeKind::Int || type == TypeKind::Double; }

bool is_integral(const TypeKind type) { return type == TypeKind::Int; }

bool is_boolean(const TypeKind type) { return type == TypeKind::Bool; }

bool is_note(const TypeKind type) { return type == TypeKind::Note; }

bool same_known_type(const TypeKind left, const TypeKind right) {
    return is_known(left) && is_known(right) && left == right;
}

bool is_assignable(const TypeKind target, const TypeKind source) { return target == source; }

TypeKind numeric_result(const TypeKind left, const TypeKind right) {
    if (!is_numeric(left) || !is_numeric(right)) {
        return TypeKind::Unknown;
    }

    return left == TypeKind::Double || right == TypeKind::Double ? TypeKind::Double : TypeKind::Int;
}

TypeKind binary_result_type(const operators::BinaryOperator op, const TypeKind left, const TypeKind right) {
    using Op = operators::BinaryOperator;

    switch (op) {
        case Op::Add:
        case Op::Subtract:
        case Op::Multiply:
        case Op::Divide: {
            return numeric_result(left, right);
        }
        case Op::Modulo: {
            return is_integral(left) && is_integral(right) ? TypeKind::Int : TypeKind::Unknown;
        }
        case Op::Equals:
        case Op::NotEquals:
        case Op::Less:
        case Op::Greater:
        case Op::LessOrEqual:
        case Op::GreaterOrEqual:
        case Op::And:
        case Op::Or: {
            return TypeKind::Bool;
        }
    }

    return TypeKind::Unknown;
}

}  // namespace motivo::types
