#pragma once

#include <optional>

#include "motivo/common/source/location.hpp"

namespace motivo::ast {

struct SignatureDeclaration {
    int beats{};
    int unit{};
    source::Location location;
};

struct TempoDeclaration {
    int beats_per_minute{};
    source::Location location;
};

struct Header {
    std::optional<TempoDeclaration> tempo;
    std::optional<SignatureDeclaration> signature;
};

}  // namespace motivo::ast
