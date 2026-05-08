#pragma once

#include "motivo/common/diagnostics/diagnostics_engine.hpp"
#include "motivo/semantic/analysis_result.hpp"

namespace motivo::semantic {

[[nodiscard]] AnalysisResult analyze(const ast::Program& program, DiagnosticsEngine& diagnostics);

}  // namespace motivo::semantic
