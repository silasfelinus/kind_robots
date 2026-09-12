#!/usr/bin/env python3
"""Find or migrate hand-rolled `h-10 w-10` bare icon glyphs to `kr-icon-10`.

This is the next bounded sibling after interface-vision/t-104 slice 242 opened
`kr-icon-9`. Dry-run by default; --write updates matching Vue files. The
codemod only touches static class attributes containing both size tokens and
no text/stroke/fill color token. Extra layout/animation tokens are preserved.
Use --exact-only to restrict a slice to the safest literal `h-10 w-10` pool.

The primitive must exist before --write is used. This script deliberately
separates candidate discovery from the CSS/runtime change so connector-only
workers can inventory the next slice without performing a partial migration.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

from _class_attr import CLASS_ATTR

PRIMITIVE = "kr-icon-10"
BASE_TOKENS = {"h-10", "w-10"}
COLOR_PREFIXES = ("text-", "stroke-", "fill-")


def migrate_classes(classes: str, exact_only: bool) -> str | None:
    tokens = classes.split()
    if PRIMITIVE in tokens or not BASE_TOKENS.issubset(tokens):
        return None
    if any(token.startswith(COLOR_PREFIXES) for token in tokens):
        return None
    remaining = [token for token in tokens if token not in BASE_TOKENS]
    if exact_only and remaining:
        return None
    return " ".join([PRIMITIVE, *remaining])


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


def self_test() -> None:
    cases = [
        ('<Icon class="h-10 w-10" />', False, '<Icon class="kr-icon-10" />', 1),
        (
            '<Icon class="animate-spin w-10 h-10" />',
            False,
            '<Icon class="kr-icon-10 animate-spin" />',
            1,
        ),
        ('<Icon class="h-10 w-10 text-info" />', False, None, 0),
        ('<Icon :class="\'h-10 w-10\'" />', False, None, 0),
        ('<Icon class="h-10 w-10 animate-spin" />', True, None, 0),
    ]
    for source, exact_only, expected, expected_count in cases:
        migrated, count = migrate_text(source, exact_only)
        assert count == expected_count, (source, count)
        if expected is not None:
            assert migrated == expected, (source, migrated)
        else:
            assert migrated == source, (source, migrated)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--exact-only", action="store_true")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        self_test()
        print("kr-icon-10 codemod self-test: ok")
        return 0

    total = 0
    for path in sorted(args.root.rglob("*.vue")):
        if any(part in {"node_modules", ".nuxt", ".output"} for part in path.parts):
            continue
        with path.open(encoding="utf-8", newline="") as handle:
            text = handle.read()
        migrated, count = migrate_text(text, args.exact_only)
        if not count:
            continue
        total += count
        print(f"{path.relative_to(args.root)}: {count}")
        if args.write:
            with path.open("w", encoding="utf-8", newline="") as handle:
                handle.write(migrated)

    mode = "migrated" if args.write else "candidate"
    print(f"kr-icon-10 {mode} occurrences: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
