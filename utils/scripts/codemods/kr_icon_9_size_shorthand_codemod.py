#!/usr/bin/env python3
"""Find or migrate the `size-9` Tailwind shorthand to `kr-icon-9`.

`size-9` is a plain alias for `h-9 w-9` (Tailwind's `size-*` utility sets
both axes at once) -- CSS-identical to the bare icon-glyph shape
`.kr-icon-9 { @apply h-9 w-9; }` (interface-vision t-104, opened alongside
this codemod). `size-9` is a separate source spelling of the exact same
primitive, not a new shape. Same convention as
`kr_icon_5_size_shorthand_codemod.py`/`kr_icon_8_size_shorthand_codemod.py`
(slices 240-241), just for the `size-9` sibling -- folded into the same
slice that opens `.kr-icon-9` since it only covers 2 occurrences across 2
files, too small to be its own slice.

Excludes any class string carrying a `text-*`/`stroke-*`/`fill-*` token --
that is the `kr-icon-primary-9` (or another future colored sibling) shape,
not this one -- same convention as `kr_icon_5_size_shorthand_codemod.py`.

Dry-run by default, --write to update matching Vue files in place. Only
static `class="..."` attributes are touched, never `:class`/`v-bind:class`
bindings (see _class_attr.py). Pass --exact-only to restrict a slice to
sources with no extra tokens beyond `size-9` itself.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from _class_attr import CLASS_ATTR

PRIMITIVE = "kr-icon-9"
BASE_TOKEN = "size-9"


def migrate_classes(classes: str, exact_only: bool) -> str | None:
    tokens = classes.split()
    if PRIMITIVE in tokens or BASE_TOKEN not in tokens:
        return None
    if any(
        t.startswith("text-") or t.startswith("stroke-") or t.startswith("fill-")
        for t in tokens
    ):
        return None
    remaining = [token for token in tokens if token != BASE_TOKEN]
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


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--write", action="store_true")
    parser.add_argument(
        "--exact-only",
        action="store_true",
        help="Only migrate class strings that are exactly `size-9` (no "
        "extra utility tokens preserved).",
    )
    args = parser.parse_args()

    total = 0
    for path in sorted(args.root.rglob("*.vue")):
        if any(part in {"node_modules", ".nuxt", ".output"} for part in path.parts):
            continue
        with path.open(encoding="utf-8", newline="") as f:
            text = f.read()
        migrated, count = migrate_text(text, args.exact_only)
        if not count:
            continue
        total += count
        print(f"{path.relative_to(args.root)}: {count}")
        if args.write:
            with path.open("w", encoding="utf-8", newline="") as f:
                f.write(migrated)

    mode = "migrated" if args.write else "candidate"
    print(f"kr-icon-9 (size-9 shorthand) {mode} occurrences: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
