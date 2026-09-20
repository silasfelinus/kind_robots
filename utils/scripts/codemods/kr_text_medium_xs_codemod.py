#!/usr/bin/env python3
"""Find hand-rolled `font-medium text-xs` text for a future kr-* primitive.

Interface Vision t-104 bounded survey slice. This is discovery-only: the repo
has no `kr-text-medium-xs` primitive yet, so this tool intentionally has no
--write mode. It quantifies the family without changing runtime classes and
keeps the eventual migration mechanical once the primitive is opened.

Only static `class="..."` attributes are considered, never :class/v-bind.
The base tokens may appear in either order. Extra tokens are preserved in the
reported candidate pool; pass --exact-only to count only the literal two-token
shape.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from _class_attr import CLASS_ATTR

BASE_TOKENS = {"font-medium", "text-xs"}


def is_candidate(classes: str, exact_only: bool) -> bool:
    tokens = classes.split()
    if not BASE_TOKENS.issubset(tokens):
        return False
    if exact_only and set(tokens) != BASE_TOKENS:
        return False
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument(
        "--exact-only",
        action="store_true",
        help="Count only class strings containing exactly font-medium and text-xs.",
    )
    args = parser.parse_args()

    total = 0
    files = 0
    for path in sorted(args.root.rglob("*.vue")):
        if any(part in {"node_modules", ".nuxt", ".output"} for part in path.parts):
            continue
        with path.open(encoding="utf-8", newline="") as handle:
            text = handle.read()
        count = sum(
            1
            for match in CLASS_ATTR.finditer(text)
            if is_candidate(match.group(1), args.exact_only)
        )
        if not count:
            continue
        files += 1
        total += count
        print(f"{path.relative_to(args.root)}: {count}")

    print(f"font-medium text-xs candidate occurrences: {total} across {files} files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
