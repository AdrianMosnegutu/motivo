#pragma once

#include <optional>
#include <string>
#include <vector>

#include "motivo/common/ast/statements.hpp"
#include "motivo/common/music/instrument.hpp"
#include "motivo/common/source/location.hpp"
#include "motivo/common/types/type.hpp"

namespace motivo::ast {

// -- Pattern ----------------------------------------------------------------------------------------------------------

struct TypedParameter {
    types::Type type = types::Type::Int;
    std::string name;
    source::Location location;
};

struct PatternDefinition {
    std::string name;
    std::vector<TypedParameter> params;
    Block body;
    source::Location location;
};

// -- Voice ------------------------------------------------------------------------------------------------------------

using VoiceItem = std::variant<StatementPtr, PatternDefinition>;

struct VoiceDefinition {
    std::optional<ExpressionPtr> from_expression;
    std::vector<VoiceItem> body;
    source::Location location;
};

// -- Track ------------------------------------------------------------------------------------------------------------

using TrackItem = std::variant<StatementPtr, PatternDefinition, VoiceDefinition>;

struct TrackDefinition {
    std::optional<std::string> name;
    std::optional<music::Instrument> instrument;
    std::vector<TrackItem> body;
    source::Location location;
};

}  // namespace motivo::ast
