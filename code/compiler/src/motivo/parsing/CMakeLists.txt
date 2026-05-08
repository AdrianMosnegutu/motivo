# Generated Flex/Bison sources live in the build tree.
bison_target(MotivoParser
        detail/parser.y
        ${CMAKE_CURRENT_BINARY_DIR}/parser.cpp
        DEFINES_FILE ${CMAKE_CURRENT_BINARY_DIR}/parser.hpp
        COMPILE_FLAGS "--language=c++ --locations")

flex_target(MotivoScanner
        detail/scanner.l
        ${CMAKE_CURRENT_BINARY_DIR}/scanner.cpp)

# Ensure Bison runs before Flex (scanner.l #includes parser.hpp).
add_flex_bison_dependency(MotivoScanner MotivoParser)

add_library(motivo_parsing STATIC
        parse.cpp
        parse_result.cpp
        detail/scanner_helpers.cpp
        ${BISON_MotivoParser_OUTPUTS}
        ${FLEX_MotivoScanner_OUTPUTS})

motivo_configure_library(motivo_parsing)
target_include_directories(motivo_parsing PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}
        ${CMAKE_CURRENT_BINARY_DIR})  # parser.hpp lives here

target_link_libraries(motivo_parsing PUBLIC motivo_diagnostics PRIVATE motivo_location motivo_music)

# Suppress noisy warnings in generated code (register, sign-compare, etc.).
if (CMAKE_CXX_COMPILER_ID MATCHES "GNU|Clang|AppleClang")
    target_compile_options(motivo_parsing PRIVATE
            -Wno-deprecated-register
            -Wno-sign-compare
            -Wno-unused-function
            -Wno-unused-but-set-variable)
endif ()
