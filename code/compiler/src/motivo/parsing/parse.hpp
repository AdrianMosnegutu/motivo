#pragma once

#include <cstdio>
#include <string>

#include "motivo/common/diagnostics/diagnostics_engine.hpp"
#include "motivo/parsing/parse_result.hpp"

namespace motivo::parsing {

[[nodiscard]] ParseResult parse_stream(FILE* input, const std::string& source_name, DiagnosticsEngine& diagnostics);
[[nodiscard]] ParseResult parse_source(const std::string& source,
                                       const std::string& source_name,
                                       DiagnosticsEngine& diagnostics);

}  // namespace motivo::parsing
