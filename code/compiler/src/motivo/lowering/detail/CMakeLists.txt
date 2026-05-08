add_subdirectory(expression_evaluators)
add_subdirectory(ast_lowerers)

target_sources(motivo_lowering PRIVATE
        value_flattener.cpp
        expression_evaluator.cpp
        lowerer_context.cpp)
