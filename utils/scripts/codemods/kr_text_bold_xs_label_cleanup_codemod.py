#!/usr/bin/env python3
"""Drop the dead `label-text` token trailing an already-migrated
`kr-text-bold-xs` class.

Follow-up to `kr_text_bold_xs_codemod.py` (interface-vision t-104 slice
171). That codemod's own docstring expected `label-text text-xs font-bold`
(25 occurrences, 4 files -- previously flagged in `kr_label_bold_codemod.py`'s
docstring as its own bounded family) to be "still left for" a future slice,
but its subset-match convention -- `BASE_TOKENS = {"font-bold", "text-xs"}`,
order-independent, extra tokens preserved -- means slice 170 actually
absorbed those exact 25 occurrences already: `label-text text-xs font-bold`
contains `font-bold`/`text-xs` as a subset, so it became `kr-text-bold-xs
label-text` (or `kr-text-bold-xs label-text mb-1`), with the inert
`label-text` token carried along verbatim as an "extra" token rather than
recognized as the dead markup it is.

`label-text` is confirmed dead under daisyUI 5 -- no `.label-text` CSS rule
exists anywhere in this repo's `assets/` or in daisyui's own dist CSS (see
`kr_label_bold_codemod.py`'s docstring, which established this same fact
when it dropped the identical token from the unsized `label-text font-bold`
family). Dropping it here is the same pure no-op: the `font-bold text-xs`
visual contract is already fully carried by `.kr-text-bold-xs`.

Deliberately scoped to only the `kr-text-bold-xs label-text` shape (the
exact family flagged above), not a full-repo dead-`label-text` sweep --
~99 other `label-text` occurrences remain (paired with `kr-text-eyebrow`,
`kr-text-eyebrow-bold`, `kr-text-dim-xs-*`, or no kr-* primitive at all)
that this slice has not surveyed. Left for a future slice, same convention
as every other bounded family in this series.

Dry-run by default, --write to update matching Vue files in place. Only
static `class="..."` attributes are touched, never `:class`/`v-bind:class`
bindings.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

CLASS_ATTR = re.compile(r'class="([^"]*)"')

PRIMITIVE = "kr-text-bold-xs"
DEAD_TOKEN = "label-text"


def migrate_classes(classes: str) -> str | None:
    tokens = classes.split()
    if PRIMITIVE not in tokens or DEAD_TOKEN not in tokens:
        return None
    remaining = [token for token in tokens if token != DEAD_TOKEN]
    return " ".join(remaining)


def migrate_text(text: str) -> tuple[str, int]:
    count = 0

    def replace(match: re.Match[str]) -> str:
        nonlocal count
        migrated = migrate_classes(match.group(1))
        if migrated is None:
            return match.group(0)
        count += 1
        return f'class="{migrated}"'

    return CLASS_ATTR.sub(replace, text), count


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--write", action="store_true")
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
        migrated, count = migrate_text(text)
        if not count:
            continue
        total += count
        print(f"{path.relative_to(args.root)}: {count}")
        if args.write:
            with path.open("w", encoding="utf-8", newline="") as f:
                f.write(migrated)

    mode = "migrated" if args.write else "candidate"
    print(f"kr-text-bold-xs dead-label-text {mode} occurrences: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
