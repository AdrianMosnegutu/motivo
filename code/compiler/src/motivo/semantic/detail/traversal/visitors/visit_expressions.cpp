#include "motivo/common/utils/overloaded.hpp"
#include "motivo/semantic/detail/annotations.hpp"
#include "motivo/semantic/detail/traversal.hpp"

namespace motivo::semantic::detail {

Type Traversal::visit_expression(const ast::Expression& expression) {
    const Type expression_type = std::visit(
        utils::overloaded{
            [&](const ast::IntLiteralExpression&) { return Type::Int; },
            [&](const ast::FloatLiteralExpression&) { return Type::Double; },
            [&](const ast::BoolLiteralExpression&) { return Type::Bool; },
            [&](const ast::NoteLiteralExpression&) { return Type::Note; },
            [&](const ast::RestLiteralExpression&) { return Type::Rest; },
            [&](const ast::DrumNoteLiteralExpression&) { return Type::Note; },
            [&](const ast::IdentifierExpression& identifier) { return visit_identifier(expression, identifier); },
            [&](const ast::UnaryExpression& unary) { return visit_unary(unary, expression.location); },
            [&](const ast::BinaryExpression& binary) { return visit_binary(binary, expression.location); },
            [&](const ast::TernaryExpression& ternary) { return visit_ternary(ternary, expression.location); },
            [&](const ast::ParenthesisedExpression& paren) { return visit_expression(*paren.inner); },
            [&](const ast::SequenceExpression& sequence) { return visit_sequence(sequence); },
            [&](const ast::ChordExpression& chord) { return visit_chord(chord, expression.location); },
            [&](const ast::PatternCallExpression& call) { return visit_call(expression, call, expression.location); },
        },
        expression.kind);

    result_.annotations_->set_expression_type(expression, expression_type);
    return expression_type;
}

Type Traversal::visit_identifier(const ast::Expression& expression, const ast::IdentifierExpression& identifier) const {
    if (const auto* symbol = scopes_.find_visible(identifier.name, {SymbolKind::Variable, SymbolKind::Parameter})) {
        result_.annotations_->set_resolved_symbol(expression, symbol->id);
        return symbol->type;
    }

    diagnose(expression.location, "undefined variable '" + identifier.name + "'");
    return Type::Unknown;
}

Type Traversal::visit_unary(const ast::UnaryExpression& unary, const source::Location& location) {
    const Type operand_type = visit_expression(*unary.operand);

    switch (unary.operation) {
        case operators::UnaryOperator::Negative: {
            if (is_known(operand_type) && !is_numeric(operand_type)) {
                diagnose(location, "unary '-' requires a numeric operand");
                return Type::Unknown;
            }

            return is_numeric(operand_type) ? operand_type : Type::Unknown;
        }

        case operators::UnaryOperator::Not: {
            if (is_known(operand_type) && !is_boolean(operand_type)) {
                diagnose(location, "unary '!' requires a boolean operand");
                return Type::Unknown;
            }

            return is_boolean(operand_type) ? Type::Bool : Type::Unknown;
        }
    }

    diagnose(location, "invalid unary operator");
    return Type::Unknown;
}

Type Traversal::visit_binary(const ast::BinaryExpression& binary, const source::Location& location) {
    const Type left_type = visit_expression(*binary.left);
    const Type right_type = visit_expression(*binary.right);

    validate_binary_operands(binary.operation, left_type, right_type, location);
    return binary_result_type(binary.operation, left_type, right_type);
}

Type Traversal::visit_ternary(const ast::TernaryExpression& ternary, const source::Location& location) {
    if (const Type condition_type = visit_expression(*ternary.condition);
        is_known(condition_type) && !is_boolean(condition_type)) {
        diagnose(location, "ternary condition must be a boolean expression");
    }

    const Type then_type = visit_expression(*ternary.then_expression);
    const Type else_type = visit_expression(*ternary.else_expression);

    if (is_known(then_type) && is_known(else_type) && !same_known_type(then_type, else_type)) {
        diagnose(location, "ternary branches must evaluate to the same type");
        return Type::Unknown;
    }

    return same_known_type(then_type, else_type) ? then_type : Type::Unknown;
}

Type Traversal::visit_sequence(const ast::SequenceExpression& sequence) {
    for (const auto& [value, duration] : sequence.items) {
        const Type item_type = visit_expression(*value);

        const bool is_musical_item = item_type == Type::Note || item_type == Type::Chord || item_type == Type::Rest;
        if (is_known(item_type) && !is_musical_item) {
            diagnose(value->location, "sequence items must be notes, chords, or rests");
        }

        if (current_track_instrument_) {
            const bool track_is_drums =
                current_track_instrument_->has_value() && **current_track_instrument_ == music::Instrument::Drums;

            if (std::holds_alternative<ast::DrumNoteLiteralExpression>(value->kind)) {
                if (!track_is_drums) {
                    diagnose(value->location, "drum note cannot be played in a non-drum track");
                }
            } else if (std::holds_alternative<ast::NoteLiteralExpression>(value->kind)) {
                if (track_is_drums) {
                    diagnose(value->location, "melodic note cannot be played in a drum track");
                }
            }
        }

        if (duration) {
            const Type duration_type = visit_expression(*duration);

            if (is_known(duration_type) && !is_numeric(duration_type)) {
                diagnose(duration->location, "sequence item duration must be numeric");
            }
        }
    }

    return Type::Sequence;
}

Type Traversal::visit_chord(const ast::ChordExpression& chord, const source::Location& location) {
    for (const auto& [value, duration] : chord.notes) {
        const Type value_type = visit_expression(*value);

        if (is_known(value_type) && !is_note(value_type)) {
            diagnose(location, "chord members must be notes");
        }

        if (current_track_instrument_) {
            const bool track_is_drums =
                current_track_instrument_->has_value() && **current_track_instrument_ == music::Instrument::Drums;

            if (std::holds_alternative<ast::NoteLiteralExpression>(value->kind)) {
                if (track_is_drums) {
                    diagnose(value->location, "melodic note cannot be played in a drum track");
                }
            }
        }

        if (duration) {
            const Type duration_type = visit_expression(*duration);

            if (is_known(duration_type) && !is_numeric(duration_type)) {
                diagnose(duration->location, "chord note duration must be numeric");
            }
        }
    }

    return Type::Chord;
}

Type Traversal::visit_call(const ast::Expression& expression,
                           const ast::PatternCallExpression& call,
                           const source::Location& location) {
    std::vector<Type> argument_types;

    argument_types.reserve(call.arguments.size());
    for (const auto& arg : call.arguments) {
        argument_types.push_back(visit_expression(*arg));
    }

    validate_call(call, location, argument_types);

    if (const auto* symbol = scopes_.find_pattern_visible_by_signature(call.callee, argument_types)) {
        result_.annotations_->set_resolved_symbol(expression, symbol->id);
    }

    return Type::Sequence;
}

}  // namespace motivo::semantic::detail
