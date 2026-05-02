#!/usr/bin/env python3
"""Point Crier registry entries back at the real source files."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: link_crosspost_registry.py <manifest.json>", file=sys.stderr)
        return 2

    manifest_path = Path(sys.argv[1])
    manifest = json.loads(manifest_path.read_text())
    posts = manifest.get("posts", [])
    if not posts:
        print("No registry links to update.")
        return 0

    for post in posts:
        source = post["source"]
        canonical_url = post["canonical_url"]
        subprocess.run(
            ["crier", "link", source, "--url", canonical_url],
            cwd=REPO_ROOT,
            check=True,
        )
        print(f"Linked registry entry: {source}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
