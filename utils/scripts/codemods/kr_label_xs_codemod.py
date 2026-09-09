#!/usr/bin/env python3
"""Find or migrate hand-rolled `label-text text-xs` form-label captions to
`kr-label-xs`.

Sibling of `kr_label_bold_codemod.py` (`label-text font-bold` ->
`kr-label-bold`), but for the plain, weightless size variant -- the base
`label-text` token is dropped in the migrated output because it is
confirmed dead CSS in this repo (no `.label-text` rule exists anywhere in
`assets/` or in daisyui's own dist CSS; see `kr_label_bold_codemod.py`'s
docstring, which established this fact first). A fresh survey outside the
now-closed `kr-text-bold-*`/`kr-text-black-*`/`kr-text-dim-*`/
`kr-text-eyebrow-*` families found `label-text text-xs` (with no
`font-semibold` alongside -- that combination is its own sibling family,
see `kr_label_xs_semibold_codemod.py`) at 21 exact-match occurrences across
4 files this slice (interface-vision t-104 slice 173), previously flagged
in `kr_label_bold_codemod.py`'s own docstring back in slice 151/152 as a
bounded family for a future slice.

Dry-run by default, --write to update matching Vue files in place. Only the
exact `label-text text-xs` base pair is touched (a class string that also
carries `font-semibold` is left for `kr_label_xs_semibold_codemod.py`), and
only in static `class="..."` attributes -- never `:class`/`v-bind:class`
bindings, regardless of the base tokens' order in the source. A source that
already carries `kr-label-xs`, or is missing either base token, is left
untouched. Extra tokens beyond the base set are preserved verbatim after
the primitive class, matching the kr-badge-*/kr-spinner-*/kr-label-bold/
kr-text-dim-*/kr-text-black-*/kr-text-eyebrow-*/kr-text-bold-* codemods'
subset-match convention -- pass --exact-only to restrict a slice to
sources with no extra tokens at all, the safest and most literal pool.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from _class_attr import CLASS_ATTR

PRIMITIVE = "kr-label-xs"
BASE_TOKENS = {"label-text", "text-xs"}
EXCLUDE_TOKENS = {"font-semibold"}


def migrate_classes(classes: str, exact_only: bool) -> str | None:
    tokens = classes.split()
    token_set = set(tokens)
    if PRIMITIVE in token_set or not BASE_TOKENS.issubset(token_set):
        return None
    if token_set & EXCLUDE_TOKENS:
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
    print(f"kr-label-xs {mode} occurrences: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
