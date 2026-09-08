#!/usr/bin/env python3
"""Find or migrate hand-rolled kr-icon-tile page-header icon badges: a
tinted `h-12 w-12` square housing a page-header `<Icon>`, sitting beside
the page title the same way every page-header component in
`components/pages/*.vue` composes its hero row (interface-vision t-104
slice 149).

Dry-run is the default. Pass --write to update matching Vue files in place.
Only static `class="..."` attributes are touched -- never `:class`/
`v-bind:class` bindings -- regardless of the base tokens' order in the
source. A source that already carries the target primitive, or is missing
any one of the base tokens, is left untouched. Extra tokens beyond the base
set are preserved verbatim after the primitive class, matching the
kr-tile/kr-badge-*/kr-toggle-row-* codemods' subset-match convention.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

CLASS_ATTR = re.compile(r'class="([^"]*)"')

PRIMITIVE = "kr-icon-tile"
BASE_TOKENS = {
    "grid",
    "h-12",
    "w-12",
    "shrink-0",
    "place-items-center",
    "rounded-2xl",
    "bg-primary/15",
    "text-primary",
}


def migrate_classes(classes: str) -> str | None:
    tokens = classes.split()
    if PRIMITIVE in tokens or not BASE_TOKENS.issubset(tokens):
        return None
    remaining = [token for token in tokens if token not in BASE_TOKENS]
    return " ".join([PRIMITIVE, *remaining])


def migrate_text(text: str) -> tuple[str, int]:
    count = 0

    def replace(match: re.Match[str]) -> str:
        nonlocal count
        migrated = migrate_classes(match.group(1))
        if migrated is None:
            return match.group(0)
        count += 1
        return f'class="{migrated}"'

    return CLASS_ATTR.sub(replace, text), count


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()

    total = 0
    for path in sorted(args.root.rglob("*.vue")):
        if any(part in {"node_modules", ".nuxt", ".output"} for part in path.parts):
            continue
        # newline="" preserves the file's original line endings verbatim, same
        # rationale as the badge/toggle-row/tile codemods (interface-vision
        # t-104 slice 106).
        with path.open(encoding="utf-8", newline="") as f:
            text = f.read()
        migrated, count = migrate_text(text)
        if not count:
            continue
        total += count
        print(f"{path.relative_to(args.root)}: {count}")
        if args.write:
            with path.open("w", encoding="utf-8", newline="") as f:
                f.write(migrated)

    mode = "migrated" if args.write else "candidate"
    print(f"{PRIMITIVE} {mode} occurrences: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
