#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
CLASS_ATTR = re.compile(r'class="([^"]*)"')
REQUIRED = {"btn", "btn-xs", "rounded-xl"}


def rewrite_classes(value: str) -> tuple[str, bool]:
    tokens = value.split()
    if not REQUIRED.issubset(tokens) or "kr-btn-xs" in tokens:
        return value, False

    remaining = [token for token in tokens if token not in REQUIRED]
    return " ".join(["kr-btn-xs", *remaining]), True


def rewrite_text(text: str) -> tuple[str, int]:
    count = 0

    def replace(match: re.Match[str]) -> str:
        nonlocal count
        rewritten, changed = rewrite_classes(match.group(1))
        if not changed:
            return match.group(0)
        count += 1
        return f'class="{rewritten}"'

    return CLASS_ATTR.sub(replace, text), count


def candidates() -> list[Path]:
    return sorted(
        path
        for path in ROOT.rglob("*.vue")
        if "node_modules" not in path.parts and ".nuxt" not in path.parts
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    total = 0
    changed_files = 0
    for path in candidates():
        original = path.read_text(encoding="utf-8")
        rewritten, count = rewrite_text(original)
        if not count:
            continue
        total += count
        changed_files += 1
        print(f"{path.relative_to(ROOT)}: {count}")
        if args.apply:
            path.write_text(rewritten, encoding="utf-8")

    mode = "applied" if args.apply else "would replace"
    print(f"{mode} {total} occurrence(s) across {changed_files} file(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
