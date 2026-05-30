#pragma once

#include <memory>
#include <variant>
#include <vector>

#include "motivo/common/music/drum_note.hpp"
#include "motivo/common/music/note.hpp"
#include "motivo/common/operators/operators.hpp"
#include "motivo/common/source/location.hpp"

namespace motivo::ast {

struct Expression;
using ExpressionPtr = std::unique_ptr<Expression>;

// -- Composable expressions -------------------------------------------------------------------------------------------

struct UnaryExpression {
    operators::UnaryOperator operation;
    ExpressionPtr operand;
};

struct BinaryExpression {
    operators::BinaryOperator operation;
    ExpressionPtr left;
    ExpressionPtr right;
};

struct TernaryExpression {
    ExpressionPtr condition;
    ExpressionPtr then_expression;
    ExpressionPtr else_expression;
};

// -- Literals ---------------------------------------------------------------------------------------------------------

struct IntLiteralExpression {
    int value;
};

struct FloatLiteralExpression {
    double value;
};

struct BoolLiteralExpression {
    bool value;
};

struct NoteLiteralExpression {
    music::Note value;
};

struct RestLiteralExpression {};

struct DrumNoteLiteralExpression {
    music::DrumNote value;
};

// -- Musical structures -----------------------------------------------------------------------------------------------

struct DurationalTarget {
    ExpressionPtr value;
    ExpressionPtr duration;
};

struct ChordExpression {
    std::vector<DurationalTarget> notes;
};

struct SequenceExpression {
    std::vector<DurationalTarget> items;
};

// -- Others -----------------------------------------------------------------------------------------------------------

struct ParenthesisedExpression {
    ExpressionPtr inner;
};

struct IdentifierExpression {
    std::string name;
};

struct PatternCallExpression {
    std::string callee;
    std::vector<ExpressionPtr> arguments;
};

// -- Base expression --------------------------------------------------------------------------------------------------

using ExpressionKind = std::variant<IntLiteralExpression,
                                    FloatLiteralExpression,
                                    BoolLiteralExpression,
                                    NoteLiteralExpression,
                                    RestLiteralExpression,
                                    DrumNoteLiteralExpression,
                                    IdentifierExpression,
                                    UnaryExpression,
                                    BinaryExpression,
                                    TernaryExpression,
                                    ParenthesisedExpression,
                                    SequenceExpression,
                                    ChordExpression,
                                    PatternCallExpression>;

struct Expression {
    ExpressionKind kind;
    source::Location location;
};

}  // namespace motivo::ast
