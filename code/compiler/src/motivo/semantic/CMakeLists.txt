add_library(motivo_semantic STATIC)

add_subdirectory(detail)

target_sources(motivo_semantic PRIVATE
        analysis_result.cpp
        analyze.cpp
)

motivo_configure_library(motivo_semantic)
target_link_libraries(motivo_semantic PUBLIC motivo_diagnostics PRIVATE motivo_location)
