#pragma once

#include <cstdint>
#include <string_view>

namespace motivo::types {

enum class TypeKind : uint8_t {
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

[[nodiscard]] constexpr std::string_view type_name(const TypeKind kind) {
    switch (kind) {
        case TypeKind::Unknown:
            return "unknown";
        case TypeKind::Void:
            return "void";
        case TypeKind::Int:
            return "int";
        case TypeKind::Double:
            return "double";
        case TypeKind::Bool:
            return "bool";
        case TypeKind::Note:
            return "note";
        case TypeKind::Rest:
            return "rest";
        case TypeKind::Chord:
            return "chord";
        case TypeKind::Sequence:
            return "seq";
        case TypeKind::Drum:
            return "drum";
    }

    return "unknown";
}

}  // namespace motivo::types
