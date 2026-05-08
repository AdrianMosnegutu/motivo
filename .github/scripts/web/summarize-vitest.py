#!/usr/bin/env python3

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any


def read_json(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def pct(value: Any) -> str:
    if isinstance(value, (int, float)):
        return f"{value:.2f}%"
    return "n/a"


def collect_failed_tests(report: dict[str, Any]) -> list[tuple[str, str]]:
    failed: list[tuple[str, str]] = []

    for suite in report.get("testResults", []):
        for assertion in suite.get("assertionResults", []):
            if assertion.get("status") not in {"failed", "error"}:
                continue

            name = assertion.get("fullName") or assertion.get("title") or "<unnamed test>"
            messages = assertion.get("failureMessages") or []
            detail = " ".join(" ".join(str(message).split()) for message in messages)
            failed.append((str(name), detail[:240] if detail else "See test report for details."))

    return failed


def write_summary(
    summary_path: Path,
    report_name: str,
    report: dict[str, Any] | None,
    coverage: dict[str, Any] | None,
) -> None:
    with summary_path.open("a", encoding="utf-8") as summary:
        summary.write(f"## {report_name} Test Report\n\n")

        if report is None:
            summary.write("Vitest JSON report was not generated. See the job logs for details.\n\n")
        else:
            total = report.get("numTotalTests", 0)
            passed = report.get("numPassedTests", 0)
            failed = report.get("numFailedTests", 0)
            skipped = report.get("numPendingTests", 0) + report.get("numTodoTests", 0)

            summary.write(f"- Total: `{total}`\n")
            summary.write(f"- Passed: `{passed}`\n")
            summary.write(f"- Failed: `{failed}`\n")
            summary.write(f"- Skipped: `{skipped}`\n\n")

            failed_tests = collect_failed_tests(report)
            if failed_tests:
                summary.write("| Failing test | Details |\n")
                summary.write("| --- | --- |\n")
                for name, detail in failed_tests[:20]:
                    escaped_detail = detail.replace("|", "\\|")
                    summary.write(f"| `{name}` | {escaped_detail} |\n")
                summary.write("\n")

        total_coverage = (coverage or {}).get("total", {})
        if total_coverage:
            summary.write("| Coverage | % | Covered / Total |\n")
            summary.write("| --- | ---: | ---: |\n")
            for key in ("lines", "statements", "functions", "branches"):
                item = total_coverage.get(key, {})
                summary.write(
                    f"| {key.title()} | {pct(item.get('pct'))} | "
                    f"`{item.get('covered', 'n/a')}` / `{item.get('total', 'n/a')}` |\n"
                )
            summary.write("\n")


def main() -> None:
    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if not summary_path:
        return

    report_name = os.environ.get("TEST_REPORT_NAME") or os.environ.get("APP_NAME", "Vitest")
    report_path = Path(os.environ["VITEST_REPORT_PATH"])
    coverage_path = Path(os.environ["COVERAGE_SUMMARY_PATH"])

    write_summary(
        Path(summary_path),
        report_name,
        read_json(report_path),
        read_json(coverage_path),
    )


if __name__ == "__main__":
    main()
