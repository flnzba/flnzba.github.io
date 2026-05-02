#!/usr/bin/env python3
"""Validate Crier JSON output from the cross-post workflow."""

from __future__ import annotations

import json
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: check_crosspost_results.py <crier-output.json>", file=sys.stderr)
        return 2

    output_path = Path(sys.argv[1])
    if not output_path.exists():
        print(f"Crier output not found: {output_path}", file=sys.stderr)
        return 1

    raw_output = output_path.read_text()
    json_start = raw_output.rfind('{\n  "command": "audit"')
    if json_start == -1:
        json_start = raw_output.rfind('{"command": "audit"')
    if json_start == -1:
        if "All content is up-to-date" in raw_output:
            print("No posts were published. All staged posts are already in the Crier registry.")
            return 0
        print("Crier output did not include a JSON audit result.", file=sys.stderr)
        print(raw_output[-2000:], file=sys.stderr)
        return 1

    try:
        data = json.loads(raw_output[json_start:])
    except json.JSONDecodeError as exc:
        print(f"Crier output is not valid JSON: {exc}", file=sys.stderr)
        return 1

    results = data.get("results", [])
    summary = data.get("summary", {})
    failed = int(summary.get("failed", 0))
    succeeded = int(summary.get("succeeded", 0))

    print(f"Crier publish summary: {succeeded} succeeded, {failed} failed")

    for result in results:
        if result.get("success"):
            print(f"- OK {result.get('platform')}: {result.get('url') or result.get('article_id')}")
        else:
            print(
                f"- FAIL {result.get('platform')} {result.get('file')}: {result.get('error')}",
                file=sys.stderr,
            )

    if failed:
        return 1
    if not succeeded:
        print("No posts were published. Nothing new was missing from the Crier registry.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
