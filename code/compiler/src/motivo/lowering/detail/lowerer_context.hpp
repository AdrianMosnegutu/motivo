#pragma once

#include <functional>
#include <stdexcept>
#include <unordered_map>
#include <vector>

#include "motivo/common/ast/program.hpp"
#include "motivo/common/ast/statements.hpp"
#include "motivo/common/diagnostics/diagnostics_engine.hpp"
#include "motivo/common/ir/note_event.hpp"
#include "motivo/common/ir/values.hpp"
#include "motivo/common/source/location.hpp"
#include "motivo/semantic/analysis_result.hpp"
#include "motivo/semantic/symbol.hpp"

namespace motivo::lowering::detail {

class LoweringFailure final : public std::runtime_error {
   public:
    LoweringFailure(const source::Location& loc, const std::string& msg);
};

class LowererContext {
   public:
    static constexpr std::size_t MAX_EVENTS = 20000;

    using Scope = std::unordered_map<semantic::SymbolId, ir::Value>;
    using PatternMap = std::unordered_map<semantic::SymbolId, const ast::PatternDefinition*>;
    using BlockExecutor = std::function<std::vector<ir::NoteEvent>(const ast::Block&, double&)>;

    explicit LowererContext(const semantic::AnalysisResult& analysis, DiagnosticsEngine& diagnostics);

    BlockExecutor execute_block;

    [[nodiscard]] const semantic::AnalysisResult& analysis() const;

    void push_scope();
    void pop_scope();

    void bind(semantic::SymbolId id, ir::Value val);
    void assign(semantic::SymbolId id, ir::Value val, const source::Location& loc);
    [[nodiscard]] const ir::Value& lookup(semantic::SymbolId id, const source::Location& loc) const;

    void collect_patterns(const std::vector<ast::GlobalItem>& globals);
    void collect_track_patterns(const std::vector<ast::TrackItem>& items);
    void erase_track_patterns(const std::vector<ast::TrackItem>& items);
    void collect_voice_patterns(const std::vector<ast::VoiceItem>& items);
    void erase_voice_patterns(const std::vector<ast::VoiceItem>& items);

    [[nodiscard]] const ast::PatternDefinition* find_pattern(semantic::SymbolId id) const;

    void register_events(std::size_t count, const source::Location& loc);
    void report_lowering_error(std::string message);

   private:
    const semantic::AnalysisResult& analysis_;
    DiagnosticsEngine& diagnostics_;
    std::vector<Scope> scope_stack_;
    PatternMap patterns_;
    std::size_t total_events_ = 0;
};

class LowererScopeGuard {
   public:
    explicit LowererScopeGuard(LowererContext& ctx);
    ~LowererScopeGuard();

    LowererScopeGuard(const LowererScopeGuard&) = delete;
    LowererScopeGuard& operator=(const LowererScopeGuard&) = delete;

   private:
    LowererContext& ctx_;
};

}  // namespace motivo::lowering::detail
