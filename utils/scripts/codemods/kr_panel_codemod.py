#!/usr/bin/env python3
"""
kr_panel_codemod.py — mechanical, byte-exact substitution of the hand-rolled
kr-panel / kr-panel-muted / kr-panel-flat utility sequences for the shared
class, in static `class="..."` attributes inside .vue templates only.

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
    ("kr-panel-flat", ["rounded-2xl", "border", "border-base-300", "bg-base-100"]),
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
    r"(sm|md|lg|xl|2xl|hover|focus|focus-within|active|disabled|group-hover|dark|first|last|odd|even):.*|"
    r"(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y)-\S+|"
    r"(w|h|min-w|min-h|max-w|max-h|size)-\S+|"
    r"(flex|inline-flex|grid|inline-grid|flex-col|flex-row|flex-wrap|flex-nowrap|flex-1|flex-auto|flex-none|flex-shrink|flex-shrink-0|shrink|shrink-0|flex-grow|flex-grow-0|grow|grow-0)|"
    r"(items|justify|content|self|place)-\S+|"
    r"(grid-cols|grid-rows|col-span|row-span|col-start|col-end)-\S+|"
    r"shadow(-\S+)?|"
    r"(text|font|leading|tracking|whitespace|break)-\S+|"
    r"overflow(-\S+)?|"
    r"(relative|absolute|fixed|sticky|static)|"
    r"(inset|top|left|right|bottom|z)-\S+|"
    r"(opacity|transition|duration|ease|animate)-\S+|"
    r"(cursor)-\S+|"
    r"(mx-auto|my-auto|mt-auto|mb-auto|ml-auto|mr-auto)|"
    r"kr-(pane|pane-scroll|surface|stage|unbound|container|container-wide|section)"
    r")$"
)


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
    # Only touch the <template> block, never <script>.
    template_match = re.search(r"<template>", text)
    if not template_match:
        return None
    template_end = re.search(r"</template>", text)
    template_start = template_match.end()
    template_stop = template_end.start() if template_end else len(text)

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
