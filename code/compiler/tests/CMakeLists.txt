include(FetchContent)
FetchContent_Declare(
        googletest
        GIT_REPOSITORY https://github.com/google/googletest.git
        GIT_TAG v1.15.2)
# Prevent GTest from installing itself alongside our project.
set(INSTALL_GTEST OFF CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(googletest)

include(GoogleTest)

# -- Shared include paths -------------------------------------------------------

set(MOTIVO_SRC ${PROJECT_SOURCE_DIR}/src)
set(MOTIVO_BINARY_PARSING ${CMAKE_BINARY_DIR}/src/motivo/parsing)

# -- Common module unit tests ---------------------------------------------------

motivo_add_gtest(common_tests
        unit/common/music/note_test.cpp
        unit/common/types/type_rules_test.cpp)
target_link_libraries(common_tests PRIVATE motivo_music motivo_types)
target_include_directories(common_tests PRIVATE ${MOTIVO_SRC})

# -- Parsing unit tests ---------------------------------------------------------

file(GLOB_RECURSE PARSING_SOURCES
        unit/parsing/*.cpp)

motivo_add_gtest(parsing_tests ${PARSING_SOURCES})
target_link_libraries(parsing_tests PRIVATE motivo_parsing)
target_include_directories(parsing_tests PRIVATE
        ${MOTIVO_BINARY_PARSING}
        ${MOTIVO_SRC}
        unit/parsing)

# -- Semantic unit tests --------------------------------------------------------

file(GLOB_RECURSE SEMANTIC_SOURCES
        unit/semantic/scope_access_test.cpp
        unit/semantic/metadata_test.cpp
        unit/semantic/type_checking/*.cpp
        unit/semantic/scoping/*.cpp
        unit/semantic/declarations/*.cpp
        unit/semantic/statements/*.cpp)

motivo_add_gtest(semantic_tests ${SEMANTIC_SOURCES})
target_link_libraries(semantic_tests PRIVATE motivo_parsing motivo_semantic)
target_include_directories(semantic_tests PRIVATE
        ${MOTIVO_SRC}
        unit/semantic)

# -- Lowering unit tests --------------------------------------------------------

file(GLOB_RECURSE LOWERING_SOURCES
        unit/lowering/cursor/*.cpp
        unit/lowering/control_flow/*.cpp
        unit/lowering/diagnostics/*.cpp
        unit/lowering/expressions/*.cpp
        unit/lowering/flattening/*.cpp
        unit/lowering/patterns/*.cpp
        unit/lowering/voices/*.cpp
        unit/lowering/variables/*.cpp)

motivo_add_gtest(ir_tests ${LOWERING_SOURCES})
target_link_libraries(ir_tests PRIVATE motivo_parsing motivo_lowering)
target_include_directories(ir_tests PRIVATE
        ${MOTIVO_SRC}
        unit/lowering)

# -- MIDI unit tests ------------------------------------------------------------

motivo_add_gtest(midi_tests
        unit/midi/midi_writer_test.cpp)
target_link_libraries(midi_tests PRIVATE motivo_midi)
target_include_directories(midi_tests PRIVATE ${MOTIVO_SRC})

# -- Integration tests ----------------------------------------------------------

add_subdirectory(integration)

# -- Golden end-to-end tests ----------------------------------------------------

add_subdirectory(golden)

# -- Aggregate targets ----------------------------------------------------------

add_custom_target(run_unit_tests
        COMMAND $<TARGET_FILE:common_tests>
        COMMAND $<TARGET_FILE:parsing_tests>
        COMMAND $<TARGET_FILE:semantic_tests>
        COMMAND $<TARGET_FILE:ir_tests>
        COMMAND $<TARGET_FILE:midi_tests>
        DEPENDS
            common_tests
            parsing_tests
            semantic_tests
            ir_tests
            midi_tests
        USES_TERMINAL
        VERBATIM)

add_custom_target(run_integration_unit_tests
        COMMAND ${CMAKE_CTEST_COMMAND} --output-on-failure
        DEPENDS
            common_tests
            parsing_tests
            semantic_tests
            ir_tests
            midi_tests
            compiler_api_tests
            golden_tests
            motivoc
        WORKING_DIRECTORY ${CMAKE_BINARY_DIR}
        USES_TERMINAL
        VERBATIM)
