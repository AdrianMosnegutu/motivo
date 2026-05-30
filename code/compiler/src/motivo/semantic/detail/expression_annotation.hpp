#pragma once

#include <optional>

#include "motivo/semantic/symbol.hpp"

namespace motivo::semantic::detail {

struct ExpressionAnnotation {
    TypeKind type = TypeKind::Unknown;
    std::optional<SymbolId> resolved_symbol;
};

}  // namespace motivo::semantic::detail
