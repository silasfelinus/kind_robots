#!/usr/bin/env python3
"""Full-repo class-frequency survey for the kr-* consistency umbrella
(interface-vision t-104).

Read-only reporting tool -- makes no code changes. Slice 245's kaizen note
called for "a fresh full-repo class-frequency survey outside all now-closed
families" as the input to picking slice 246's target, rather than
re-surveying an already-closed family. This walks every static
`class="..."` attribute (never `:class`/`v-bind:class` bindings, same
CLASS_ATTR guard every kr-* codemod uses) under components/ and pages/,
counts how often each exact multi-token class-string combination repeats
across distinct files, and excludes any combination that already contains
a `kr-` token (already migrated onto a shared primitive) or a Vue/Nuxt
structural class known not to be a hand-rolled utility combo.

Usage:
    python3 utils/scripts/codemods/kr_class_frequency_survey.py [--min-files N] [--min-tokens N]

Output: candidate exact class-string combos sorted by (distinct file count
desc, total occurrence count desc), each with its file list, for a human
(or the next slice) to pick the next well-bounded family from.
"""

from __future__ import annotations

import argparse
from collections import defaultdict
from pathlib import Path

from _class_attr import CLASS_ATTR

ROOTS = ["components", "pages", "layouts"]

# Tokens that make a class string structural/dynamic-flavored rather than a
# hand-rolled utility combo worth migrating -- skip combos containing these.
SKIP_PREFIXES = ("kr-",)
SKIP_EXACT = {"", }


def iter_vue_files(repo_root: Path):
    for root_name in ROOTS:
        root = repo_root / root_name
        if not root.exists():
            continue
        yield from root.rglob("*.vue")


LAYOUT_PREFIXES = (
    "flex",
    "grid",
    "gap",
    "items-",
    "justify-",
    "content-",
    "self-",
    "wrap",
    "shrink",
    "grow",
    "w-",
    "h-",
    "min-w",
    "min-h",
    "max-w",
    "max-h",
    "p-",
    "px-",
    "py-",
    "pt-",
    "pb-",
    "pl-",
    "pr-",
    "m-",
    "mx-",
    "my-",
    "mt-",
    "mb-",
    "ml-",
    "mr-",
    "space-",
    "order-",
    "col-",
    "row-",
    "hidden",
    "block",
    "inline",
    "absolute",
    "relative",
    "static",
    "sticky",
    "top-",
    "bottom-",
    "left-",
    "right-",
    "inset-",
    "z-",
    "overflow-",
    "sm:",
    "md:",
    "lg:",
    "xl:",
    "2xl:",
)


def is_layout_only(tokens: tuple[str, ...]) -> bool:
    return all(any(t == p or t.startswith(p) for p in LAYOUT_PREFIXES) for t in tokens)


def canonical_key(classes: str, layout_only: bool = False) -> tuple[str, ...] | None:
    tokens = classes.split()
    if len(tokens) < 2:
        return None
    if any(t.startswith(SKIP_PREFIXES) or t in SKIP_EXACT for t in tokens):
        return None
    key = tuple(sorted(tokens))
    if not layout_only and is_layout_only(key):
        return None
    return key


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--min-files", type=int, default=4)
    parser.add_argument("--min-tokens", type=int, default=2)
    parser.add_argument("--top", type=int, default=40)
    parser.add_argument(
        "--layout-only",
        action="store_true",
        help="include pure layout combos (flex/gap/items/etc) instead of excluding them",
    )
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[3]
    combo_files: dict[tuple[str, ...], set[Path]] = defaultdict(set)
    combo_count: dict[tuple[str, ...], int] = defaultdict(int)

    for path in iter_vue_files(repo_root):
        text = path.read_text(encoding="utf-8", errors="ignore")
        for match in CLASS_ATTR.finditer(text):
            key = canonical_key(match.group(1), layout_only=args.layout_only)
            if key is None or len(key) < args.min_tokens:
                continue
            combo_files[key].add(path)
            combo_count[key] += 1

    candidates = [
        (key, len(files), combo_count[key], files)
        for key, files in combo_files.items()
        if len(files) >= args.min_files
    ]
    candidates.sort(key=lambda c: (c[1], c[2]), reverse=True)

    for key, nfiles, ntotal, files in candidates[: args.top]:
        rel_files = sorted(str(f.relative_to(repo_root)) for f in files)
        print(f"{nfiles} files / {ntotal} occurrences :: {' '.join(key)}")
        for f in rel_files[:6]:
            print(f"    {f}")
        if len(rel_files) > 6:
            print(f"    ... and {len(rel_files) - 6} more")


if __name__ == "__main__":
    main()
