#include <string>
#include <variant>

#include "motivo/common/ast/expressions.hpp"
#include "motivo/common/utils/overloaded.hpp"
#include "motivo/semantic/detail/annotations.hpp"
#include "motivo/semantic/detail/symbol_table.hpp"
#include "motivo/semantic/detail/traversal.hpp"
#include "motivo/common/types/type_rules.hpp"

namespace motivo::semantic::detail {

void Traversal::visit_block(const ast::Block& block) {
    for (const auto& statement : block) {
        if (statement) {
            visit_statement(*statement);
        }
    }
}

void Traversal::visit_statement(const ast::Statement& statement) {
    std::visit(utils::overloaded{
                   [&](const ast::AssignStatement& assign) { visit_assign_statement(assign, statement.location); },
                   [&](const ast::ForStatement& for_stmt) { visit_for_statement(for_stmt, statement.location); },
                   [&](const ast::IfStatement& if_stmt) { visit_if_statement(if_stmt, statement.location); },
                   [&](const ast::VarDeclStatement& decl) { visit_var_decl_statement(decl, statement.location); },
                   [&](const ast::LoopStatement& loop) { visit_loop_statement(loop, statement.location); },
                   [&](const ast::PlayStatement& play) { visit_play_target(play.target); },
               },
               statement.kind);
}

void Traversal::visit_assign_statement(const ast::AssignStatement& assign, const source::Location& location) {
    const auto* symbol = scopes_.find_visible(assign.name, {SymbolKind::Variable, SymbolKind::Parameter});
    const SymbolId symbol_id = symbol ? symbol->id : INVALID_SYMBOL_ID;

    if (!symbol) {
        diagnose(location, "assignment to undeclared variable '" + assign.name + "'");
    } else if (symbol->kind == SymbolKind::Parameter) {
        diagnose(location, "assignment to parameter '" + assign.name + "' is not allowed");
    } else if (writable_boundary_ != INVALID_SCOPE_ID &&
               scopes_.symbol_table().is_strict_ancestor(symbol->scope_id, writable_boundary_)) {
        diagnose(location, "cannot assign to read-only variable '" + assign.name + "' from outer scope");
    }

    const TypeKind value_type = visit_expression(*assign.value);
    if (symbol_id != INVALID_SYMBOL_ID) {
        if (is_known(value_type) && !is_assignable(symbol->type, value_type)) {
            diagnose(location, "cannot assign value of incompatible type to '" + assign.name + "'");
        }

        result_.annotations_->set_assign_target(assign, symbol_id);
    }
}

void Traversal::visit_for_statement(const ast::ForStatement& for_stmt, const source::Location& location) {
    ScopeStack::Guard guard(scopes_);

    if (for_stmt.init) {
        visit_statement(*for_stmt.init);
    }

    if (for_stmt.condition) {
        const TypeKind condition_type = visit_expression(*for_stmt.condition);

        if (is_known(condition_type) && !is_boolean(condition_type)) {
            diagnose(for_stmt.condition->location, "for condition must be a boolean");
        }
    }

    visit_block(for_stmt.body);
    if (for_stmt.step) {
        visit_statement(*for_stmt.step);
    }
}

void Traversal::visit_loop_statement(const ast::LoopStatement& loop, const source::Location& location) {
    const TypeKind count_type = visit_expression(*loop.count);

    if (is_known(count_type) && !is_integral(count_type)) {
        diagnose(loop.count->location, "loop count must be an integer");
    }

    visit_block(loop.body);
}

void Traversal::visit_if_statement(const ast::IfStatement& if_stmt, const source::Location& location) {
    const TypeKind condition_type = visit_expression(*if_stmt.condition);

    if (is_known(condition_type) && !is_boolean(condition_type)) {
        diagnose(if_stmt.condition->location, "if condition must be a boolean");
    }

    visit_block(if_stmt.then_branch);
    if (if_stmt.else_branch) {
        visit_block(*if_stmt.else_branch);
    }
}

void Traversal::visit_var_decl_statement(const ast::VarDeclStatement& decl, const source::Location& location) {
    const TypeKind value_type = visit_expression(*decl.value);

    if (scopes_.find_in_current_scope(decl.name)) {
        diagnose(location, "redeclaration of variable '" + decl.name + "'");
        return;
    }

    const TypeKind declared_type = decl.type;
    if (is_known(value_type) && !is_assignable(declared_type, value_type)) {
        diagnose(location,
                 "cannot initialize '" + decl.name + "' of type " + std::string(types::type_name(declared_type)) +
                     " with value of type " + std::string(types::type_name(value_type)));
    }

    (void)scopes_.add_symbol(decl.name, SymbolKind::Variable, declared_type, location, &decl);
}

void Traversal::visit_play_target(const ast::PlayTarget& target) {
    std::visit(utils::overloaded{
                   [&](const ast::ExpressionPtr& expression) {
                       if (expression) {
                           const TypeKind expr_type = visit_expression(*expression);
                           const bool is_musical =
                               expr_type == TypeKind::Note || expr_type == TypeKind::Chord ||
                               expr_type == TypeKind::Sequence || expr_type == TypeKind::Rest;
                           if (is_known(expr_type) && !is_musical) {
                               diagnose(expression->location,
                                        "play expression must be a musical type (note, chord, sequence, or rest)");
                           }

                           // Note-type mismatch: drum note in melodic/instrument-less track, or vice versa
                           if (current_track_instrument_) {
                               const bool track_is_drums = current_track_instrument_->has_value() &&
                                                           **current_track_instrument_ == music::Instrument::Drums;

                               if (std::holds_alternative<ast::DrumNoteLiteralExpression>(expression->kind)) {
                                   if (!track_is_drums) {
                                       diagnose(expression->location, "drum note cannot be played in a non-drum track");
                                   }
                               } else if (std::holds_alternative<ast::NoteLiteralExpression>(expression->kind)) {
                                   if (track_is_drums) {
                                       diagnose(expression->location, "melodic note cannot be played in a drum track");
                                   }
                               }
                           }
                       }
                   },
                   [&](const music::DrumNote&) {
                       // Drum note via plain_source (play kick; syntax)
                       if (current_track_instrument_) {
                           const bool track_is_drums = current_track_instrument_->has_value() &&
                                                       **current_track_instrument_ == music::Instrument::Drums;
                           if (!track_is_drums) {
                               diagnose(target.location, "drum note cannot be played in a non-drum track");
                           }
                       }
                   },
               },
               target.source);

    if (target.duration) {
        const TypeKind duration_type = visit_expression(*target.duration);

        if (is_known(duration_type) && !is_numeric(duration_type)) {
            diagnose(target.duration->location, "play duration must be a number");
        }
    }

    if (target.from_offset) {
        const TypeKind from_type = visit_expression(*target.from_offset);

        if (is_known(from_type) && !is_numeric(from_type)) {
            diagnose(target.from_offset->location, "from offset must be a number");
        }
    }
}

}  // namespace motivo::semantic::detail
