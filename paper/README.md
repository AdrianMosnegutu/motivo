# Thesis Paper

LaTeX source for the written thesis: **Design and Implementation of a Domain-Specific Language for Music Composition**.

## Requirements

- A LaTeX distribution with `latexmk`
- `tex-fmt` for formatting
- `bibtex-tidy` for bibliography formatting
- `chktex` and `codespell` for linting and spelling checks

## Build

```sh
bash scripts/build.sh
```

The script builds `paper.pdf`, cleans intermediate LaTeX files, and opens the PDF on macOS when `open` is available.

## Formatting And Checks

```sh
bash scripts/format.sh
bash scripts/lint.sh
```

`format.sh` formats `.tex` files and tidies `references.bib`. `lint.sh` checks LaTeX formatting, spelling, and common LaTeX issues.

## Structure

```text
paper.tex              Main document entrypoint
chapters/              Thesis chapters and abstract
references.bib         Bibliography
style.sty              Thesis style package
scripts/               Local build, format, and lint helpers
```

CI builds the PDF and uploads it as an artifact when paper-related files change.
