#include "motivo/lowering/lower.hpp"

#include <algorithm>
#include <utility>

#include "motivo/common/ast/statements.hpp"
#include "motivo/common/diagnostics/diagnostics_engine.hpp"
#include "motivo/common/ir/program.hpp"
#include "motivo/lowering/detail/ast_lowerer.hpp"
#include "motivo/lowering/lower_result.hpp"
#include "motivo/semantic/analysis_result.hpp"

namespace motivo::lowering {

LowerResult lower(const semantic::AnalysisResult& analysis, DiagnosticsEngine& diagnostics) {
    const auto& [header, globals, tracks] = analysis.program();

    const auto first_lowering_diagnostic = diagnostics.diagnostics().size();
    ir::Program out;
    detail::lower_header(header, out);

    detail::LowererContext context(analysis, diagnostics);
    context.collect_patterns(globals);
    context.execute_block = [&context](const ast::Block& block, double& current) {
        return detail::lower_block(block, context, current);
    };

    detail::LowererScopeGuard scope(context);
    for (const auto& item : globals) {
        if (const auto* stmt_ptr = std::get_if<ast::StatementPtr>(&item)) {
            if (const auto* decl = std::get_if<ast::VarDeclStatement>(&(*stmt_ptr)->kind)) {
                try {
                    detail::lower_var_decl_statement(*decl, context);
                } catch (const detail::LoweringFailure& error) {
                    context.report_lowering_error(error.what());
                }
            }
        }
    }

    for (const auto& track : tracks) {
        try {
            out.tracks.push_back(detail::lower_track_definition(track, context));
        } catch (const detail::LoweringFailure& error) {
            context.report_lowering_error(error.what());
        }
    }

    const auto& collected = diagnostics.diagnostics();
    const bool has_errors = std::ranges::any_of(collected.begin() + first_lowering_diagnostic,
                                                collected.end(),
                                                [](const Diagnostic& diagnostic) { return diagnostic.is_error(); });
    if (has_errors) {
        return LowerResult(std::nullopt);
    }

    return LowerResult(std::move(out));
}

}  // namespace motivo::lowering
