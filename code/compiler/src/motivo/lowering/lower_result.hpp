#pragma once

#include <optional>

#include "motivo/common/ir/program.hpp"

namespace motivo::lowering {

class LowerResult {
   public:
    explicit LowerResult(std::optional<ir::Program> program);

    [[nodiscard]] bool ok() const;
    [[nodiscard]] const std::optional<ir::Program>& program() const;

   private:
    std::optional<ir::Program> program_;
};

}  // namespace motivo::lowering
