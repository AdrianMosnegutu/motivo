#pragma once

#include <string>

#include "motivo/common/ir/program.hpp"

namespace motivo::midi {

void write_midi(const ir::Program& program, const std::string& output_path);

}  // namespace motivo::midi
