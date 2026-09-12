#!/usr/bin/env python3
"""Find or migrate hand-rolled `input input-bordered rounded-2xl` shapes to
`kr-input-rounded-2xl`.

The `rounded-2xl` sibling of `.kr-input-rounded-xl` (interface-vision t-104
slice 236, same slice): the wider-corner-radius override on the same
`.kr-input`-family shape, previously hand-rolled across art-test/performer-
creator/dream-maker/coloring-book surfaces. `input-bordered` is the same
dead legacy v4 class every other `.kr-input*` primitive already drops (the
base `input` class already carries a border in this repo's daisyUI v5),
leaving `input rounded-2xl` as the real applied shape. 32 subset-match
occurrences across 16 files.

Dry-run by default, --write to update matching Vue files in place. Only
class strings containing all three base tokens (`input`, `input-bordered`,
`rounded-2xl`) are touched, and only in static `class="..."` attributes --
never `:class`/`v-bind:class` bindings (see _class_attr.py). A source that
already carries `kr-input-rounded-2xl`, or is missing any one of the three
base tokens, is left untouched. Extra tokens beyond the base set (w-full,
bg-base-100, bg-base-200, focus:border-primary, input-xs, ...) are preserved
verbatim after the primitive class, matching every other kr-*-codemod's
subset-match convention -- pass --exact-only to restrict a slice to sources
with no extra tokens at all.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from _class_attr import CLASS_ATTR

PRIMITIVE = "kr-input-rounded-2xl"
BASE_TOKENS = {"input", "input-bordered", "rounded-2xl"}


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
        # newline="" preserves the file's original line endings verbatim (no
        # universal-newline translation) -- see kr_input_sm_codemod.py for
        # why this matters (kind_robots add-bot.vue, slice 214).
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
