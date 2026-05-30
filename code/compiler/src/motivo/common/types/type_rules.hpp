#pragma once

#include "motivo/common/operators/operators.hpp"
#include "motivo/common/types/type_kind.hpp"

namespace motivo::types {

[[nodiscard]] bool is_known(TypeKind type);
[[nodiscard]] bool is_numeric(TypeKind type);
[[nodiscard]] bool is_integral(TypeKind type);
[[nodiscard]] bool is_boolean(TypeKind type);
[[nodiscard]] bool is_note(TypeKind type);
[[nodiscard]] bool same_known_type(TypeKind left, TypeKind right);

[[nodiscard]] TypeKind numeric_result(TypeKind left, TypeKind right);
[[nodiscard]] TypeKind binary_result_type(operators::BinaryOperator op, TypeKind left, TypeKind right);

}  // namespace motivo::types
