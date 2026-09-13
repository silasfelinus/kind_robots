#!/usr/bin/env python3
"""Find or migrate hand-rolled `loading loading-spinner loading-sm
text-primary` shapes onto a new `kr-loading-primary-sm` primitive.

Sibling of `kr_loading_primary_xs_codemod.py` (see that module's docstring
for the full family rationale) -- interface-vision t-104 slice 260,
migrated together with `-xs` and `-md` in the same slice. This is the
middle sibling size: 5 exact-match occurrences across 4 files
(art-styler.vue, review-list.vue, animation-layer.vue, server-manager.vue).
Deliberately does NOT touch the sibling `art-styler.vue` occurrence carrying
`text-primary-content` instead of `text-primary` -- a distinct tint, left
for a future slice.

Dry-run by default, --write to update matching Vue files in place. Only
class strings containing all four base tokens (`loading`, `loading-spinner`,
`loading-sm`, `text-primary`) are touched, and only in static
`class="..."` attributes -- never `:class`/`v-bind:class` bindings (see
_class_attr.py). A source that already carries `kr-loading-primary-sm`, or
is missing any one of the four base tokens, is left untouched. Extra
tokens beyond the base set are preserved verbatim after the primitive
class, matching every other kr-*-codemod's subset-match convention -- pass
--exact-only to restrict a slice to sources with no extra tokens at all.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from _class_attr import CLASS_ATTR

PRIMITIVE = "kr-loading-primary-sm"
REQUIRED_TOKENS = {"loading", "loading-spinner", "loading-sm", "text-primary"}


def migrate_classes(classes: str, exact_only: bool) -> str | None:
    tokens = classes.split()
    if PRIMITIVE in tokens or not REQUIRED_TOKENS.issubset(tokens):
        return None
    remaining = [token for token in tokens if token not in REQUIRED_TOKENS]
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
        "(no extra utility tokens preserved). Bounds a slice to the safest, "
        "most literal candidates; re-run without this flag for the fuller "
        "subset-match pool in a later slice.",
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
    print(f"{PRIMITIVE} {mode} occurrences: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
