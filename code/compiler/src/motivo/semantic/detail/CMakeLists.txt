add_subdirectory(traversal)
add_subdirectory(scopes)

target_sources(motivo_semantic PRIVATE
        annotations.cpp
        symbol_table.cpp
        traversal.cpp
)
