#!/usr/bin/env python3

from __future__ import annotations

import os
import xml.etree.ElementTree as ET
from pathlib import Path


def int_attr(node: ET.Element, name: str) -> int:
    return int(node.attrib.get(name, 0) or 0)


def truncate(text: str, limit: int = 240) -> str:
    text = " ".join(text.split())
    if len(text) <= limit:
        return text
    return text[: limit - 3] + "..."


def collect_suites(root: ET.Element) -> list[ET.Element]:
    if root.tag == "testsuite":
        return [root]
    return list(root.findall("testsuite"))


def collect_failed_cases(suites: list[ET.Element]) -> list[tuple[str, str]]:
    failed_cases: list[tuple[str, str]] = []

    for suite in suites:
        suite_name = suite.attrib.get("name", "")
        for case in suite.findall("testcase"):
            failure = case.find("failure")
            error = case.find("error")
            if failure is None and error is None:
                continue

            detail_node = failure if failure is not None else error
            case_name = case.attrib.get("name", "<unnamed test>")
            name = f"{suite_name}.{case_name}" if suite_name else case_name
            detail = detail_node.attrib.get("message", "") or detail_node.text or "See test report for details."
            failed_cases.append((name, truncate(detail)))

    return failed_cases


def main() -> None:
    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if not summary_path:
        return

    report_dir = Path(os.environ["COMPILER_REPORT_DIR"])
    junit_path = report_dir / "ctest-junit.xml"

    report_name = os.environ.get("TEST_REPORT_NAME") or os.environ.get("APP_NAME", "CTest")

    with open(summary_path, "a", encoding="utf-8") as summary:
        summary.write(f"## {report_name} Test Report\n\n")

        if not junit_path.exists():
            summary.write("CTest JUnit report was not generated. See the job logs for details.\n\n")
            return

        root = ET.parse(junit_path).getroot()
        suites = collect_suites(root)

        tests = 0
        failures = 0
        skipped = 0

        for suite in suites:
            tests += int_attr(suite, "tests")
            failures += int_attr(suite, "failures") + int_attr(suite, "errors")
            skipped += int_attr(suite, "skipped") or sum(
                1 for case in suite.findall("testcase") if case.find("skipped") is not None
            )

        passed = tests - failures - skipped
        summary.write(f"- Total: `{tests}`\n")
        summary.write(f"- Passed: `{passed}`\n")
        summary.write(f"- Failed: `{failures}`\n")
        summary.write(f"- Skipped: `{skipped}`\n\n")

        failed_cases = collect_failed_cases(suites)
        if failed_cases:
            summary.write("| Failing test | Details |\n")
            summary.write("| --- | --- |\n")
            for name, detail in failed_cases[:20]:
                escaped_detail = detail.replace("|", "\\|")
                summary.write(f"| `{name}` | {escaped_detail} |\n")


if __name__ == "__main__":
    main()
