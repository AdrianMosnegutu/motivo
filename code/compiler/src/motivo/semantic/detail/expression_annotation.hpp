#pragma once

#include <optional>

#include "motivo/semantic/symbol.hpp"
#include "motivo/semantic/type.hpp"

namespace motivo::semantic::detail {

struct ExpressionAnnotation {
    Type type;
    std::optional<SymbolId> resolved_symbol;
};

}  // namespace motivo::semantic::detail
