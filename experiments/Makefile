.PHONY: help build run aggregate clean distclean

# Paths are resolved relative to this Makefile so it works from any directory.
EXP        := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
REPO       := $(abspath $(EXP)/..)
HARNESS    := $(EXP)/harness
NPROC      := $(shell sysctl -n hw.ncpu 2>/dev/null || nproc 2>/dev/null || echo 4)

# Homebrew bison/flex on macOS (the system bison is too old); falls back to PATH.
BISON ?= $(firstword $(wildcard /opt/homebrew/opt/bison/bin/bison /usr/local/opt/bison/bin/bison) bison)
FLEX  ?= $(firstword $(wildcard /opt/homebrew/opt/flex/bin/flex  /usr/local/opt/flex/bin/flex)  flex)

CURRENT_BUILD := $(REPO)/build/bench-current
MOTIVOC       := $(CURRENT_BUILD)/apps/motivoc

help:
	@echo "Motivo experiments — targets:"
	@echo "  build      Build the current motivoc (Release) with benchmark instrumentation"
	@echo "  run        Build/reuse all compilers, run every suite, and aggregate results"
	@echo "  aggregate  Regenerate SUMMARY.md + results.csv from existing JSON (no recompile)"
	@echo "  clean      Remove generated results and stray MIDI files"
	@echo "  distclean  clean + remove experiment build dirs and v1/v2 tag worktrees"

# Build only the current compiler with the benchmark feature compiled in.
build:
	cmake -B "$(CURRENT_BUILD)" -S "$(REPO)/code/compiler" \
	  -DCMAKE_BUILD_TYPE=Release -DBUILD_TESTING=OFF -DMOTIVO_ENABLE_BENCHMARK=ON \
	  -DBISON_EXECUTABLE="$(BISON)" -DFLEX_EXECUTABLE="$(FLEX)"
	cmake --build "$(CURRENT_BUILD)" -j$(NPROC)

# Run the full suite. run-all.sh builds or reuses every compiler as needed.
run:
	BISON_EXECUTABLE="$(BISON)" FLEX_EXECUTABLE="$(FLEX)" bash "$(HARNESS)/run-all.sh"

aggregate:
	python3 "$(HARNESS)/aggregate.py" "$(EXP)/results/reproduction" --title "Reproduction: B1-B3 (v1 vs v2)"
	python3 "$(HARNESS)/aggregate.py" "$(EXP)/results/stress"       --title "Stress Suite (current motivoc)"
	python3 "$(HARNESS)/aggregate.py" "$(EXP)/results/general"      --title "General-Case Compositions (current motivoc)"

clean:
	rm -rf "$(EXP)/results"
	find "$(EXP)/fixtures" -name '*.mid' -delete 2>/dev/null || true

distclean: clean
	rm -rf "$(CURRENT_BUILD)"
	-git -C "$(REPO)" worktree remove --force "$(REPO)/build/wt-v1" 2>/dev/null
	-git -C "$(REPO)" worktree remove --force "$(REPO)/build/wt-v2" 2>/dev/null
	rm -rf "$(REPO)/build/wt-v1" "$(REPO)/build/wt-v2"
