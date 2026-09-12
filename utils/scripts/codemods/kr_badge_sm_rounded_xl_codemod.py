#!/usr/bin/env python3
"""Find or migrate hand-rolled `badge badge-sm rounded-xl` shapes onto the
existing `kr-badge-sm` primitive.

Unlike every other kr-*-codemod in this directory, this one does NOT define
a new primitive. `.kr-badge-sm` (interface-vision t-104 slice 146) is
already `badge badge-sm` with the corner radius deliberately left off --
its own comment in tailwind.css explains that `rounded-2xl` rides alongside
it as a separate utility at 15 of its 18 original call sites rather than
being baked into the class, precisely so a different radius can ride
alongside it too. This slice closes the remaining gap: `badge badge-sm
rounded-xl` (the `rounded-xl` counterpart of that same shape) was still
hand-rolled across dreams/gallery/conductor/builder/pages surfaces instead
of using `.kr-badge-sm` -- 9 subset-match occurrences across 9 files.

Dry-run by default, --write to update matching Vue files in place. Only
class strings containing all three base tokens (`badge`, `badge-sm`,
`rounded-xl`) are touched, and only in static `class="..."` attributes --
never `:class`/`v-bind:class` bindings (see _class_attr.py). A source that
already carries `kr-badge-sm`, or is missing any one of the three base
tokens, is left untouched. `rounded-xl` itself and any extra tokens beyond
the base set (shadow, font-semibold, font-black, ...) are preserved
verbatim after the primitive class -- only the literal `badge badge-sm`
pair is replaced -- matching every other kr-*-codemod's subset-match
convention. Pass --exact-only to restrict a slice to sources whose only
extra token is `rounded-xl` itself (no further utility tokens preserved).
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from _class_attr import CLASS_ATTR

PRIMITIVE = "kr-badge-sm"
REPLACED_TOKENS = {"badge", "badge-sm"}
REQUIRED_TOKENS = REPLACED_TOKENS | {"rounded-xl"}


def migrate_classes(classes: str, exact_only: bool) -> str | None:
    tokens = classes.split()
    if PRIMITIVE in tokens or not REQUIRED_TOKENS.issubset(tokens):
        return None
    remaining = [token for token in tokens if token not in REPLACED_TOKENS]
    if exact_only and remaining != ["rounded-xl"]:
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
        help="Only migrate class strings whose only remaining token is "
        "rounded-xl itself (no further utility tokens preserved). Bounds a "
        "slice to the safest, most literal candidates; re-run without this "
        "flag for the fuller subset-match pool in a later slice.",
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
    print(f"{PRIMITIVE} rounded-xl {mode} occurrences: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
