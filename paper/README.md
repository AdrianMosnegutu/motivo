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
paper.tex           Main document entrypoint; imports frontmatter and chapters
style.sty           Thesis style package
references.bib      Bibliography
frontmatter/        Frontmatter files, currently the abstract
chapters/           Chapter entrypoints and chapter section files
scripts/            Local build, format, and lint helpers
Makefile            Convenience targets for the local scripts
```

Chapter content is split by topic:

```text
chapters/02-background/       Background sections
chapters/03-related-work/     Related-work sections grouped by system category
chapters/04-methodology/      DSL design and compiler methodology
chapters/05-implementation/   Compiler implementation details
chapters/06-evaluation/       Evaluation sections
```

## CI

The paper workflow runs separate formatting, ChkTeX linting, spelling, and PDF build jobs. It uploads the built thesis
PDF as the `thesis-paper` artifact. The workflow runs for `paper/**` changes, except `paper/scripts/**` and
`paper/notes/**`, and for changes to the paper workflow or GitHub paper helper scripts.
