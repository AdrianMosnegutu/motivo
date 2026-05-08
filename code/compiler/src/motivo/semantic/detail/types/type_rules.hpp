#pragma once

#include "motivo/common/ast/operators.hpp"
#include "motivo/semantic/type.hpp"

namespace motivo::semantic::detail {

[[nodiscard]] bool is_known(Type type);
[[nodiscard]] bool is_numeric(Type type);
[[nodiscard]] bool is_integral(Type type);
[[nodiscard]] bool is_boolean(Type type);
[[nodiscard]] bool is_note(Type type);
[[nodiscard]] bool same_known_type(Type left, Type right);

[[nodiscard]] Type numeric_result(Type left, Type right);
[[nodiscard]] Type binary_result_type(ast::BinaryOperator op, Type left, Type right);

}  // namespace motivo::semantic::detail
