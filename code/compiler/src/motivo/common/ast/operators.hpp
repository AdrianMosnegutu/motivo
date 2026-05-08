#pragma once

#include <cstdint>

namespace motivo::ast {

enum class BinaryOperator : uint8_t {
    // Arithmetic
    Add,
    Subtract,
    Multiply,
    Divide,
    Modulo,

    // Comparative
    Equals,
    NotEquals,
    Less,
    Greater,
    LessOrEqual,
    GreaterOrEqual,

    // Logical
    And,
    Or,
};

enum class UnaryOperator : uint8_t {
    Negative,
    Not,
};

}  // namespace motivo::ast
