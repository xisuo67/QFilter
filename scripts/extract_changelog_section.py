#!/usr/bin/env python3
"""Extract the CHANGELOG.md block for one version: from \"## x.y.z\" until the next \"## \" heading."""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


def extract_section(content: str, version: str) -> str | None:
    start_re = re.compile(rf"^##\s+{re.escape(version)}(\s|$|\()")
    heading_re = re.compile(r"^##\s+")
    out: list[str] = []
    in_section = False
    for line in content.splitlines(keepends=True):
        if not in_section:
            if start_re.match(line):
                in_section = True
                out.append(line)
            continue
        if heading_re.match(line):
            break
        out.append(line)
    text = "".join(out).rstrip("\n")
    return text if text else None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("changelog", type=Path)
    parser.add_argument("version")
    args = parser.parse_args()
    path = args.changelog
    if not path.is_file():
        print(f"Changelog not found: {path}", file=sys.stderr)
        return 1
    text = path.read_text(encoding="utf-8")
    section = extract_section(text, args.version)
    if section is None:
        print(f"No changelog section found for version: {args.version}", file=sys.stderr)
        return 1
    # GitHub Windows runners may default to cp1252; write UTF-8 bytes explicitly.
    out = section if section.endswith("\n") else f"{section}\n"
    sys.stdout.buffer.write(out.encode("utf-8"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
