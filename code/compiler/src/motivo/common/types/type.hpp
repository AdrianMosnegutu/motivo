#pragma once

#include <cstdint>
#include <string_view>

namespace motivo::types {

enum class Type : uint8_t {
    Unknown,
    Void,
    Int,
    Double,
    Bool,
    Note,
    Rest,
    Chord,
    Sequence,
    Drum,
};

[[nodiscard]] constexpr std::string_view type_name(const Type kind) {
    switch (kind) {
        case Type::Unknown:
            return "unknown";
        case Type::Void:
            return "void";
        case Type::Int:
            return "int";
        case Type::Double:
            return "double";
        case Type::Bool:
            return "bool";
        case Type::Note:
            return "note";
        case Type::Rest:
            return "rest";
        case Type::Chord:
            return "chord";
        case Type::Sequence:
            return "seq";
        case Type::Drum:
            return "drum";
    }

    return "unknown";
}

}  // namespace motivo::types
