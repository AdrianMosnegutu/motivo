#pragma once

#include "motivo/common/diagnostics/diagnostics_engine.hpp"
#include "motivo/lowering/lower_result.hpp"
#include "motivo/semantic/analysis_result.hpp"

namespace motivo::lowering {

LowerResult lower(const semantic::AnalysisResult& analysis, DiagnosticsEngine& diagnostics);

}  // namespace motivo::lowering
