#!/usr/bin/env python3
"""Find or migrate hand-rolled `font-bold text-base-content` to
`kr-text-bold-content`.

interface-vision t-104 slice 253: a fresh full-repo class-frequency survey
outside all now-closed `kr-text-black-*`/`kr-text-bold-*`/`kr-text-dim-*`/
`kr-text-eyebrow*`/`kr-label-*`/`kr-icon-primary-*` families found this exact
2-token shape at 9 occurrences across 7 files (add-bot.vue,
model-builder-recipe-selector.vue, model-builder-item-panel.vue,
model-builder-progress-matrix.vue, add-character.vue, art-gallery.vue x3,
about-page.vue) -- unlike the existing `kr-text-bold-*` family (weight +
explicit Tailwind size, e.g. `.kr-text-bold-lg`), this shape pairs the same
`font-bold` weight with an explicit `text-base-content` color and no size
token at all, so it is a new sibling in spirit rather than a member of the
`-sm`/`-xs`/`-lg`/`-xl`/`-2xl` size family. Named with the color as a
suffix, matching `.kr-icon-primary-*`/`.kr-badge-primary-*`'s convention of
appending the color token to the base shape name.

Dry-run by default, --write to update matching Vue files in place. Only the
exact `font-bold text-base-content` shape is touched, and only in static
`class="..."` attributes -- never `:class`/`v-bind:class` bindings,
regardless of the base tokens' order in the source. A source that already
carries `kr-text-bold-content`, or is missing either base token, is left
untouched. Extra tokens beyond the base set are preserved verbatim after the
primitive class, matching every other kr-text-*/kr-badge-*/kr-icon-primary-*
codemod's subset-match convention -- pass --exact-only to restrict a slice to
sources with no extra tokens at all, the safest and most literal pool (this
slice's own survey pool is already all-exact, so --exact-only and its
absence produce identical output here).
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from _class_attr import CLASS_ATTR

PRIMITIVE = "kr-text-bold-content"
BASE_TOKENS = {"font-bold", "text-base-content"}


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
    print(f"kr-text-bold-content {mode} occurrences: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
