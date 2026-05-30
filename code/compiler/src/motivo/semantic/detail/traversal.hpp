#pragma once

#include <optional>
#include <vector>

#include "motivo/common/ast/statements.hpp"
#include "motivo/common/diagnostics/diagnostics_engine.hpp"
#include "motivo/common/music/instrument.hpp"
#include "motivo/common/source/location.hpp"
#include "motivo/common/types/type_rules.hpp"
#include "motivo/semantic/analysis_result.hpp"
#include "motivo/semantic/detail/scopes/scope_stack.hpp"

namespace motivo::semantic::detail {

using types::binary_result_type;
using types::is_assignable;
using types::is_boolean;
using types::is_integral;
using types::is_known;
using types::is_note;
using types::is_numeric;
using types::same_known_type;

class Traversal {
   public:
    Traversal(AnalysisResult& result, DiagnosticsEngine& diagnostics);

    void run(const ast::Program& program);

   private:
    AnalysisResult& result_;
    DiagnosticsEngine& diagnostics_;
    ScopeStack scopes_;

    // Track/voice instrument context for note-type mismatch checking (nullopt = no instrument)
    std::optional<std::optional<music::Instrument>> current_track_instrument_;
    // Writable scope boundary for outer-scope write restriction
    ScopeId writable_boundary_ = INVALID_SCOPE_ID;

    void add_pattern_symbol(const ast::PatternDefinition& pattern) const;

    void diagnose(const source::Location& location, std::string message) const;

    void visit_globals(const std::vector<ast::GlobalItem>& globals);
    void visit_track(const ast::TrackDefinition& track);
    void visit_voice(const ast::VoiceDefinition& voice);
    void visit_pattern(const ast::PatternDefinition& pattern);

    void visit_block(const ast::Block& block);

    void visit_statement(const ast::Statement& statement);
    void visit_assign_statement(const ast::AssignStatement& assign, const source::Location& location);
    void visit_if_statement(const ast::IfStatement& if_stmt, const source::Location& location);
    void visit_for_statement(const ast::ForStatement& for_stmt, const source::Location& location);
    void visit_loop_statement(const ast::LoopStatement& loop, const source::Location& location);
    void visit_var_decl_statement(const ast::VarDeclStatement& decl, const source::Location& location);
    void visit_play_target(const ast::PlayTarget& target);

    TypeKind visit_expression(const ast::Expression& expression);
    TypeKind visit_identifier(const ast::Expression& expression, const ast::IdentifierExpression& identifier) const;
    TypeKind visit_unary(const ast::UnaryExpression& unary, const source::Location& location);
    TypeKind visit_binary(const ast::BinaryExpression& binary, const source::Location& location);
    TypeKind visit_ternary(const ast::TernaryExpression& ternary, const source::Location& location);
    TypeKind visit_sequence(const ast::SequenceExpression& sequence);
    TypeKind visit_chord(const ast::ChordExpression& chord, const source::Location& location);
    TypeKind visit_call(const ast::Expression& expression,
                        const ast::PatternCallExpression& call,
                        const source::Location& location);

    void validate_binary_operands(const operators::BinaryOperator op,
                                  const TypeKind left_type,
                                  const TypeKind right_type,
                                  const source::Location& location) const;
    void validate_numeric_operand(const TypeKind type, const char* side, const source::Location& location) const;
    void validate_call(const ast::PatternCallExpression& call,
                       const source::Location& location,
                       const std::vector<TypeKind>& argument_types);

    void validate_header(const ast::Header& header) const;

    void collect_global_patterns(const std::vector<ast::GlobalItem>& globals) const;
    void collect_track_patterns(const std::vector<ast::TrackItem>& items) const;
    void collect_voice_patterns(const std::vector<ast::VoiceItem>& items) const;
};

}  // namespace motivo::semantic::detail
