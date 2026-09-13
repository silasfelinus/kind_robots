#!/usr/bin/env python3
"""Find or migrate hand-rolled `font-black text-primary` to
`kr-text-black-primary`.

interface-vision t-104 slice 253 (paired with `kr_text_bold_content_codemod.py`
in the same slice, matching how slice 237 bundled two small bounded exact
combos in one PR): the same fresh full-repo class-frequency survey found
this exact 2-token shape at 8 occurrences across 7 files
(server-selector.vue, dream-art-chooser.vue, giftshop-interact.vue x2,
shopping-cart.vue, coloring-book-readiness.vue, stylist-restyle.vue,
server-interact.vue) -- section/card heading emphasis text. Unlike the
existing `kr-text-black-*` family (weight + explicit Tailwind size, e.g.
`.kr-text-black-lg`), this shape pairs the same `font-black` weight with an
explicit `text-primary` color and no size token at all, so it is a new
sibling in spirit rather than a member of the `-sm`/`-xs`/`-lg`/`-xl`/`-2xl`/
`-base` size family. Named with the color as a suffix, matching
`.kr-icon-primary-*`/`.kr-badge-primary-*`'s convention.

Dry-run by default, --write to update matching Vue files in place. Only the
exact `font-black text-primary` shape is touched, and only in static
`class="..."` attributes -- never `:class`/`v-bind:class` bindings,
regardless of the base tokens' order in the source. A source that already
carries `kr-text-black-primary`, or is missing either base token, is left
untouched. Extra tokens beyond the base set are preserved verbatim after the
primitive class -- pass --exact-only to restrict a slice to sources with no
extra tokens at all (this slice's own survey pool is already all-exact, so
--exact-only and its absence produce identical output here).
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from _class_attr import CLASS_ATTR

PRIMITIVE = "kr-text-black-primary"
BASE_TOKENS = {"font-black", "text-primary"}


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
        help="Only migrate class strings that are exactly the base token set "
        "(no extra utility tokens preserved).",
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
    print(f"kr-text-black-primary {mode} occurrences: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
