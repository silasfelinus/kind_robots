#!/usr/bin/env python3
"""Find or migrate hand-rolled kr-btn-ghost-{outline,md-outline,2xl-outline,
md-2xl-outline} buttons — one of the four existing ghost-button base shapes
(`.kr-btn-ghost`, `.kr-btn-ghost-md`, `.kr-btn-ghost-2xl`, `.kr-btn-ghost-md-2xl`)
with a trailing `border border-base-300 bg-base-100` outline appended, the
same border+background combo `.kr-panel-flat` gives a container
(interface-vision t-104 slice 147).

Dry-run is the default. Pass --write to update matching Vue files in place.
Only static `class="..."` attributes are touched — never `:class`/
`v-bind:class` bindings — regardless of the base tokens' order in the
source. A source that already carries the target primitive, or is missing
any one of the base tokens, is left untouched. Extra tokens beyond the base
set (shrink-0, btn-square, flex-1, sm:flex-none, ...) are preserved verbatim
after the primitive class, matching the kr-badge-*/kr-toggle-row-*
codemods' subset-match convention — they're plain Tailwind utilities layered
on top, not another component-root class.

FAMILIES is ordered most-specific-first: each entry's base token set differs
only in size (`btn-sm` vs bare) and radius (`rounded-xl` vs `rounded-2xl`),
so no entry's base set is a subset of another's — order among them doesn't
affect correctness, but keeping the four together (rather than interleaved
with unrelated families) mirrors how the badge codemod groups its own
same-shape variants.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from _class_attr import CLASS_ATTR

FAMILIES = [
    (
        "kr-btn-ghost-outline",
        {"btn", "btn-ghost", "btn-sm", "rounded-xl", "border", "border-base-300", "bg-base-100"},
    ),
    (
        "kr-btn-ghost-md-outline",
        {"btn", "btn-ghost", "rounded-xl", "border", "border-base-300", "bg-base-100"},
    ),
    (
        "kr-btn-ghost-2xl-outline",
        {"btn", "btn-ghost", "btn-sm", "rounded-2xl", "border", "border-base-300", "bg-base-100"},
    ),
    (
        "kr-btn-ghost-md-2xl-outline",
        {"btn", "btn-ghost", "rounded-2xl", "border", "border-base-300", "bg-base-100"},
    ),
]


def migrate_classes(classes: str) -> str | None:
    tokens = classes.split()
    for primitive, base_tokens in FAMILIES:
        if primitive in tokens or not base_tokens.issubset(tokens):
            continue
        remaining = [token for token in tokens if token not in base_tokens]
        return " ".join([primitive, *remaining])
    return None


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
        # newline="" preserves the file's original line endings verbatim, same
        # rationale as the badge/toggle-row codemods (interface-vision t-104
        # slice 106).
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
    print(f"kr-btn-ghost-*-outline {mode} occurrences: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
