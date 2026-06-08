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
preamble/headings.tex         \topic{} run-in labels for short titled blocks
preamble/monospace.tex        Breakable \texttt{} and table column helpers
```

### Chapters

Each chapter is a wrapper at `chapters/NN-name.tex` with a matching `chapters/NN-name/` directory of section files.

```text
chapters/01-introduction.tex              → 01-introduction/              (4 files)
chapters/02-background.tex                → 02-background/                (7 files)
chapters/03-motivo-language-design.tex    → 03-motivo-language-design/    (7 files)
chapters/04-compiler-implementation.tex   → 04-compiler-implementation/   (6 files)
chapters/05-motivo-studio-engineering.tex → 05-motivo-studio-engineering/ (5 files)
chapters/06-evaluation.tex              → 06-evaluation/                (7 files)
chapters/07-conclusion-next-steps.tex   → 07-conclusion-next-steps/     (4 files)
```

## CI

The paper workflow runs separate formatting, ChkTeX linting, spelling, and PDF build jobs. It uploads the built thesis
PDF as the `thesis-paper` artifact. The workflow runs for `paper/**` changes, except `paper/scripts/**` and
`paper/notes/**`, and for changes to the paper workflow or GitHub paper helper scripts.
