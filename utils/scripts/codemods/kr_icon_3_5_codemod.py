#!/usr/bin/env python3
"""Find or migrate hand-rolled `h-3.5 w-3.5` bare (colorless) icon glyphs to
`kr-icon-3-5`.

Same sizeless-and-colorless icon-glyph shape as `.kr-icon-3`/`.kr-icon-5`/
`.kr-icon-6`/`.kr-icon-7`/`.kr-icon-8` (interface-vision t-104 slices
198-202). Distinct from any future `.kr-icon-primary-3-5` (same size,
carries a `text-primary` color token): this is the plain untinted glyph.

Naming convention decided this slice (flagged as undecided by slices 201
and 202's kaizen notes): a literal `.` is not a valid bare character in a
CSS class selector without an escape (`.kr-icon-3\.5`), which is fragile to
write and grep for across a codebase full of sibling `kr-icon-*` classes.
Dash substitution (`kr-icon-3-5`) reads unambiguously, greps cleanly, and
matches the plain-digit naming every other sibling in this family already
uses -- picked over an escaped-dot selector for exactly those reasons.

Dry-run by default, --write to update matching Vue files in place. Only
class strings containing both `h-3.5` and `w-3.5` tokens are touched, and
only in static `class="..."` attributes -- never `:class`/`v-bind:class`
bindings (see _class_attr.py). A class string carrying any `text-*`/
`stroke-*`/`fill-*` color token is left alone (that is the
`kr-icon-primary-3-5`/future colored-sibling shape, not this one),
regardless of the base tokens' order in the source. A source that already
carries `kr-icon-3-5`, or is missing either base token, is also left
untouched. Extra tokens beyond the base set are preserved verbatim after
the primitive class, matching every other kr-*-codemod's subset-match
convention -- pass --exact-only to restrict a slice to sources with no
extra tokens at all.

Deliberately does NOT touch sibling sizes (`h-3 w-3`, `h-4 w-4`, `h-5 w-5`,
`h-6 w-6`, `h-7 w-7`, `h-8 w-8`) -- those are real, independently-repeated
shapes of their own, already covered or left for future slices.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from _class_attr import CLASS_ATTR

PRIMITIVE = "kr-icon-3-5"
BASE_TOKENS = {"h-3.5", "w-3.5"}


def migrate_classes(classes: str, exact_only: bool) -> str | None:
    tokens = classes.split()
    if PRIMITIVE in tokens or not BASE_TOKENS.issubset(tokens):
        return None
    if any(
        t.startswith("text-") or t.startswith("stroke-") or t.startswith("fill-")
        for t in tokens
    ):
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
        "(no extra utility tokens preserved). Bounds a slice to the safest, "
        "most literal candidates; re-run without this flag for the fuller "
        "subset-match pool in a later slice.",
    )
    args = parser.parse_args()

    total = 0
    for path in sorted(args.root.rglob("*.vue")):
        if any(part in {"node_modules", ".nuxt", ".output"} for part in path.parts):
            continue
        # newline="" preserves the file's original line endings verbatim --
        # see kr_badge_codemod.py for why this matters (kind_robots
        # add-bot.vue, interface-vision t-104 slice 106).
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
    print(f"kr-icon-3-5 {mode} occurrences: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
