#!/usr/bin/env python3
"""Find or migrate hand-rolled kr-tile-{sm,md} info/stat tiles -- a
borderless rounded-2xl bg-base-200 box, distinct from every existing
kr-panel-* surface (`.kr-panel`, `.kr-panel-muted`, `.kr-panel-flat`, ...),
which all carry a `border border-base-300` outline. This shape never does
(interface-vision t-104 slice 148).

Dry-run is the default. Pass --write to update matching Vue files in place.
Only static `class="..."` attributes are touched -- never `:class`/
`v-bind:class` bindings -- regardless of the base tokens' order in the
source. A source that already carries the target primitive, or is missing
any one of the base tokens, is left untouched. Extra tokens beyond the base
set are preserved verbatim after the primitive class, matching the
kr-badge-*/kr-toggle-row-* codemods' subset-match convention -- they're
plain Tailwind utilities layered on top, not another component-root class.

FAMILIES is ordered most-specific-first (larger padding before smaller) so
neither entry's base set can ever be mistaken for the other's -- `p-2` and
`p-3` are disjoint tokens, so order doesn't actually affect correctness
here, but keeping the convention matches the other multi-entry codemods
in this directory.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

CLASS_ATTR = re.compile(r'class="([^"]*)"')

FAMILIES = [
    (
        "kr-tile-md",
        {"rounded-2xl", "bg-base-200", "p-3"},
    ),
    (
        "kr-tile-sm",
        {"rounded-2xl", "bg-base-200", "p-2"},
    ),
]


def migrate_classes(classes: str) -> str | None:
    tokens = classes.split()
    if "border" in tokens:
        # A bordered rounded-2xl/bg-base-200 box is the existing
        # .kr-panel-muted-sm/-md shape (or an as-yet-unnamed border+p-2
        # variant) -- a structurally different surface from the borderless
        # kr-tile family, not a superset of it. Leave it untouched rather
        # than silently dropping its border.
        return None
    for primitive, base_tokens in FAMILIES:
        if primitive in tokens or not base_tokens.issubset(tokens):
            continue
        remaining = [token for token in tokens if token not in base_tokens]
        return " ".join([primitive, *remaining])
    return None


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
        # rationale as the badge/toggle-row codemods (interface-vision t-104
        # slice 106).
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
    print(f"kr-tile-* {mode} occurrences: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
