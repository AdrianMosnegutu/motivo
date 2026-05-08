#include "motivo/semantic/analyze.hpp"

#include "motivo/common/ast/program.hpp"
#include "motivo/semantic/detail/traversal.hpp"

namespace motivo::semantic {

AnalysisResult analyze(const ast::Program& program, DiagnosticsEngine& diagnostics) {
    AnalysisResult result(program);
    detail::Traversal(result, diagnostics).run(program);

    return result;
}

}  // namespace motivo::semantic
