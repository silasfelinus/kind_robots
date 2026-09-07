#!/usr/bin/env python3
"""
kr_panel_codemod.py — mechanical, byte-exact substitution of the hand-rolled
kr-panel / kr-panel-muted / kr-panel-muted-sm / kr-panel-muted-md /
kr-panel-tint-sm / kr-panel-tint-md / kr-panel-tint-compact / kr-panel-flat /
kr-panel-compact utility sequences for the shared class, in static
`class="..."` attributes inside .vue templates only.

Scope, deliberately narrow (interface-vision/t-115's "if (b)" instruction):
  - Only static `class="..."` attributes (never `:class=`, `v-bind:class=`,
    or any attribute containing Vue interpolation `{{ }}`).
  - Only an EXACT, contiguous, space-separated token match of one of the
    three variant sequences below, tried longest-first so a full kr-panel
    match is never left as kr-panel-flat + stray p-6/shadow-sm tokens.
  - Everything else in the class string (extra spacing utilities, responsive
    prefixes, hover/dark variants, additional classes before or after) is
    left completely untouched -- this is what keeps the substitution
    zero-visual-delta: the replaced tokens compute to the exact same
    declarations the shared class already applies, and nothing else moves.

Deliberately NOT handled (left for manual slices, matching t-115's note):
  - opacity variants (bg-base-100/50 etc.)
  - reordered token sequences (e.g. "border-base-300 border rounded-2xl")
  - anything inside `:class` bindings or <script> template strings

Usage:
    python3 kr_panel_codemod.py --root /path/to/kind_robots [--apply] [--limit N] [glob...]

Without --apply, prints a dry-run report (file, line, before -> after) and a
summary count per variant. With --apply, writes the changes to disk for the
files matched (respecting --limit, applied in sorted-path order, so repeated
runs make deterministic forward progress through the pool).
"""
import argparse
import re
import sys
from pathlib import Path

VARIANTS = [
    # (name, token sequence, longest first)
    ("kr-panel", ["rounded-2xl", "border", "border-base-300", "bg-base-100", "p-6", "shadow-sm"]),
    ("kr-panel-muted", ["rounded-2xl", "border", "border-base-300", "bg-base-200", "p-6"]),
    # t-104 slice 117: the -sm/-md padding variants of kr-panel-muted, for
    # the dense-nested-panel shape found at p-3/p-4 instead of the base p-6.
    # Only the trailing padding token differs between these two and the base
    # kr-panel-muted sequence above, so they're mutually exclusive at any
    # given position -- order between them doesn't matter for correctness.
    ("kr-panel-muted-sm", ["rounded-2xl", "border", "border-base-300", "bg-base-200", "p-3"]),
    ("kr-panel-muted-md", ["rounded-2xl", "border", "border-base-300", "bg-base-200", "p-4"]),
    # t-104 slice 123: the bg-base-200/40 opacity-variant counterparts of
    # kr-panel-muted-sm/-md above. The leading tokens are identical; only the
    # background token differs (bg-base-200 vs bg-base-200/40), so these are
    # tried alongside the solid variants at the same list position -- a given
    # token run matches exactly one of the two, never both.
    ("kr-panel-tint-sm", ["rounded-2xl", "border", "border-base-300", "bg-base-200/40", "p-3"]),
    ("kr-panel-tint-md", ["rounded-2xl", "border", "border-base-300", "bg-base-200/40", "p-4"]),
    # t-104 slice 124: the rounded-xl/p-3 counterpart of kr-panel-tint-sm's
    # shape, at 60% opacity instead of 40% -- distinct radius from the -sm/-md
    # pair above, so it can't collide with either at the same list position.
    ("kr-panel-tint-compact", ["rounded-xl", "border", "border-base-300", "bg-base-200/60", "p-3"]),
    # t-104 slice 125: a second opacity step (50%) of the two shapes above --
    # bg-base-200/50 never collides with bg-base-200/40 or bg-base-200/60 at
    # the same list position since the opacity token itself differs.
    ("kr-panel-tint-sm-50", ["rounded-2xl", "border", "border-base-300", "bg-base-200/50", "p-3"]),
    ("kr-panel-tint-compact-50", ["rounded-xl", "border", "border-base-300", "bg-base-200/50", "p-3"]),
    # t-104 slice 127: the same shape as kr-panel-tint-compact-50 above, but
    # at the asymmetric row padding (px-3 py-2, TWO trailing tokens) used for
    # clickable list rows rather than a uniform p-3. This sequence is one
    # token longer and diverges from kr-panel-tint-compact-50's at the final
    # token (px-3 vs p-3), so an exact-match attempt on either sequence at a
    # given position can only ever succeed for one of them -- no collision.
    ("kr-panel-tint-compact-50-row", ["rounded-xl", "border", "border-base-300", "bg-base-200/50", "px-3", "py-2"]),
    ("kr-panel-flat", ["rounded-2xl", "border", "border-base-300", "bg-base-100"]),
    # t-104 slice 118: the base-100 counterpart to kr-panel-muted-sm, at a
    # smaller rounded-xl radius rather than rounded-2xl -- the leading
    # radius token never overlaps with any other variant above, so list
    # position doesn't matter for correctness here.
    ("kr-panel-compact", ["rounded-xl", "border", "border-base-300", "bg-base-100", "p-3"]),
    # t-104 slice 128: kr-panel-compact's own shape at a tighter p-2 padding
    # step. This sequence's trailing token (p-2) differs from kr-panel-
    # compact's own p-3, so an exact-match attempt at a given position can
    # only ever succeed for one of them -- no collision.
    ("kr-panel-compact-xs", ["rounded-xl", "border", "border-base-300", "bg-base-100", "p-2"]),
    # t-104 slice 125: kr-panel-compact's own shape at 70% background opacity
    # instead of a solid fill -- bg-base-100/70 never collides with the solid
    # bg-base-100 token above.
    ("kr-panel-compact-70", ["rounded-xl", "border", "border-base-300", "bg-base-100/70", "p-3"]),
    # t-104 slice 127: kr-panel-compact-70's own shape at the asymmetric row
    # padding (px-3 py-2) instead of a uniform p-3 -- same reasoning as
    # kr-panel-tint-compact-50-row above; the extra trailing token means this
    # never collides with kr-panel-compact-70's own 5-token sequence.
    ("kr-panel-compact-70-row", ["rounded-xl", "border", "border-base-300", "bg-base-100/70", "px-3", "py-2"]),
    # t-104 slice 126: the dashed-border empty-state placeholder family.
    # `border-dashed` sits between `border` and `border-base-300`, so these
    # sequences never overlap any solid-border variant above at the same
    # position (token 3 differs: `border-dashed` vs `border-base-300`).
    ("kr-panel-dashed", ["rounded-2xl", "border", "border-dashed", "border-base-300", "bg-base-200/50", "p-6"]),
    ("kr-panel-dashed-compact", ["rounded-xl", "border", "border-dashed", "border-base-300", "bg-base-200/50", "p-3"]),
    # t-104 slice 129: .kr-panel-muted's solid bg-base-200 fill at
    # .kr-panel-compact's rounded-xl radius and p-2 padding -- diverges from
    # kr-panel-compact-xs at the background token (bg-base-200 vs
    # bg-base-100) and from kr-panel-tint-compact/-50 at the background
    # token (solid vs opacity), so no collision at this list position.
    ("kr-panel-muted-compact-xs", ["rounded-xl", "border", "border-base-300", "bg-base-200", "p-2"]),
    # t-104 slice 130: .kr-panel-muted's solid bg-base-200 fill at the
    # asymmetric row padding (px-3 py-2) used for plain (non-toggle) list
    # rows -- distinct from .kr-toggle-row-sm, which shares this exact
    # box-model but always bundles `label cursor-pointer justify-between`
    # for a DaisyUI toggle strip; this variant is for rows with no such
    # extras. Six trailing tokens diverge from every p-*/px-*-only sequence
    # above at the padding position, so no collision.
    ("kr-panel-muted-row", ["rounded-2xl", "border", "border-base-300", "bg-base-200", "px-3", "py-2"]),
    # Same shape at .kr-panel-compact's rounded-xl radius instead of
    # rounded-2xl (t-104 slice 130) -- the row-padding counterpart to
    # .kr-panel-muted-compact-xs, same naming relationship as
    # .kr-panel-compact-xs -> .kr-panel-compact-70-row's `-row` suffix.
    ("kr-panel-muted-compact-row", ["rounded-xl", "border", "border-base-300", "bg-base-200", "px-3", "py-2"]),
    # t-104 slice 131: the rounded-3xl/bg-base-100 radius family already named
    # by .kr-panel-section (rounded-3xl/border-base-300/bg-base-100/p-5/
    # shadow-sm), but at .kr-panel-muted-md's p-4 padding step and with no
    # shadow -- a distinct, separately hand-rolled shape (10 occurrences
    # across 6 files), not a drifting duplicate of -section (both p-4 and
    # p-5 rounded-3xl panels appear in the same files, e.g.
    # coloring-book-studio.vue). Five tokens, one shorter than -section's
    # six (no shadow-sm), so an exact-match attempt at a given position can
    # only ever succeed for one of them -- no collision.
    ("kr-panel-section-flat", ["rounded-3xl", "border", "border-base-300", "bg-base-100", "p-4"]),
    # t-104 slice 132: the sticky-footer action-bar shape used at the bottom
    # of full-height chat/narrator panes -- a single top divider (border-t,
    # not the all-sides `border` every kr-panel* variant above uses) plus a
    # solid backing and compact padding, no border-radius at all since this
    # sits flush against its parent pane's own edges rather than floating as
    # a boxed panel. Previously hand-rolled across 5 occurrences in 5 files
    # (bot-chat.vue, workspace-narrator.vue, dream-brainstorm.vue, reward-
    # encounter.vue, scenario-story.vue). Distinct token 1 (`border-t` vs
    # `border`) means this can never collide with any solid-border variant
    # above at the same list position.
    ("kr-panel-footer", ["border-t", "border-base-300", "bg-base-100", "p-3"]),
    # t-104 slice 133: kr-panel-compact's own shape at the asymmetric row
    # padding (px-3 py-2) instead of a uniform p-3 -- the base-100 counterpart
    # to kr-panel-muted-compact-row, same reasoning as kr-panel-compact-70-row
    # above (one token longer than kr-panel-compact's own sequence, diverging
    # at the final token, so no collision).
    ("kr-panel-compact-row", ["rounded-xl", "border", "border-base-300", "bg-base-100", "px-3", "py-2"]),
    # t-104 slice 134: the header-bar counterpart to kr-panel-footer -- a
    # single bottom divider (border-b, not the all-sides `border` every
    # other kr-panel* variant uses) at a wider p-4 padding step, with no
    # background fill. Distinct token 1 (`border-b` vs `border`) means this
    # can never collide with any solid-border variant above, and it's one
    # token shorter than kr-panel-footer's own sequence (no bg-base-100), so
    # it can't collide with that either.
    ("kr-panel-header", ["border-b", "border-base-300", "p-4"]),
    # t-104 slice 135: an inline section divider -- a top border rule with
    # top-only spacing (pt-3, no other padding) used inside a flex-col stack
    # to separate a trailing block from the content above it. `pt-3` as the
    # third token means this can never collide with kr-panel-footer's
    # (`bg-base-100`) or kr-panel-header's (`p-4`) own sequences.
    ("kr-panel-divider", ["border-t", "border-base-300", "pt-3"]),
    # t-104 slice 136: the .kr-panel-footer shape (border-t, uniform p-3) but
    # with no background fill -- used as a flush footer/action bar inside a
    # parent surface that already supplies its own background (same reasoning
    # as .kr-panel-header dropping .kr-panel-footer's bg-base-100). Distinct
    # from .kr-panel-divider's own 3-token sequence at the third token (`p-3`
    # vs `pt-3`), so an exact-match attempt at a given position can only ever
    # succeed for one of them -- no collision.
    ("kr-panel-footer-bare", ["border-t", "border-base-300", "p-3"]),
    # t-104 slice 137: .kr-panel-section's own rounded-3xl/border-base-300/
    # bg-base-100/p-5 shape, but matched WITHOUT its trailing shadow-sm token
    # -- found while enumerating remaining border-base-300 windows for the
    # next slice, .kr-panel-section itself (approved interface-vision/t-123)
    # was never added to this codemod's VARIANTS, so this is the FIRST entry
    # covering that shape family at all. A 5-token sequence, not .kr-panel-
    # section's own 6-token shadow-sm sequence, because real occurrences carry
    # three different trailing shadow states -- none (coloring-book-
    # studio.vue x4), shadow-lg, or shadow-xl (both as a separate SAFE_EXTRA
    # token after this sequence, e.g. aquarium leaderboard/browse pages) --
    # and matching shadow-sm specifically would find none of them. The
    # no-shadow files stay genuinely zero-visual-delta (bare 5-token
    # replacement); the shadow-lg/shadow-xl ones are equally zero-visual-delta
    # by this codemod's own established policy (a bare utility-layer shadow-*
    # token always overrides the components-layer shadow-sm .kr-panel-section
    # applies, per this file's SAFE_EXTRA_RE header comment) -- confirmed by
    # this slice's own dry run, which substituted both cases identically. One
    # token shorter than .kr-panel-section-flat's own 5-token p-4 sequence but
    # diverging at the final token (p-5 vs p-4), so no collision with it.
    ("kr-panel-section-plain", ["rounded-3xl", "border", "border-base-300", "bg-base-100", "p-5"]),
    # t-104 slice 138: a third padding step of the dashed empty-state family
    # (kr-panel-dashed's p-6, kr-panel-dashed-compact's p-3), but with NO
    # background fill at all -- unlike both of those, which carry
    # bg-base-200/50. This is a visually distinct shape (no tint), not just
    # another padding size of the same fill, found across 4 occurrences in 3
    # files (facet-gallery.vue, stylist-relay-status.vue,
    # artjob-queue-browser.vue x2), all "no results yet" placeholder blocks
    # with text-center + muted text-base-content/50 copy. Diverges from
    # kr-panel-dashed's own 6-token sequence at position 5 (p-8 vs
    # bg-base-200/50), so an exact-match attempt at a given position can only
    # ever succeed for one of them -- no collision.
    ("kr-panel-dashed-plain", ["rounded-2xl", "border", "border-dashed", "border-base-300", "p-8"]),
    # t-104 slice 140: the .kr-panel-dashed shape at 40% background opacity
    # instead of 50% -- bg-base-200/40 never collides with kr-panel-dashed's
    # own bg-base-200/50 token at the same list position.
    ("kr-panel-dashed-tint", ["rounded-2xl", "border", "border-dashed", "border-base-300", "bg-base-200/40", "p-6"]),
]

CLASS_ATTR_RE = re.compile(r'(?<![:\w-])class="([^"]*)"')

# kr-panel/-flat/-muted are declared inside tailwind.css's `@layer components`
# (assets/css/tailwind.css), the SAME layer DaisyUI's own component classes
# (.stat, .card, .btn, .collapse, ...) live in. Bare Tailwind utility tokens
# (rounded-2xl, border, bg-base-100, ...) are in the UTILITIES layer, which
# always wins over components regardless of source order -- but a components-
# layer kr-panel* class does NOT get that guarantee against another
# components-layer class on the same element (confirmed against
# interface-vision/t-104 slice 12's kr-stat-tile.vue finding: DaisyUI's
# `.stat` supplies its own background/border, and which one wins then depends
# on stylesheet source order, not HTML class order). So this codemod only
# fires when every OTHER token on the element is a plain Tailwind utility
# (spacing/sizing/layout/typography/shadow/position) or one of our own kr-*
# layout primitives that are documented to carry no bg/border/rounded of
# their own (kr-pane, kr-pane-scroll, kr-surface, kr-stage, kr-unbound,
# kr-container, kr-container-wide, kr-section). Anything else -- most
# importantly any bare DaisyUI component-root class (stat, card, btn,
# collapse, alert, badge, menu, modal-box, tooltip, dropdown, input, select,
# textarea, checkbox, radio, toggle, progress, table, stats, artboard,
# chat-bubble, timeline, steps, kbd, diff, carousel, hero, label, ...) -- is
# left completely alone and reported separately for manual review.
SAFE_EXTRA_RE = re.compile(
    r"^("
    r"(sm|md|lg|xl|2xl|hover|focus|focus-within|focus-visible|active|disabled|group-hover|motion-safe|motion-reduce|dark|first|last|odd|even):.*|"
    r"(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y)-\S+|"
    r"(w|h|min-w|min-h|max-w|max-h|size)-\S+|"
    r"(flex|inline-flex|grid|inline-grid|flex-col|flex-row|flex-wrap|flex-nowrap|flex-1|flex-auto|flex-none|flex-shrink|flex-shrink-0|shrink|shrink-0|flex-grow|flex-grow-0|grow|grow-0)|"
    r"(items|justify|content|self|place)-\S+|"
    r"(grid-cols|grid-rows|col-span|row-span|col-start|col-end)-\S+|"
    r"shadow(-\S+)?|"
    r"(text|font|leading|tracking|whitespace|break)-\S+|"
    r"overflow(-\S+)?|"
    r"(relative|absolute|fixed|sticky|static|isolate)|"
    r"(inset|top|left|right|bottom|z)-\S+|"
    r"(opacity|transition|duration|ease|animate)-\S+|"
    r"transition|"
    r"(cursor)-\S+|"
    r"(mx-auto|my-auto|mt-auto|mb-auto|ml-auto|mr-auto)|"
    r"aspect-\S+|"
    r"group|"
    r"kr-(pane|pane-scroll|surface|stage|unbound|container|container-wide|section|toolbar|scroll)"
    r")$"
)
# 2026-09-07 (t-104 slice 141) addition: `isolate` -- sets only `isolation:
# isolate` (a new stacking context), no background/border-color/radius
# declaration of its own, so it can't affect the cascade question this
# allowlist polices. Unblocks the one occurrence this slice found while
# re-running the codemod's own skip report: pages/play/challenges/[slug].vue's
# `relative isolate overflow-hidden rounded-3xl border border-base-300
# bg-base-100 p-5 shadow-xl sm:p-8` (kr-panel-section-plain, added t-104 slice
# 137; `isolate` was the only unsafe token blocking the match, `sm:p-8` and
# `shadow-xl` were already covered by the responsive-prefix and bare-shadow
# allowlist entries above).
#
# 2026-09-06 (t-104 slice 119) addition: `kr-scroll` -- `@apply min-h-0 flex-1
# overflow-y-auto overscroll-contain` in tailwind.css; pure layout/scroll
# behavior, same verified-empty-of-bg/border/radius category as the other
# listed kr-* primitives. Unblocks the one occurrence this slice's own note
# (t-104 slice 118) flagged as the next candidate:
# components/pages/conductor-project-gallery-page.vue's
# `kr-scroll rounded-xl border border-base-300 bg-base-100 p-3` (kr-panel-compact).
#
# 2026-08-09 (t-104 slice 15) additions, each verified against the compiled
# Tailwind output (`npx @tailwindcss/cli -i assets/css/tailwind.css -o -`)
# to declare NO background-color/border-color/border-radius of its own, so
# none of them can affect the cascade question this allowlist exists to
# police:
#   - bare `group`/`transition` -- Tailwind's own marker/property-only
#     utilities (`.group{}` has no declarations at all; `.transition{}` sets
#     only transition-property/timing/duration).
#   - `aspect-\S+` -- `aspect-ratio` only.
#   - `focus-visible`/`motion-safe`/`motion-reduce` -- variant prefixes with
#     the exact same non-effect as the already-allowlisted `hover`/`focus`.
#   - `kr-toolbar` -- `@apply relative z-20 flex shrink-0 flex-wrap items-center
#     gap-2` in tailwind.css; pure layout, same category as the other listed
#     kr-* primitives.
# Genuine DaisyUI component-root classes (stat, menu, dropdown-content, btn,
# label, collapse, form-control, ...) are deliberately NOT added here even
# where this slice's own empirical check found some of them (e.g. `.menu`,
# `.label`) currently declare no conflicting background/border either --
# policy stays conservative on daisyUI's own component classes since a
# version bump could add one silently. Left for manual per-file review.


def substitute_tokens(class_str):
    """Return (new_str, variant_counts, skipped) after longest-first contiguous
    substitution, but ONLY where every other token in the class list is on
    the safe-extras allowlist above; otherwise the match is skipped and
    reported so a human can judge it (DaisyUI component-class risk)."""
    tokens = [t for t in class_str.split(" ") if t]
    other_tokens = []
    matched_any = False
    i = 0
    n = len(tokens)
    tmp_out = []
    counts = {}
    while i < n:
        matched = False
        for name, seq in VARIANTS:
            L = len(seq)
            if i + L <= n and tokens[i:i + L] == seq:
                tmp_out.append(("VAR", name))
                counts[name] = counts.get(name, 0) + 1
                i += L
                matched = True
                matched_any = True
                break
        if not matched:
            tmp_out.append(("TOK", tokens[i]))
            other_tokens.append(tokens[i])
            i += 1

    if not matched_any:
        return class_str, {}, False

    unsafe = [t for t in other_tokens if not SAFE_EXTRA_RE.match(t)]
    if unsafe:
        return class_str, {}, True  # skipped: unsafe extra tokens present

    out = [val for _kind, val in tmp_out]
    return " ".join(out), counts, False


def process_file(path: Path):
    # newline='' disables universal-newline translation so CRLF files round-
    # trip byte-for-byte on the lines this codemod doesn't touch -- without
    # this, Python silently normalizes every \r\n to \n on write and every
    # line in the file shows as changed, not just the substituted ones.
    with open(path, "r", encoding="utf-8", newline="") as fh:
        text = fh.read()
    # Only touch the <template> block, never <script>. The file's root
    # <template> is always the FIRST opening tag, but its closing tag is not
    # necessarily the first `</template>` in the file: an SFC can nest a
    # named-slot/conditional block like `<template v-if="..." #footer>`
    # that closes with its own `</template>` well before the real end. A
    # single `re.search` for `</template>` finds that inner close instead,
    # silently truncating the scanned region and hiding every candidate
    # after it (interface-vision/t-104 slice 19 / t-116). Use the LAST
    # `</template>` in the file instead, which is always the root's.
    template_match = re.search(r"<template>", text)
    if not template_match:
        return None
    template_end_matches = list(re.finditer(r"</template>", text))
    template_start = template_match.end()
    template_stop = template_end_matches[-1].start() if template_end_matches else len(text)

    changes = []
    skips = []

    def repl(m):
        inner = m.group(1)
        if "{{" in inner:
            return m.group(0)  # never touch interpolated class strings
        new_inner, counts, skipped = substitute_tokens(inner)
        line_no = text.count("\n", 0, m.start()) + 1
        if skipped:
            skips.append((line_no, inner))
            return m.group(0)
        if new_inner != inner:
            changes.append((line_no, inner, new_inner, counts))
            return f'class="{new_inner}"'
        return m.group(0)

    before_template = text[:template_start]
    template_body = text[template_start:template_stop]
    after_template = text[template_stop:]

    new_template_body = CLASS_ATTR_RE.sub(repl, template_body)

    if not changes and not skips:
        return None

    new_text = before_template + new_template_body + after_template
    return new_text, changes, skips


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", required=True)
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--limit", type=int, default=None, help="max files to modify")
    args = ap.parse_args()

    root = Path(args.root)
    files = sorted(root.rglob("*.vue"))
    files = [f for f in files if "node_modules" not in f.parts and ".nuxt" not in f.parts]

    total_files = 0
    total_variant_counts = {}
    modified = 0
    total_skipped = 0
    skipped_files = []

    for f in files:
        result = process_file(f)
        if result is None:
            continue
        new_text, changes, skips = result
        rel = f.relative_to(root)

        if changes:
            total_files += 1
            for _, _, _, counts in changes:
                for k, v in counts.items():
                    total_variant_counts[k] = total_variant_counts.get(k, 0) + v
            print(f"=== {rel} ({len(changes)} substitution(s)) ===")
            for line_no, before, after, counts in changes:
                print(f"  L{line_no}: {before!r}")
                print(f"       -> {after!r}")
            if args.apply and (args.limit is None or modified < args.limit):
                with open(f, "w", encoding="utf-8", newline="") as fh:
                    fh.write(new_text)
                modified += 1

        if skips:
            total_skipped += len(skips)
            skipped_files.append(str(rel))
            print(f"--- SKIPPED (unsafe extra tokens, needs manual review): {rel} ---")
            for line_no, inner in skips:
                print(f"  L{line_no}: {inner!r}")

    print("\n--- summary ---")
    print(f"files with candidate substitutions: {total_files}")
    for k, v in sorted(total_variant_counts.items()):
        print(f"  {k}: {v} occurrence(s)")
    print(f"occurrences skipped for manual review (unsafe extra tokens): {total_skipped} across {len(skipped_files)} file(s)")
    if args.apply:
        print(f"files actually modified (respecting --limit): {modified}")


if __name__ == "__main__":
    main()
