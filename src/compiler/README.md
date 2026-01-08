# Online Microprocesser IDE Compiler Service

Compiles scripts sent-in and returns their binary executables for the Online Microprocessor IDE.

# Installation

This project uses [Python](https://www.python.org/) version 3.12 (or later). Make sure to install this version installed on your local system.

Additionally, this project is built using [uv](https://docs.astral.sh/uv/guides/install-python/) as its package manager. This guide will use this program for its installation and execution steps. However, other tools such as `.venv` or `conda` can be used as well (but there will be no guide to setup this service here).

--- TODO ---
Since this is built and shipped as a Docker containerized service, wait for [STORY-COMP-1](https://github.com/butterman0423/mpide-platform/issues/9) to be completed first.


# Code Style and Formatting

To ensure that all contributions has the same code format, run the linter before pushing and creating your PR.
```
uv run ruff check --fix
```

Note that the linter may not be able to automatically correct the errors it detects.
