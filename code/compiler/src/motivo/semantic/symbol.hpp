#pragma once

#include <cstddef>
#include <limits>
#include <string>

#include "motivo/common/source/location.hpp"
#include "motivo/semantic/type.hpp"

namespace motivo::semantic {

using SymbolId = std::size_t;

inline constexpr SymbolId INVALID_SYMBOL_ID = std::numeric_limits<SymbolId>::max();

enum class SymbolKind {
    Variable,
    Parameter,
    Pattern,
    Track,
    Voice,
};

struct Symbol {
    SymbolId id = INVALID_SYMBOL_ID;
    std::string name;
    SymbolKind kind = SymbolKind::Variable;
    Type type;
    source::Location location;
    const void* declaration = nullptr;
    std::size_t scope_id = std::numeric_limits<std::size_t>::max();
};

}  // namespace motivo::semantic
