#pragma once

#include <variant>
#include <vector>

#include "motivo/common/ast/declarations.hpp"
#include "motivo/common/ast/definitions.hpp"
#include "motivo/common/ast/statements.hpp"

namespace motivo::ast {

using GlobalItem = std::variant<StatementPtr, PatternDefinition>;

struct Program {
    Header header;
    std::vector<GlobalItem> globals;
    std::vector<TrackDefinition> tracks;
};

}  // namespace motivo::ast
