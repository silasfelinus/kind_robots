#!/usr/bin/env python3
"""Find or migrate the `size-full object-cover` Tailwind shorthand pair onto
the existing `.kr-img-cover` primitive.

`.kr-img-cover { @apply h-full w-full object-cover; }` (opened earlier in
the interface-vision t-104 umbrella) already exists and is used at 30
sites. `size-full` is a plain alias for `h-full w-full` (Tailwind's
`size-*` utility sets both axes at once), so `size-full object-cover` is
CSS-identical to `h-full w-full object-cover` -- the same primitive under
a different source spelling, not a new shape. This is the `kr-img-cover`
sibling of the `kr-icon-N` `size-N` shorthand codemods (slices
242/244/245): those folded a `size-N` spelling into a bare icon-glyph
primitive that already existed under the `h-N w-N` spelling; this does the
same for `kr-img-cover`.

Found via a fresh full-repo class-frequency survey outside every closed
family (t-104 slice 246's kaizen note): `object-cover size-full` was the
single largest well-bounded pool left (10 files / 14 occurrences at survey
time; the full `class="..."` scan below finds 19 occurrences across 15
files once combos with extra tokens, e.g. `absolute inset-0 ...` prefixes
or a `grayscale`/`transition ...` suffix, are included).

Extra tokens beyond the base pair are preserved verbatim after the
primitive class, same subset-match convention as kr-badge-ghost/
kr-toggle-*: they are independent utilities layered on top (positioning,
filters, transitions), not part of the object-fit shape itself.

Dry-run by default, --write to update matching Vue files in place. Only
static `class="..."` attributes are touched, never `:class`/`v-bind:class`
bindings (see _class_attr.py). Pass --exact-only to restrict a slice to
sources with no extra tokens beyond the base pair itself.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from _class_attr import CLASS_ATTR

PRIMITIVE = "kr-img-cover"
BASE_TOKENS = {"size-full", "object-cover"}


def migrate_classes(classes: str, exact_only: bool) -> str | None:
    tokens = classes.split()
    if PRIMITIVE in tokens or not BASE_TOKENS.issubset(tokens):
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


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--write", action="store_true")
    parser.add_argument(
        "--exact-only",
        action="store_true",
        help="Only migrate class strings that are exactly `size-full "
        "object-cover` (no extra utility tokens preserved).",
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
    print(f"kr-img-cover (size-full object-cover shorthand) {mode} occurrences: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
