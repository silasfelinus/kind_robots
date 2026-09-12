#!/usr/bin/env python3
"""Find hand-rolled `font-semibold text-sm` text candidates.

Interface Vision t-104 slice 249. A fresh repository survey identified this
pair as the next bounded text-weight family after the established
`kr-text-bold-*` and `kr-text-black-*` primitives. This first slice is
intentionally discovery-only: `kr-text-semibold-sm` does not exist yet, so
this tool refuses `--write` rather than implying a runtime primitive that
has not been opened.

Only static `class="..."` attributes are inspected. Bound `:class` and
`v-bind:class` expressions are outside this mechanical migration family.
Extra utility tokens are preserved in the candidate report; `--exact-only`
restricts discovery to class strings containing only the two base tokens.
"""

from __future__ import annotations

import argparse
from pathlib import Path
from _class_attr import CLASS_ATTR

PRIMITIVE = "kr-text-semibold-sm"
BASE_TOKENS = {"font-semibold", "text-sm"}


def is_candidate(classes: str, exact_only: bool) -> bool:
    tokens = classes.split()
    if PRIMITIVE in tokens or not BASE_TOKENS.issubset(tokens):
        return False
    remaining = [token for token in tokens if token not in BASE_TOKENS]
    return not exact_only or not remaining


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--exact-only", action="store_true")
    parser.add_argument(
        "--write",
        action="store_true",
        help="Reserved for the follow-up slice after kr-text-semibold-sm exists.",
    )
    args = parser.parse_args()

    if args.write:
        parser.error(
            "--write is intentionally disabled until the kr-text-semibold-sm primitive exists"
        )

    total = 0
    for path in sorted(args.root.rglob("*.vue")):
        if any(part in {"node_modules", ".nuxt", ".output"} for part in path.parts):
            continue
        with path.open(encoding="utf-8", newline="") as f:
            text = f.read()
        count = sum(
            1
            for match in CLASS_ATTR.finditer(text)
            if is_candidate(match.group(1), args.exact_only)
        )
        if not count:
            continue
        total += count
        print(f"{path.relative_to(args.root)}: {count}")

    print(f"kr-text-semibold-sm candidate occurrences: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
