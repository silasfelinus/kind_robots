#!/usr/bin/env python3
"""Find or migrate the `size-5 text-primary` Tailwind shorthand to
`kr-icon-primary-5`.

`size-5` is a plain alias for `h-5 w-5` (Tailwind's `size-*` utility sets
both axes at once) -- CSS-identical to the tinted bare icon-glyph shape
`kr_icon_primary_5_codemod.py` already migrated repo-wide from its `h-5
w-5 text-primary` spelling. `size-5 text-primary` is a separate source
spelling of the exact same primitive, not a new shape: `.kr-icon-primary-5`
in tailwind.css covers both verbatim. Same convention as
`kr_icon_5_size_shorthand_codemod.py` (the untinted sibling), just for the
`text-primary`-tinted family -- flagged as the next candidate by slice
250's kaizen note and confirmed still open by a fresh full-repo
class-frequency survey (kr_class_frequency_survey.py, 9 files / 11
occurrences, the largest well-bounded pool outside every closed family).

Dry-run by default, --write to update matching Vue files in place. Only
static `class="..."` attributes are touched, never `:class`/`v-bind:class`
bindings (see _class_attr.py). Pass --exact-only to restrict a slice to
sources with no extra tokens beyond the base pair.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from _class_attr import CLASS_ATTR

PRIMITIVE = "kr-icon-primary-5"
BASE_TOKENS = {"size-5", "text-primary"}


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
        help="Only migrate class strings that are exactly `size-5 "
        "text-primary` (no extra utility tokens preserved).",
    )
    args = parser.parse_args()

    total = 0
    for path in sorted(args.root.rglob("*.vue")):
        if any(part in {"node_modules", ".nuxt", ".output"} for part in path.parts):
            continue
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
    print(f"kr-icon-primary-5 (size-5 text-primary shorthand) {mode} occurrences: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
