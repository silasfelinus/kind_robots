#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
CLASS_ATTR = re.compile(r'class="([^"]*)"')
REQUIRED = {"btn", "btn-xs", "rounded-xl"}
EXCLUDED_PARTS = {"node_modules", ".nuxt", "abandonware"}


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
        and not EXCLUDED_PARTS.intersection(path.relative_to(ROOT).parts)
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument(
        "--path",
        action="append",
        default=[],
        help="Limit the scan to a repo-relative .vue file or directory; repeatable.",
    )
    args = parser.parse_args()

    total = 0
    changed_files = 0
    for path in candidates(args.path):
        # newline="" disables universal-newline translation on read AND write,
        # so a CRLF source file round-trips as CRLF instead of silently
        # collapsing to LF on every line -- not just the lines this codemod
        # actually touches. Path.read_text()/write_text() always translate
        # newlines and have no `newline=` param before Python 3.13, so this
        # opens the file directly instead.
        with path.open(encoding="utf-8", newline="") as fh:
            original = fh.read()
        rewritten, count = rewrite_text(original)
        if not count:
            continue
        total += count
        changed_files += 1
        print(f"{path.relative_to(ROOT)}: {count}")
        if args.apply:
            with path.open("w", encoding="utf-8", newline="") as fh:
                fh.write(rewritten)

    mode = "applied" if args.apply else "would replace"
    print(f"{mode} {total} occurrence(s) across {changed_files} file(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
