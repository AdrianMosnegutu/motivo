#include <gtest/gtest.h>

#include "motivo/common/operators/operators.hpp"
#include "motivo/common/types/type_kind.hpp"
#include "motivo/common/types/type_rules.hpp"

using motivo::operators::BinaryOperator;
using motivo::types::TypeKind;
using motivo::types::binary_result_type;
using motivo::types::is_assignable;
using motivo::types::is_known;
using motivo::types::numeric_result;
using motivo::types::same_known_type;

TEST(TypeRules, IsAssignableAllowsExactMatch) {
    EXPECT_TRUE(is_assignable(TypeKind::Int, TypeKind::Int));
    EXPECT_TRUE(is_assignable(TypeKind::Double, TypeKind::Double));
    EXPECT_TRUE(is_assignable(TypeKind::Bool, TypeKind::Bool));
    EXPECT_TRUE(is_assignable(TypeKind::Sequence, TypeKind::Sequence));
}

TEST(TypeRules, IsAssignableAllowsIntToDoubleWideningOnly) {
    EXPECT_TRUE(is_assignable(TypeKind::Double, TypeKind::Int));
    EXPECT_FALSE(is_assignable(TypeKind::Int, TypeKind::Double));
}

TEST(TypeRules, IsAssignableRejectsUnrelatedTypes) {
    EXPECT_FALSE(is_assignable(TypeKind::Bool, TypeKind::Int));
    EXPECT_FALSE(is_assignable(TypeKind::Note, TypeKind::Int));
    EXPECT_FALSE(is_assignable(TypeKind::Sequence, TypeKind::Chord));
    EXPECT_FALSE(is_assignable(TypeKind::Int, TypeKind::Bool));
}

TEST(TypeRules, NumericResultPromotesToDoubleWhenEitherOperandIsDouble) {
    EXPECT_EQ(numeric_result(TypeKind::Int, TypeKind::Int), TypeKind::Int);
    EXPECT_EQ(numeric_result(TypeKind::Int, TypeKind::Double), TypeKind::Double);
    EXPECT_EQ(numeric_result(TypeKind::Double, TypeKind::Int), TypeKind::Double);
    EXPECT_EQ(numeric_result(TypeKind::Double, TypeKind::Double), TypeKind::Double);
}

TEST(TypeRules, BinaryResultTypeMatchesOperatorRules) {
    EXPECT_EQ(binary_result_type(BinaryOperator::Add, TypeKind::Int, TypeKind::Int), TypeKind::Int);
    EXPECT_EQ(binary_result_type(BinaryOperator::Divide, TypeKind::Int, TypeKind::Int), TypeKind::Double);
    EXPECT_EQ(binary_result_type(BinaryOperator::Modulo, TypeKind::Int, TypeKind::Int), TypeKind::Int);
    EXPECT_EQ(binary_result_type(BinaryOperator::Equals, TypeKind::Int, TypeKind::Int), TypeKind::Bool);
    EXPECT_EQ(binary_result_type(BinaryOperator::And, TypeKind::Bool, TypeKind::Bool), TypeKind::Bool);
}

TEST(TypeRules, SameKnownTypeRequiresBothKnownAndEqual) {
    EXPECT_TRUE(same_known_type(TypeKind::Int, TypeKind::Int));
    EXPECT_FALSE(same_known_type(TypeKind::Int, TypeKind::Double));
    EXPECT_FALSE(same_known_type(TypeKind::Unknown, TypeKind::Int));
    EXPECT_TRUE(is_known(TypeKind::Int));
    EXPECT_FALSE(is_known(TypeKind::Unknown));
}
