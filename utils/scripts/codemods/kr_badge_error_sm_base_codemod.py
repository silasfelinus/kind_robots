#!/usr/bin/env python3
"""Find or migrate hand-rolled `badge badge-error badge-sm` badges.

Interface Vision t-104 bounded consistency tooling. The repository already
has the colorless `kr-badge-sm` primitive; this migration keeps `badge-error`
as the color modifier, matching existing dynamic/static call sites without
inventing a new `kr-badge-error-sm` primitive.

Dry-run by default. Only static class attributes are considered. Extra tokens
are preserved; pass --exact-only to restrict a slice to the literal three-token
shape.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

from _class_attr import CLASS_ATTR

BASE_TOKENS = {"badge", "badge-error", "badge-sm"}
PRIMITIVE = "kr-badge-sm"


def migrate_classes(classes: str, exact_only: bool) -> str | None:
    tokens = classes.split()
    if PRIMITIVE in tokens or not BASE_TOKENS.issubset(tokens):
        return None
    remaining = [token for token in tokens if token not in BASE_TOKENS]
    if exact_only and remaining:
        return None
    return " ".join([PRIMITIVE, "badge-error", *remaining])


def migrate_text(text: str, exact_only: bool) -> tuple[str, int]:
    count = 0

    def replace(match: re.Match[str]) -> str:
        nonlocal count
        migrated = migrate_classes(match.group(1), exact_only)
        if migrated is None:
            return match.group(0)
        count += 1
        return f'class="{migrated}"'

    return CLASS_ATTR.sub(replace, text), count


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--exact-only", action="store_true")
    args = parser.parse_args()

    total = 0
    files = 0
    for path in sorted(args.root.rglob("*.vue")):
        if any(part in {"node_modules", ".nuxt", ".output"} for part in path.parts):
            continue
        with path.open(encoding="utf-8", newline="") as handle:
            text = handle.read()
        migrated, count = migrate_text(text, args.exact_only)
        if not count:
            continue
        files += 1
        total += count
        print(f"{path.relative_to(args.root)}: {count}")
        if args.write:
            with path.open("w", encoding="utf-8", newline="") as handle:
                handle.write(migrated)

    action = "migrated" if args.write else "candidate"
    print(f"badge error sm {action} occurrences: {total} across {files} files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
