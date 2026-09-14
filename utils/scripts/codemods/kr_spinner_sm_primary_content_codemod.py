#!/usr/bin/env python3
"""Migrate small primary-content spinners onto the shared kr-spinner-sm primitive.

Interface Vision t-104 follow-up to the colorless kr-spinner-sm sweep. The remaining
live Vue candidate is `loading loading-spinner loading-sm text-primary-content` in
art-styler.vue. This codemod deliberately keeps `text-primary-content` as a call-site
utility because color is contextual while kr-spinner-sm owns only spinner shape/size.

Dry-run by default; pass --write to update matching Vue files. Static class attributes
only. Extra tokens are preserved verbatim.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

CLASS_ATTR = re.compile(r'class="([^"]*)"')
REQUIRED = {"loading", "loading-spinner", "loading-sm", "text-primary-content"}
REMOVE = {"loading", "loading-spinner", "loading-sm"}
PRIMITIVE = "kr-spinner-sm"


def migrate(text: str) -> tuple[str, int]:
    count = 0

    def replace(match: re.Match[str]) -> str:
        nonlocal count
        tokens = match.group(1).split()
        if PRIMITIVE in tokens or not REQUIRED.issubset(tokens):
            return match.group(0)
        migrated = [PRIMITIVE if token == "loading" else token for token in tokens]
        migrated = [token for token in migrated if token not in REMOVE]
        count += 1
        return f'class="{" ".join(migrated)}"'

    return CLASS_ATTR.sub(replace, text), count


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    parser.add_argument("root", nargs="?", default=".")
    args = parser.parse_args()

    total = 0
    for path in sorted(Path(args.root).glob("**/*.vue")):
        original = path.read_text(encoding="utf-8")
        migrated, count = migrate(original)
        if not count:
            continue
        total += count
        print(f"{path}: {count}")
        if args.write:
            path.write_text(migrated, encoding="utf-8")

    mode = "migrated" if args.write else "candidate"
    print(f"kr-spinner-sm + text-primary-content {mode} occurrences: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
