#!/usr/bin/env python3
"""Find or migrate hand-rolled `loading loading-spinner loading-lg
text-primary` busy indicators to `kr-spinner-lg-primary`.

Sibling of kr_spinner_codemod.py (the `-xs` size) / kr_spinner_sm_codemod.py
(the `-sm` size), same conventions: dry-run by default, --write to update
matching Vue files in place. Only the exact `loading loading-spinner
loading-lg text-primary` shape is touched, and only in static `class="..."`
attributes -- never `:class`/`v-bind:class` bindings, and regardless of the
base tokens' order in the source. A source that already carries
`kr-spinner-lg-primary`, or is missing any one of the base tokens, is left
untouched. Extra tokens beyond the base set are preserved verbatim after the
primitive class, matching the kr-badge-*/kr-spinner-xs/kr-spinner-sm
codemods' subset-match convention -- pass --exact-only to restrict a slice to
sources with no extra tokens at all, the safest and most literal pool.

Unlike kr-spinner-xs/kr-spinner-sm, this primitive bakes in `text-primary`:
the exact bounded family surveyed for `loading-lg` always carried it (26
files, 28 occurrences), with only a single colorless `loading
loading-spinner loading-lg` outlier left untouched as not a bounded family
of its own (interface-vision t-104 slice 157).
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from _class_attr import CLASS_ATTR

PRIMITIVE = "kr-spinner-lg-primary"
BASE_TOKENS = {"loading", "loading-spinner", "loading-lg", "text-primary"}


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
    print(f"kr-spinner-lg-primary {mode} occurrences: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
