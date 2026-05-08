#include "motivo/lowering/lower_result.hpp"

namespace motivo::lowering {

LowerResult::LowerResult(std::optional<ir::Program> program) : program_(std::move(program)) {}

bool LowerResult::ok() const { return program_.has_value(); }

const std::optional<ir::Program>& LowerResult::program() const { return program_; }

}  // namespace motivo::lowering
