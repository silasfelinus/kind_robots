#!/usr/bin/env python3
"""Find or migrate hand-rolled `font-black text-2xl` heading-emphasis text to
`kr-text-black-2xl`.

Fifth sibling of kr_text_black_lg_codemod.py / kr_text_black_xl_codemod.py /
kr_text_black_sm_codemod.py / kr_text_black_xs_codemod.py -- a fresh
full-repo class-frequency survey after slice 174 closed out the family (at
the time) at `-lg`/`-xl`/`-sm`/`-xs` found this shape still unnamed at 72
subset-match occurrences across roughly 50 files (interface-vision t-104
slice 175), mostly page-header titles. Same "closed at the sizes surveyed,
not a deliberate exclusion" situation that reopened the family for `-xs`
one slice earlier.

Dry-run by default, --write to update matching Vue files in place. Only the
exact `font-black text-2xl` shape is touched, and only in static
`class="..."` attributes -- never `:class`/`v-bind:class` bindings, and
regardless of the base tokens' order in the source. A source that already
carries `kr-text-black-2xl`, or is missing either base token, is left
untouched. Extra tokens beyond the base set are preserved verbatim after the
primitive class, matching the kr-badge-*/kr-spinner-*/kr-label-bold/
kr-text-dim-*/kr-text-black-{lg,xl,sm,xs} codemods' subset-match convention
-- pass --exact-only to restrict a slice to sources with no extra tokens at
all, the safest and most literal pool.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

CLASS_ATTR = re.compile(r'class="([^"]*)"')

PRIMITIVE = "kr-text-black-2xl"
BASE_TOKENS = {"font-black", "text-2xl"}

# components/pages/serendipity-page.vue's "Serendipity" label is pinned
# verbatim by utils/scripts/verifySerendipityRouteCutover.mjs -- a locked
# route-cutover contract, not a general layout rule -- via an exact regex
# on `class="text-2xl font-black tracking-tight"`. Migrating it here broke
# that check (caught in kind_robots#2553's own CI, interface-vision t-104
# slice 175); AGENTS.md's Companion PRs/close-out guidance already flags
# grepping verify*.ts|mjs for hard-coded markup strings before a sweep like
# this one for exactly this reason. Excluded rather than editing the locked
# contract, since the contract's own comment says it intends to pin this
# exact class string, not just the semantic shape.
EXCLUDED_PATHS = {"components/pages/serendipity-page.vue"}


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
        if path.relative_to(args.root).as_posix() in EXCLUDED_PATHS:
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
    print(f"kr-text-black-2xl {mode} occurrences: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
