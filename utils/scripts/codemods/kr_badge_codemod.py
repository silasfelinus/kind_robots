#!/usr/bin/env python3
"""Find or migrate hand-rolled kr-badge-{ghost,warning,outline,primary,secondary}-sm,
kr-badge-{ghost,outline,primary,warning,success,error,secondary,accent,info,neutral}-xs,
kr-badge-sm (the colorless base), kr-badge-xs (the colorless -xs sibling), and
kr-badge-ghost (the sizeless ghost sibling) badges.

Dry-run is the default. Pass --write to update matching Vue files in place.
Only the approved badge shapes are touched (`badge badge-ghost badge-sm`,
`badge badge-warning badge-sm`, `badge badge-outline badge-sm`, `badge
badge-primary badge-sm`, `badge badge-secondary badge-sm`, `badge
badge-ghost badge-xs`, `badge badge-outline badge-xs`, `badge badge-primary
badge-xs`, `badge badge-warning badge-xs`, `badge badge-success badge-xs`,
`badge badge-error badge-xs`, `badge badge-secondary badge-xs`, `badge
badge-accent badge-xs`, `badge badge-info badge-xs`, `badge badge-neutral
badge-xs`, `badge badge-sm` and `badge badge-xs` with no color modifier at
all -- the dynamically-toned shapes whose color comes from a sibling
`:class` binding), and only in static
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
token, not new to this pair. The colorless `kr-badge-sm` family and
`kr-badge-ghost` are the two exceptions to unrestricted extras: see
BOUNDED_EXTRAS below. `kr-badge-xs` (interface-vision t-104 slice 177) is
colorless too but is NOT bounded -- its 25 occurrences across 13 files were
individually audited for that slice, unlike `kr-badge-sm`'s broader,
only-partially-audited 91-hit pool.

FAMILIES is ordered most-specific-first on purpose: each entry's base token
set differs in its size (sm/xs) and color modifier (ghost/warning/outline/
primary/secondary), so order among them doesn't matter for correctness here
(no entry's base set is a subset of another's), but the two plain-size
families, `kr-badge-sm` and `kr-badge-xs`, come LAST, since their smaller
{badge, badge-sm}/{badge, badge-xs} base sets are each a subset of every
same-size colored family's tokens above them.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from _class_attr import CLASS_ATTR

FAMILIES = [
    ("kr-badge-ghost-sm", {"badge", "badge-ghost", "badge-sm"}),
    ("kr-badge-warning-sm", {"badge", "badge-warning", "badge-sm"}),
    ("kr-badge-outline-sm", {"badge", "badge-outline", "badge-sm"}),
    ("kr-badge-primary-sm", {"badge", "badge-primary", "badge-sm"}),
    ("kr-badge-secondary-sm", {"badge", "badge-secondary", "badge-sm"}),
    ("kr-badge-ghost-xs", {"badge", "badge-ghost", "badge-xs"}),
    # Sizeless sibling of kr-badge-ghost-sm/kr-badge-ghost-xs (interface-vision
    # t-104 slice 181): its {badge, badge-ghost} base is a strict subset of
    # both of those, so it must come after them. Bounded to the specific
    # audited extra-token shapes in BOUNDED_EXTRAS below (slice 181 exact
    # match only; slice 182 added four more individually-audited shapes) --
    # a handful of remaining one-off extra-token combinations are still left
    # unmigrated by design.
    ("kr-badge-ghost", {"badge", "badge-ghost"}),
    ("kr-badge-outline-xs", {"badge", "badge-outline", "badge-xs"}),
    ("kr-badge-primary-xs", {"badge", "badge-primary", "badge-xs"}),
    ("kr-badge-warning-xs", {"badge", "badge-warning", "badge-xs"}),
    ("kr-badge-success-xs", {"badge", "badge-success", "badge-xs"}),
    ("kr-badge-error-xs", {"badge", "badge-error", "badge-xs"}),
    ("kr-badge-secondary-xs", {"badge", "badge-secondary", "badge-xs"}),
    ("kr-badge-accent-xs", {"badge", "badge-accent", "badge-xs"}),
    ("kr-badge-info-xs", {"badge", "badge-info", "badge-xs"}),
    ("kr-badge-neutral-xs", {"badge", "badge-neutral", "badge-xs"}),
    # Colorless base, added last per the module docstring: its {badge,
    # badge-sm} token set is a strict subset of every colored -sm family
    # above, so it must be tried only after all of them have had a chance
    # to match (interface-vision t-104 slice 146). Covers the
    # dynamically-toned badge shape -- a static `badge badge-sm` (usually
    # paired with `rounded-2xl` as a preserved "extra" token, matching how
    # `kr-badge-outline-sm rounded-2xl` etc. already read elsewhere) plus a
    # per-instance `:class` binding supplying the color.
    ("kr-badge-sm", {"badge", "badge-sm"}),
    # Colorless -xs sibling of kr-badge-sm (interface-vision t-104 slice
    # 177), same subset-order reasoning: its {badge, badge-xs} base is a
    # strict subset of every colored -xs family above, so it must come
    # after all of them too.
    ("kr-badge-xs", {"badge", "badge-xs"}),
]

# kr-badge-sm's base token set ({badge, badge-sm}) is small enough to appear
# inside many unrelated hand-rolled combinations (91 subset-match hits across
# the repo, most never audited for slice 146). Rather than fold every one of
# those into this slice, cap it to the two shapes actually surveyed: bare, or
# with `rounded-2xl` as the sole extra (the dynamically-toned pill badge --
# color supplied by a sibling `:class` binding -- verified in every one of
# its 15 call sites). Families not listed here keep the unrestricted
# subset-match behavior they already had.
#
# kr-badge-ghost's {badge, badge-ghost} base is similarly small and appeared
# (slice 181) inside a further ~13 hand-rolled combinations carrying varied
# extra tokens. Slice 182 individually audited all of them: four clean,
# repeated shapes are added here --
#   rounded-2xl            components/coloring/coloring-book-production-history.vue
#                           (4 identical call sites)
#   rounded-lg font-black  pages/play/challenges/leaderboard.vue +
#                           pages/play/challenges/[slug].vue (same badge shape
#                           reused across the two challenge-list pages)
#   rounded-lg             pages/play/challenges/[slug].vue (a second,
#                           plainer badge on the same page)
#   rounded-xl             components/pages/storybook-library-page.vue
# -- the remaining ~6 (daily-digest-browser.vue, daily-dream-object-art-
# workbench.vue, facet-gallery.vue, coloring-book-manager.vue's hover/cursor
# clickable badge, academy-style-detail.vue, privacy-page.vue's <code> badge)
# each carry a one-off extra-token combination not shared by any other call
# site and are left hand-rolled rather than forced into a shared primitive.
BOUNDED_EXTRAS: dict[str, set[frozenset[str]]] = {
    "kr-badge-sm": {frozenset(), frozenset({"rounded-2xl"})},
    "kr-badge-ghost": {
        frozenset(),
        frozenset({"rounded-2xl"}),
        frozenset({"rounded-lg", "font-black"}),
        frozenset({"rounded-lg"}),
        frozenset({"rounded-xl"}),
    },
}


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
