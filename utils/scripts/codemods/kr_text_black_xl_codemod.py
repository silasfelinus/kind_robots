#!/usr/bin/env python3
"""Find or migrate hand-rolled `font-black text-xl` heading-emphasis text to
`kr-text-black-xl`.

Sibling of kr_text_black_lg_codemod.py, second of the `kr-text-black-*`
family (interface-vision t-104 slice 165): dry-run by default, --write to
update matching Vue files in place. Only the exact `font-black text-xl`
shape is touched, and only in static `class="..."` attributes -- never
`:class`/`v-bind:class` bindings, and regardless of the base tokens' order
in the source. A source that already carries `kr-text-black-xl`, or is
missing either base token, is left untouched. Extra tokens beyond the base
set are preserved verbatim after the primitive class, matching the
kr-badge-*/kr-spinner-*/kr-label-bold/kr-text-dim-*/kr-text-black-lg
codemods' subset-match convention -- pass --exact-only to restrict a slice
to sources with no extra tokens at all, the safest and most literal pool.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from _class_attr import CLASS_ATTR

PRIMITIVE = "kr-text-black-xl"
BASE_TOKENS = {"font-black", "text-xl"}


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
    print(f"kr-text-black-xl {mode} occurrences: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
