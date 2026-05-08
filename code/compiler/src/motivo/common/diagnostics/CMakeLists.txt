add_library(motivo_diagnostics STATIC
        diagnostics_engine.cpp)
motivo_configure_public_library(motivo_diagnostics)
target_link_libraries(motivo_diagnostics PRIVATE motivo_location)
