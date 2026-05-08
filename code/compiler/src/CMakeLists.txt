add_subdirectory(motivo/common)
add_subdirectory(motivo/parsing)
add_subdirectory(motivo/semantic)
add_subdirectory(motivo/lowering)
add_subdirectory(motivo/midi)

add_library(motivo_compiler STATIC motivo/compiler.cpp)
motivo_configure_public_library(motivo_compiler)
target_link_libraries(motivo_compiler
        PRIVATE motivo_diagnostics motivo_parsing motivo_semantic motivo_lowering motivo_midi)
