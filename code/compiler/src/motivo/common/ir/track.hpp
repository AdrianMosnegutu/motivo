#pragma once

#include <optional>
#include <string>

#include "motivo/common/ir/note_event.hpp"
#include "motivo/common/music/instrument.hpp"

namespace motivo::ir {

struct Track {
    std::optional<std::string> name;
    music::Instrument instrument{music::Instrument::Piano};
    NoteEvents events;  // sorted by start_beat after lowering
};

}  // namespace motivo::ir
