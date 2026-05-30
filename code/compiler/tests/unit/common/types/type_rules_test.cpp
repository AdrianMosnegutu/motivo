#include "motivo/common/types/type_rules.hpp"

#include <gtest/gtest.h>

#include "motivo/common/operators/operators.hpp"
#include "motivo/common/types/type.hpp"

using motivo::operators::BinaryOperator;
using motivo::types::binary_result_type;
using motivo::types::is_assignable;
using motivo::types::is_known;
using motivo::types::numeric_result;
using motivo::types::same_known_type;
using motivo::types::Type;

TEST(TypeRules, IsAssignableAllowsExactMatch) {
    EXPECT_TRUE(is_assignable(Type::Int, Type::Int));
    EXPECT_TRUE(is_assignable(Type::Double, Type::Double));
    EXPECT_TRUE(is_assignable(Type::Bool, Type::Bool));
    EXPECT_TRUE(is_assignable(Type::Sequence, Type::Sequence));
}

TEST(TypeRules, IsAssignableRequiresExactTypeMatch) {
    EXPECT_FALSE(is_assignable(Type::Double, Type::Int));
    EXPECT_FALSE(is_assignable(Type::Int, Type::Double));
}

TEST(TypeRules, IsAssignableRejectsUnrelatedTypes) {
    EXPECT_FALSE(is_assignable(Type::Bool, Type::Int));
    EXPECT_FALSE(is_assignable(Type::Note, Type::Int));
    EXPECT_FALSE(is_assignable(Type::Sequence, Type::Chord));
    EXPECT_FALSE(is_assignable(Type::Int, Type::Bool));
}

TEST(TypeRules, NumericResultPromotesToDoubleWhenEitherOperandIsDouble) {
    EXPECT_EQ(numeric_result(Type::Int, Type::Int), Type::Int);
    EXPECT_EQ(numeric_result(Type::Int, Type::Double), Type::Double);
    EXPECT_EQ(numeric_result(Type::Double, Type::Int), Type::Double);
    EXPECT_EQ(numeric_result(Type::Double, Type::Double), Type::Double);
}

TEST(TypeRules, BinaryResultTypeMatchesOperatorRules) {
    EXPECT_EQ(binary_result_type(BinaryOperator::Add, Type::Int, Type::Int), Type::Int);
    EXPECT_EQ(binary_result_type(BinaryOperator::Divide, Type::Int, Type::Int), Type::Int);
    EXPECT_EQ(binary_result_type(BinaryOperator::Modulo, Type::Int, Type::Int), Type::Int);
    EXPECT_EQ(binary_result_type(BinaryOperator::Equals, Type::Int, Type::Int), Type::Bool);
    EXPECT_EQ(binary_result_type(BinaryOperator::And, Type::Bool, Type::Bool), Type::Bool);
}

TEST(TypeRules, DivideResultFollowsNumericPromotion) {
    EXPECT_EQ(binary_result_type(BinaryOperator::Divide, Type::Int, Type::Int), Type::Int);
    EXPECT_EQ(binary_result_type(BinaryOperator::Divide, Type::Int, Type::Double), Type::Double);
    EXPECT_EQ(binary_result_type(BinaryOperator::Divide, Type::Double, Type::Int), Type::Double);
    EXPECT_EQ(binary_result_type(BinaryOperator::Divide, Type::Double, Type::Double), Type::Double);
}

TEST(TypeRules, SameKnownTypeRequiresBothKnownAndEqual) {
    EXPECT_TRUE(same_known_type(Type::Int, Type::Int));
    EXPECT_FALSE(same_known_type(Type::Int, Type::Double));
    EXPECT_FALSE(same_known_type(Type::Unknown, Type::Int));
    EXPECT_TRUE(is_known(Type::Int));
    EXPECT_FALSE(is_known(Type::Unknown));
}
