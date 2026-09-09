#!/usr/bin/env python3
"""Find or migrate hand-rolled `label-text text-xs font-semibold` form-label
captions to `kr-label-xs-semibold`.

Sibling of `kr_label_xs_codemod.py` (`label-text text-xs` -> `kr-label-xs`),
carrying the extra `font-semibold` weight -- kept as its own named family
rather than folded into `kr-label-xs` plus a preserved `font-semibold`
extra, matching this codebase's established convention of naming each
distinct compound weight/size shape separately (`kr-text-dim-xs-45` vs.
`-55` vs. `-60`, `kr-text-bold-sm` vs. `kr-text-bold-xs`, etc.) rather than
treating a real style token as generic pass-through. The base `label-text`
token is dropped in the migrated output because it is confirmed dead CSS
in this repo (no `.label-text` rule exists anywhere in `assets/` or in
daisyui's own dist CSS; see `kr_label_bold_codemod.py`'s docstring, which
established this fact first). A fresh survey found this shape at 29
subset-match occurrences across 5 files this slice (interface-vision t-104
slice 173; 15 exact, 14 carrying an additional `mb-1` in
image-upload.vue/storybook-life-run.vue), previously flagged in
`kr_label_bold_codemod.py`'s own docstring back in slice 151/152 as a
bounded family for a future slice.

Dry-run by default, --write to update matching Vue files in place. Only the
exact `label-text text-xs font-semibold` base set is touched, and only in
static `class="..."` attributes -- never `:class`/`v-bind:class` bindings,
regardless of the base tokens' order in the source. A source that already
carries `kr-label-xs-semibold`, or is missing any one base token, is left
untouched. Extra tokens beyond the base set are preserved verbatim after
the primitive class, matching the kr-badge-*/kr-spinner-*/kr-label-bold/
kr-label-xs/kr-text-dim-*/kr-text-black-*/kr-text-eyebrow-*/kr-text-bold-*
codemods' subset-match convention -- pass --exact-only to restrict a slice
to sources with no extra tokens at all, the safest and most literal pool.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

CLASS_ATTR = re.compile(r'class="([^"]*)"')

PRIMITIVE = "kr-label-xs-semibold"
BASE_TOKENS = {"label-text", "text-xs", "font-semibold"}


def migrate_classes(classes: str, exact_only: bool) -> str | None:
    tokens = classes.split()
    token_set = set(tokens)
    if PRIMITIVE in token_set or not BASE_TOKENS.issubset(token_set):
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
    print(f"kr-label-xs-semibold {mode} occurrences: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
