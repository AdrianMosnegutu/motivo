add_library(motivo_lowering STATIC)

add_subdirectory(detail)

target_sources(motivo_lowering PRIVATE
        lower_result.cpp
        lower.cpp)

motivo_configure_library(motivo_lowering)
target_link_libraries(motivo_lowering
        PUBLIC motivo_diagnostics
        PRIVATE motivo_music motivo_semantic)
