#!/usr/bin/env python3
"""Find or migrate hand-rolled kr-badge-{ghost,warning,outline,primary,secondary}-sm
and kr-badge-{ghost,outline,primary,warning}-xs badges.

Dry-run is the default. Pass --write to update matching Vue files in place.
Only the approved badge shapes are touched (`badge badge-ghost badge-sm`,
`badge badge-warning badge-sm`, `badge badge-outline badge-sm`, `badge
badge-primary badge-sm`, `badge badge-secondary badge-sm`, `badge
badge-ghost badge-xs`, `badge badge-outline badge-xs`, `badge badge-primary
badge-xs`, `badge badge-warning badge-xs`), and only in static
`class="..."` attributes -- never `:class`/`v-bind:class` bindings, and
regardless of the base tokens' order in the source (`badge-ghost badge-sm`
counts the same as `badge-sm badge-ghost`). A source that already carries
the target primitive, or is missing any one of the base tokens, is left
untouched. Extra tokens beyond the base set (ml-auto, shrink-0, rounded-lg,
...) are preserved verbatim after the primitive class, matching the
kr-input-sm/kr-checkbox-* codemods' subset-match convention -- they're plain
Tailwind utilities layered on top, not another component-root class, so
resolution order is unaffected by folding the three base tokens into one
name. This includes a second color modifier (e.g. `badge-outline` alongside
`badge-primary`) preserved as an "extra" token verbatim -- the same latent
behavior the ghost/warning/outline families already had for a stray color
token, not new to this pair.

FAMILIES is ordered most-specific-first on purpose: each entry's base token
set differs in its size (sm/xs) and color modifier (ghost/warning/outline/
primary/secondary), so order among them doesn't matter for correctness here
(no entry's base set is a subset of another's), but a future plain-size
family (e.g. a colorless `kr-badge-sm`) would need to come LAST, since its
smaller base set would be a subset of every colored family's tokens above.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

CLASS_ATTR = re.compile(r'class="([^"]*)"')

FAMILIES = [
    ("kr-badge-ghost-sm", {"badge", "badge-ghost", "badge-sm"}),
    ("kr-badge-warning-sm", {"badge", "badge-warning", "badge-sm"}),
    ("kr-badge-outline-sm", {"badge", "badge-outline", "badge-sm"}),
    ("kr-badge-primary-sm", {"badge", "badge-primary", "badge-sm"}),
    ("kr-badge-secondary-sm", {"badge", "badge-secondary", "badge-sm"}),
    ("kr-badge-ghost-xs", {"badge", "badge-ghost", "badge-xs"}),
    ("kr-badge-outline-xs", {"badge", "badge-outline", "badge-xs"}),
    ("kr-badge-primary-xs", {"badge", "badge-primary", "badge-xs"}),
    ("kr-badge-warning-xs", {"badge", "badge-warning", "badge-xs"}),
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
    print(f"kr-badge-* {mode} occurrences: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
