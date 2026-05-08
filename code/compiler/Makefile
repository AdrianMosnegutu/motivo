SHELL      := /bin/bash
BUILD_DIR  ?= $(if $(filter ON on 1 true yes,$(COVERAGE)),build-coverage,build)
BUILD_TYPE ?= Debug
COVERAGE   ?= OFF
EXAMPLE    := examples/example.motivo
NPROC      := $(shell nproc 2>/dev/null || echo 4)

CTEST      = ctest --test-dir $(BUILD_DIR) --output-on-failure -j$(NPROC)
CI_BUILD_DIR ?= build/compiler-ci
CI_BUILD_TYPE ?= Debug
CI_REPORT_DIR ?= $(CI_BUILD_DIR)/.ci-reports
CI_CMAKE_GENERATOR ?=
CI_CMAKE_GENERATOR_ARG = $(if $(CI_CMAKE_GENERATOR),-G "$(CI_CMAKE_GENERATOR)",)
CI_FETCHCONTENT_BASE_DIR ?=
CI_FETCHCONTENT_ARG = $(if $(CI_FETCHCONTENT_BASE_DIR),-D FETCHCONTENT_BASE_DIR="$(CI_FETCHCONTENT_BASE_DIR)",)
CI_ENABLE_COVERAGE ?= OFF
CI_COVERAGE_ON = $(if $(filter ON on 1 true yes,$(CI_ENABLE_COVERAGE)),ON,OFF)
CI_PACKAGE_TAG ?= motivo-studio-server-ci:local
CI_BISON_EXECUTABLE ?= $(firstword $(wildcard /opt/homebrew/opt/bison/bin/bison /usr/local/opt/bison/bin/bison))
CI_FLEX_EXECUTABLE ?= $(firstword $(wildcard /opt/homebrew/opt/flex/bin/flex /usr/local/opt/flex/bin/flex))
CI_BISON_ARG = $(if $(CI_BISON_EXECUTABLE),-D BISON_EXECUTABLE="$(CI_BISON_EXECUTABLE)",)
CI_FLEX_ARG = $(if $(CI_FLEX_EXECUTABLE),-D FLEX_EXECUTABLE="$(CI_FLEX_EXECUTABLE)",)
COVERAGE_ON = $(if $(filter ON on 1 true yes,$(COVERAGE)),ON,OFF)
CMAKE_COVERAGE_FLAG = -DMOTIVO_ENABLE_COVERAGE=$(COVERAGE_ON)
COVERAGE_RAW = $(BUILD_DIR)/coverage.info
COVERAGE_FILTERED = $(BUILD_DIR)/coverage.filtered.info
COVERAGE_HTML = $(BUILD_DIR)/coverage-html
COVERAGE_BUILD_DIR = $(abspath $(BUILD_DIR))

define reset_coverage_counters
	@if [ "$(COVERAGE_ON)" = "ON" ]; then \
		lcov --zerocounters --directory "$(BUILD_DIR)"; \
	fi
endef

define run_tests_and_maybe_generate_coverage_report
	@status=0; \
	$(CTEST) || status=$$?; \
	if [ "$(COVERAGE_ON)" = "ON" ]; then \
		set -e; \
		lcov --capture --ignore-errors inconsistent --directory "$(BUILD_DIR)" --output-file "$(COVERAGE_RAW)"; \
		lcov --remove "$(COVERAGE_RAW)" "/usr/*" "$(COVERAGE_BUILD_DIR)/*" "*/tests/*" --output-file "$(COVERAGE_FILTERED)"; \
		genhtml --ignore-errors range "$(COVERAGE_FILTERED)" --output-directory "$(COVERAGE_HTML)"; \
		echo "Coverage report: $(COVERAGE_HTML)/index.html"; \
	fi; \
	exit $$status
endef

.PHONY: configure build run \
        test coverage coverage-clean compile-commands format \
        ci ci-static ci-format ci-build ci-test ci-package clean

configure:
	cmake -B $(BUILD_DIR) -S . -DCMAKE_BUILD_TYPE=$(BUILD_TYPE) $(CMAKE_COVERAGE_FLAG)

build: configure
	cmake --build $(BUILD_DIR) -j$(NPROC)

# Generate compile_commands.json and symlink it to the project root.
# Run this once after cloning; re-run whenever CMakeLists changes.
# Needed by clangd, CLion, VSCode (C/C++ extension), and other LSP clients.
compile-commands:
	cmake -B $(BUILD_DIR) -S . -DCMAKE_BUILD_TYPE=$(BUILD_TYPE) $(CMAKE_COVERAGE_FLAG)
	ln -sf $(BUILD_DIR)/compile_commands.json compile_commands.json

run: build
	./$(BUILD_DIR)/apps/motivoc $(EXAMPLE)

# Run all compiler tests. Use `make test COVERAGE=ON` to also write an lcov HTML report.
test: build
	$(reset_coverage_counters)
	$(run_tests_and_maybe_generate_coverage_report)

coverage: COVERAGE := ON
coverage: test

coverage-clean:
	rm -rf build-coverage

format:
	find . \( -path ./$(BUILD_DIR) -prune \) -o \( -name '*.hpp' -o -name '*.cpp' -o -name '*.h' -o -name '*.c' \) -print | xargs clang-format -i

ci: ci-static ci-build ci-test ci-package

ci-static: ci-format

ci-format:
	@files=$$(find . \
		\( -path ./$(BUILD_DIR) -o -path ./$(CI_BUILD_DIR) -o -path ./build -o -path ./build-coverage -o -path ./cmake-build-debug -o -path ./.idea \) -prune -o \
		-type f \( -name '*.c' -o -name '*.cc' -o -name '*.cpp' -o -name '*.cxx' -o -name '*.h' -o -name '*.hh' -o -name '*.hpp' \) \
		-print | sort); \
	if [ -z "$$files" ]; then \
		echo "No C++ source files found."; \
	else \
		echo "$$files" | xargs clang-format --dry-run --Werror; \
	fi

ci-build:
	@mkdir -p "$(CI_REPORT_DIR)"
	@printf 'configure\n' > "$(CI_REPORT_DIR)/build-phase.txt"
	set -o pipefail; cmake -S . -B "$(CI_BUILD_DIR)" $(CI_CMAKE_GENERATOR_ARG) -D CMAKE_BUILD_TYPE="$(CI_BUILD_TYPE)" -D BUILD_TESTING=ON -D CMAKE_EXPORT_COMPILE_COMMANDS=ON -D MOTIVO_ENABLE_COVERAGE="$(CI_COVERAGE_ON)" $(CI_BISON_ARG) $(CI_FLEX_ARG) $(CI_FETCHCONTENT_ARG) 2>&1 | tee "$(CI_REPORT_DIR)/configure.log"
	@printf 'build\n' > "$(CI_REPORT_DIR)/build-phase.txt"
	set -o pipefail; cmake --build "$(CI_BUILD_DIR)" --config "$(CI_BUILD_TYPE)" -j$(NPROC) 2>&1 | tee "$(CI_REPORT_DIR)/build.log"

ci-test:
	@mkdir -p "$(CI_REPORT_DIR)"
	ctest --test-dir "$(CI_BUILD_DIR)" --build-config "$(CI_BUILD_TYPE)" --output-on-failure -j$(NPROC) --output-log "$(CI_REPORT_DIR)/ctest.log" --output-junit "$(CI_REPORT_DIR)/ctest-junit.xml"

ci-package:
	docker build --tag "$(CI_PACKAGE_TAG)" --file ../server/Dockerfile ..

clean:
	rm -rf $(BUILD_DIR)
