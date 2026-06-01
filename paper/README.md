# Thesis Paper

LaTeX source for the written thesis:
**Design and Implementation of a Domain-Specific Language for Music Composition**.

## Requirements

- A LaTeX distribution with `latexmk`
- `tex-fmt` for formatting
- `bibtex-tidy` for bibliography formatting
- `chktex` and `codespell` for linting and spelling checks

The local scripts fail fast when a required command is missing. The build script opens the generated PDF on macOS or
Linux when `open` is available.

## Commands

Run commands from this directory:

```sh
make build   # Build build/paper.pdf with latexmk
make format  # Format .tex files and tidy references.bib
make lint    # Check formatting, spelling, and LaTeX lint issues
make clean   # Remove build/
```

The Makefile delegates to the scripts under `scripts/`. The generated PDF and LaTeX intermediates live in `build/`,
which is ignored by Git.

## Structure

```text
paper.tex              Main document entrypoint; imports preamble, frontmatter, and chapters
style.sty              Thesis style package
references.bib         Bibliography
preamble/              Shared setup (colors, listings, TikZ, page style)
frontmatter/           Frontmatter files, currently the abstract
chapters/              Chapter wrappers and per-chapter section directories
scripts/               Local build, format, and lint helpers
Makefile               Convenience targets for the local scripts
build/                 Generated PDF and LaTeX intermediates (gitignored)
```

### Preamble

```text
preamble/colors.tex           Motivo color palette (\definecolor macros)
preamble/listings-motivo.tex  Motivo language definition for listings
preamble/tikz-setup.tex       pgfplots/TikZ library setup
preamble/page-style.tex       Geometry, headers, and page layout overrides
```

### Chapters

Each chapter is a single file at `chapters/NN-name.tex` containing the `\chapter{}` declaration, introductory
paragraphs, and `\input{}` calls for its sections. Section content lives in `chapters/NN-name/sections/`, one file
per `\section{}`.

```text
chapters/01-context-motivation-related-work.tex  → 01-context-motivation-related-work/sections/  (8 files)
chapters/02-motivo-language-design.tex         → 02-motivo-language-design/sections/         (7 files)
chapters/03-compiler-implementation.tex        → 03-compiler-implementation/sections/        (5 files)
chapters/04-motivo-studio-editor.tex           → 04-motivo-studio-editor/sections/           (3 files)
chapters/05-deployment-testing-ci.tex          → 05-deployment-testing-ci/sections/          (2 files)
chapters/06-evaluation.tex                     → 06-evaluation/sections/                     (7 files)
chapters/07-conclusion-next-steps.tex          → 07-conclusion-next-steps/sections/          (4 files)
```

## CI

The paper workflow runs separate formatting, ChkTeX linting, spelling, and PDF build jobs. It uploads the built thesis
PDF as the `thesis-paper` artifact. The workflow runs for `paper/**` changes, except `paper/scripts/**` and
`paper/notes/**`, and for changes to the paper workflow or GitHub paper helper scripts.
