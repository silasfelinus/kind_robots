#!/usr/bin/env python3
"""Find or migrate hand-rolled kr-toggle-{warning,primary,success,accent,
secondary,error} (colored DaisyUI toggles, sizeless and -sm/-xs sized)
onto their shared primitives.

Dry-run is the default. Pass --write to update matching Vue files in place.
Only the approved colored toggle shapes are touched (the sizeless base --
`toggle toggle-warning`, `toggle toggle-primary`, `toggle toggle-success`,
`toggle toggle-accent`, `toggle toggle-secondary`, `toggle toggle-error` --
and the -sm/-xs sized siblings, e.g. `toggle toggle-sm toggle-primary`),
and only in static `class="..."` attributes -- never `:class`/
`v-bind:class` bindings, and regardless of the base tokens' order in the
source. A source that already carries the target primitive, or is missing
any base token, is left untouched. Extra tokens beyond the base set
(shrink-0, ml-auto, ...) are preserved verbatim after the primitive class,
matching the kr-badge-ghost/kr-badge-outline subset-match convention --
they're plain Tailwind utilities layered on top, not another
component-root class.

The sizeless families were picked from a fresh full-repo class-frequency
survey (slice 245's kaizen note: "not a re-survey of an already-closed
family") as the largest well-bounded pool left outside every family
already closed (kr-text-*, kr-icon-*, kr-input-*, kr-btn-*, kr-badge-*,
kr-label-row). That slice (t-104 slice 246) deliberately left the
`toggle-sm`/`toggle-xs` sized+colored combinations out of scope; this
module now also covers them (interface-vision/t-134), same as
`.kr-badge-ghost`/`.kr-badge-outline` being opened after their own
`-sm`/`-xs` sized siblings already existed.

FAMILIES lists the sized (more specific) families first, then the
sizeless ones. This matters for correctness, not just readability: the
sizeless base token set (`{toggle, toggle-<color>}`) is a strict subset
of its own sized sibling's (`{toggle, toggle-sm, toggle-<color>}`), so a
sized source would also match the sizeless family if that family were
tried first -- `toggle-sm`/`toggle-xs` would then be captured as an
"extra" token rather than recognized as part of a more specific shape.
Trying every sized family before any sizeless one avoids that regardless
of BOUNDED_EXTRAS contents. Within each specificity tier, families are
ordered by occurrence count, most common first; order among ties doesn't
affect correctness since no two same-tier base sets are subsets of one
another (each carries a distinct color, and/or size, token).
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from _class_attr import CLASS_ATTR

COLORS = ["warning", "primary", "success", "accent", "secondary", "error"]

# (primitive, size, color) ordered by occurrence count observed at t-134
# survey time, most common first. toggle-sm toggle-error had zero observed
# occurrences, so it's intentionally absent -- add it if a future audit
# finds one, following this same naming/ordering convention.
_SIZED_ORDER = [
    ("primary", "sm"),
    ("primary", "xs"),
    ("warning", "sm"),
    ("accent", "xs"),
    ("warning", "xs"),
    ("success", "sm"),
    ("accent", "sm"),
    ("secondary", "xs"),
    ("success", "xs"),
    ("error", "xs"),
    ("secondary", "sm"),
]

SIZED_FAMILIES = [
    (f"kr-toggle-{color}-{size}", {"toggle", f"toggle-{size}", f"toggle-{color}"})
    for color, size in _SIZED_ORDER
]

SIZELESS_FAMILIES = [
    ("kr-toggle-warning", {"toggle", "toggle-warning"}),
    ("kr-toggle-primary", {"toggle", "toggle-primary"}),
    ("kr-toggle-success", {"toggle", "toggle-success"}),
    ("kr-toggle-accent", {"toggle", "toggle-accent"}),
    ("kr-toggle-secondary", {"toggle", "toggle-secondary"}),
    ("kr-toggle-error", {"toggle", "toggle-error"}),
]

FAMILIES = [*SIZED_FAMILIES, *SIZELESS_FAMILIES]

# Bound each family to only the specific extra-token shapes actually
# audited (an exact match, or a plain `shrink-0`), the same way
# kr-badge-ghost's first slice bounded its own extras before a follow-up
# slice individually audited the rest. One sized occurrence
# (newsfeed-preferences.vue's toggle-sm toggle-primary) carries a distinct
# extra-token shape audited for t-134, allowed explicitly below.
BOUNDED_EXTRAS: dict[str, set[frozenset[str]]] = {
    name: {frozenset(), frozenset({"shrink-0"})} for name, _ in FAMILIES
}
BOUNDED_EXTRAS["kr-toggle-primary-sm"].add(
    frozenset(
        {
            "ml-1",
            "focus-visible:outline",
            "focus-visible:outline-2",
            "focus-visible:outline-offset-2",
            "focus-visible:outline-primary",
        }
    )
)


def migrate_classes(classes: str, exact_only: bool) -> str | None:
    tokens = classes.split()
    for primitive, base_tokens in FAMILIES:
        if primitive in tokens or not base_tokens.issubset(tokens):
            continue
        remaining = [token for token in tokens if token not in base_tokens]
        if exact_only and remaining:
            continue
        allowed = BOUNDED_EXTRAS.get(primitive)
        if allowed is not None and frozenset(remaining) not in allowed:
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
        "(no extra utility tokens preserved).",
    )
    args = parser.parse_args()

    total = 0
    for path in sorted(args.root.rglob("*.vue")):
        if any(part in {"node_modules", ".nuxt", ".output"} for part in path.parts):
            continue
        # newline="" preserves the file's original line endings verbatim
        # (see kr_badge_codemod.py for the CRLF regression this guards
        # against).
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
    print(f"kr-toggle-* {mode} occurrences: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
