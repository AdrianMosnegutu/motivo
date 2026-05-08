add_subdirectory(traversal)
add_subdirectory(scopes)
add_subdirectory(types)

target_sources(motivo_semantic PRIVATE
        annotations.cpp
        symbol_table.cpp
        traversal.cpp
)
