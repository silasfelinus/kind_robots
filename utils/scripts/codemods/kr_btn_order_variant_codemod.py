#!/usr/bin/env python3
"""Migrate hand-rolled `.kr-btn-*` order-variant near-misses to their canonical class.

Every `.kr-btn-*` primitive in assets/css/tailwind.css was originally discovered and
migrated one exact token-order at a time (interface-vision/t-104, slices 42-104+): a
hand-rolled site whose class list is a different *word order* of an already-canonical
set (e.g. `btn btn-sm btn-ghost rounded-xl` vs. the canonical `btn btn-ghost btn-sm
rounded-xl`) was left unmigrated unless a slice happened to add that specific order as
a second variant. This script closes the remaining gap in one bounded, mechanical pass:
for every currently-defined `.kr-btn-*` class, find any `class="..."` attribute whose
token *set* (order-independent) exactly matches that class's required tokens and has
no `kr-*` class yet, and rewrite it to the single canonical class name.

Deliberately exact-set only (no extra/near-miss tokens): every hit this script touches
already carries precisely the tokens a `.kr-btn-*` primitive already owns, nothing more,
so the rewrite can never silently drop or reinterpret an unrelated utility class. Sites
with additional utilities (gap-1.5, mt-3, shrink-0, ...) are a *different* class of
near-miss (a distinct/wider hand-rolled shape) and are intentionally left for a future
slice to name and migrate on its own, exactly as prior slices' own comments describe.

`components/ui/ui-gallery.vue` is excluded: its bare `btn`/`btn btn-primary` etc.
occurrences are the page's own style-guide demo, out of scope by every prior slice's
documented convention (see slice 77's comment in tailwind.css).

Dry-run is the default; pass --write to apply.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
CLASS_ATTR = re.compile(r'class="([^"]*)"')
EXCLUDED_DIR_PARTS = {"node_modules", ".nuxt", "abandonware", "dist"}
EXCLUDED_FILES = {ROOT / "components/ui/ui-gallery.vue"}

KR_CSS_PATTERN = re.compile(
    r"\.(kr-btn[\w-]*)\s*\{\s*@apply\s+([^;]+);", re.MULTILINE
)


def load_mappings() -> dict[frozenset[str], str]:
    """Read assets/css/tailwind.css and build {required-token-set: class-name}.

    Only exact-set matches with no ambiguity are usable: if two class names
    somehow ever shared an identical token set, keeping either would be a
    silent, wrong rewrite, so such a set is dropped from the mapping entirely
    (never guessed at) and reported separately.
    """
    css_text = (ROOT / "assets/css/tailwind.css").read_text(encoding="utf-8")
    by_set: dict[frozenset[str], str] = {}
    ambiguous: set[frozenset[str]] = set()
    for match in KR_CSS_PATTERN.finditer(css_text):
        name = match.group(1)
        tokens = frozenset(match.group(2).split())
        if tokens in by_set and by_set[tokens] != name:
            ambiguous.add(tokens)
            continue
        by_set[tokens] = name
    for tokens in ambiguous:
        by_set.pop(tokens, None)
    return by_set


def rewrite_classes(value: str, by_set: dict[frozenset[str], str]) -> tuple[str, bool]:
    tokens = value.split()
    if any(token.startswith("kr-") for token in tokens):
        return value, False
    if "btn" not in tokens:
        return value, False
    name = by_set.get(frozenset(tokens))
    if name is None:
        return value, False
    return name, True


def candidates(scopes: list[str]) -> list[Path]:
    roots = [ROOT / scope for scope in scopes] if scopes else [ROOT]
    paths: set[Path] = set()
    for root in roots:
        if root.is_file() and root.suffix == ".vue":
            paths.add(root)
            continue
        if root.is_dir():
            paths.update(root.rglob("*.vue"))

    return sorted(
        path
        for path in paths
        if path.is_relative_to(ROOT)
        and path not in EXCLUDED_FILES
        and not EXCLUDED_DIR_PARTS.intersection(path.relative_to(ROOT).parts)
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    parser.add_argument(
        "--path",
        action="append",
        default=[],
        help="Limit the scan to a repo-relative .vue file or directory; repeatable.",
    )
    args = parser.parse_args()

    by_set = load_mappings()
    total = 0
    changed_files = 0
    for path in candidates(args.path):
        # newline="" preserves the file's existing line-ending style verbatim
        # (interface-vision/t-104 CRLF-collapse lesson: Path.read_text()/
        # write_text() always translate newlines and have no `newline=` param
        # before Python 3.13).
        with path.open(encoding="utf-8", newline="") as fh:
            original = fh.read()

        count = 0

        def replace(match: re.Match[str]) -> str:
            nonlocal count
            rewritten, changed = rewrite_classes(match.group(1), by_set)
            if not changed:
                return match.group(0)
            count += 1
            return f'class="{rewritten}"'

        rewritten_text = CLASS_ATTR.sub(replace, original)
        if not count:
            continue
        total += count
        changed_files += 1
        rel = path.relative_to(ROOT)
        print(f"{rel}: {count} occurrence(s)")
        if args.write:
            with path.open("w", encoding="utf-8", newline="") as fh:
                fh.write(rewritten_text)

    mode = "written" if args.write else "found (dry-run, use --write to apply)"
    print(f"\n{total} occurrence(s) across {changed_files} file(s) {mode}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
