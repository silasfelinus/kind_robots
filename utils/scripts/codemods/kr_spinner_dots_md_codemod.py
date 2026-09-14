#!/usr/bin/env python3
"""Find or migrate hand-rolled `loading loading-dots loading-md` busy
indicators to `kr-spinner-md-dots`.

A fresh full-repo class-frequency survey (interface-vision t-104 slice 269)
found the DaisyUI `loading-dots` animation variant repeated as a bare
hand-rolled combo across four sizes, entirely unmigrated -- every prior
`kr-spinner-*` primitive (`.kr-spinner-xs`, `.kr-spinner-sm`,
`.kr-spinner-lg-primary`) covers only the `loading-spinner` animation, and
`kr_loading_primary_xs_codemod.py`'s own docstring explicitly set
`loading-dots` aside as "a separate shape left for a future slice". This is
the third of the four sibling sizes: 3 exact-match occurrences across 3
files (model-builder-run-history.vue, model-builder-source-picker.vue,
model-builder-manager.vue). Siblings `-xs` (8/3), `-sm` (6/6), and `-lg`
(2/2) are migrated by their own sibling codemods in the same slice.

Named `kr-spinner-md-dots` (size before animation-variant) rather than
`kr-spinner-dots-md` to keep every `kr-spinner-<size>*` name alphabetically
adjacent to its already-named `kr-spinner-<size>` sibling when the primitive
list is read in file order.

Dry-run by default, --write to update matching Vue files in place. Only
class strings containing all three base tokens (`loading`, `loading-dots`,
`loading-md`) are touched, and only in static `class="..."` attributes --
never `:class`/`v-bind:class` bindings (see _class_attr.py). A source that
already carries `kr-spinner-md-dots`, or is missing any one of the three
base tokens, is left untouched. Extra tokens beyond the base set are
preserved verbatim after the primitive class, matching every other
kr-*-codemod's subset-match convention -- pass --exact-only to restrict a
slice to sources with no extra tokens at all. Deliberately does NOT touch
any `text-*`-tinted or `motion-reduce:hidden`-carrying variant -- those are
separate shapes left for a future slice.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from _class_attr import CLASS_ATTR

PRIMITIVE = "kr-spinner-md-dots"
BASE_TOKENS = {"loading", "loading-dots", "loading-md"}


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
        "(no extra utility tokens preserved). Bounds a slice to the safest, "
        "most literal candidates; re-run without this flag for the fuller "
        "subset-match pool in a later slice.",
    )
    args = parser.parse_args()

    total = 0
    for path in sorted(args.root.rglob("*.vue")):
        if any(part in {"node_modules", ".nuxt", ".output"} for part in path.parts):
            continue
        # newline="" preserves the file's original line endings verbatim.
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
