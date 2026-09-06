#!/usr/bin/env python3
"""Find or migrate hand-rolled kr-input-sm / kr-select-sm form controls.

Dry-run is the default. Pass --write to update matching Vue files in place.
Only the approved small/rounded-xl DaisyUI input and select shapes are
touched (`input input-bordered input-sm rounded-xl` and `select
select-bordered select-sm rounded-xl`), and only in static `class="..."`
attributes -- never `:class`/`v-bind:class` bindings. A source that already
carries the target primitive, or is missing any one of the base tokens, is
left untouched. Extra tokens beyond the base set (w-full, bg-base-200, mt-1,
...) are preserved verbatim after the primitive class, matching the
kr-panel-section codemod's subset-match convention -- they're plain
Tailwind utilities layered on top, not another component-root class, so
resolution order is unaffected by folding the four base tokens into one name.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

CLASS_ATTR = re.compile(r'class="([^"]*)"')

FAMILIES = [
    ("kr-input-sm", {"input", "input-bordered", "input-sm", "rounded-xl"}),
    ("kr-select-sm", {"select", "select-bordered", "select-sm", "rounded-xl"}),
]


def migrate_classes(classes: str, exact_only: bool) -> str | None:
    tokens = classes.split()
    for primitive, base_tokens in FAMILIES:
        if primitive in tokens or not base_tokens.issubset(tokens):
            continue
        remaining = [token for token in tokens if token not in base_tokens]
        if exact_only and remaining:
            continue
        return " ".join([primitive, *remaining])
    return None


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
        # universal-newline translation) -- a handful of source files carry
        # CRLF, and translating those to LF on write would turn a one-line
        # class-attribute change into a whole-file rewrite (kind_robots
        # add-bot.vue, caught while extending this codemod's sibling for
        # interface-vision t-104 slice 106).
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
    print(f"kr-input-sm/kr-select-sm {mode} occurrences: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
