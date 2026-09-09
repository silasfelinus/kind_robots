#!/usr/bin/env python3
"""Find or migrate hand-rolled `font-bold text-2xl` heading-emphasis text to
`kr-text-bold-2xl`.

Sibling of kr_text_bold_lg_codemod.py/kr_text_bold_sm_codemod.py/
kr_text_bold_xs_codemod.py/kr_text_bold_xl_codemod.py, fifth and final entry
in the `kr-text-bold-*` family (interface-vision t-104 slice 180) -- closes
the family out to fully match `kr-text-black-*`'s complete
`-sm`/`-xs`/`-lg`/`-xl`/`-2xl` coverage, per slice 179's own kaizen note. Dry-
run by default, --write to update matching Vue files in place. Only the
exact `font-bold text-2xl` shape is touched, and only in static
`class="..."` attributes -- never `:class`/`v-bind:class` bindings, and
regardless of the base tokens' order in the source. A source that already
carries `kr-text-bold-2xl`, or is missing either base token, is left
untouched. Extra tokens beyond the base set are preserved verbatim after the
primitive class, matching the kr-badge-*/kr-spinner-*/kr-label-bold/
kr-text-dim-*/kr-text-black-*/kr-text-bold-* codemods' subset-match
convention -- pass --exact-only to restrict a slice to sources with no
extra tokens at all, the safest and most literal pool.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

# Negative lookbehind excludes `:class="..."`/`v-bind:class="..."` dynamic
# bindings -- both end in `:` immediately before `class=`, so a bare
# `class="([^"]*)"` pattern (the convention every sibling kr-* codemod uses)
# can match into one whenever its bound expression happens to contain a
# literal `class="`-shaped substring, corrupting a template-literal binding
# instead of leaving it untouched (interface-vision t-104 slice 180 caught
# this against components/pages/rebel-button.vue's
# `:class="\`... text-2xl ... font-bold ...\`"` binding -- fixed here first;
# the sibling codemods share the same latent gap, flagged as this slice's
# kaizen candidate rather than rewritten in scope).
CLASS_ATTR = re.compile(r'(?<!:)class="([^"]*)"')

PRIMITIVE = "kr-text-bold-2xl"
BASE_TOKENS = {"font-bold", "text-2xl"}


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
    print(f"kr-text-bold-2xl {mode} occurrences: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
