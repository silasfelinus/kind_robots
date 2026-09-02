#!/usr/bin/env python3
"""Find or migrate geometry-neutral hand-rolled kr-panel-section surfaces.

Dry-run is the default. Pass --write to update matching Vue files in place.
Only the approved rounded-3xl/base-100/shadow-sm shape is touched, and only
when the source already owns full padding. Variants with different borders,
backgrounds, shadows, or child-owned padding are intentionally ignored.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

CLASS_ATTR = re.compile(r'class="([^"]*)"')
BASE_TOKENS = {
    "rounded-3xl",
    "border",
    "border-base-300",
    "bg-base-100",
    "shadow-sm",
}


def has_base_padding(tokens: list[str]) -> bool:
    return any(token.startswith("p-") and ":" not in token for token in tokens)


def migrate_classes(classes: str) -> str | None:
    tokens = classes.split()
    if (
        "kr-panel-section" in tokens
        or not BASE_TOKENS.issubset(tokens)
        or not has_base_padding(tokens)
    ):
        return None

    remaining = [token for token in tokens if token not in BASE_TOKENS]
    # kr-panel-section owns p-5. Preserve a deliberate base padding override,
    # while removing a redundant p-5 if the hand-rolled surface carried one.
    remaining = [token for token in remaining if token != "p-5"]
    return " ".join(["kr-panel-section", *remaining])


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
        text = path.read_text(encoding="utf-8")
        migrated, count = migrate_text(text)
        if not count:
            continue
        total += count
        print(f"{path.relative_to(args.root)}: {count}")
        if args.write:
            path.write_text(migrated, encoding="utf-8")

    mode = "migrated" if args.write else "candidate"
    print(f"kr-panel-section {mode} occurrences: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
