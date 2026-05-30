#pragma once

#include "motivo/common/operators/operators.hpp"
#include "motivo/common/types/type.hpp"

namespace motivo::types {

[[nodiscard]] bool is_known(Type type);
[[nodiscard]] bool is_numeric(Type type);
[[nodiscard]] bool is_integral(Type type);
[[nodiscard]] bool is_boolean(Type type);
[[nodiscard]] bool is_note(Type type);
[[nodiscard]] bool same_known_type(Type left, Type right);

[[nodiscard]] bool is_assignable(Type target, Type source);

[[nodiscard]] Type numeric_result(Type left, Type right);
[[nodiscard]] Type binary_result_type(operators::BinaryOperator op, Type left, Type right);

}  // namespace motivo::types
