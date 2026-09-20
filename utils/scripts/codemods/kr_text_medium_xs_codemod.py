#!/usr/bin/env python3
"""Find or migrate hand-rolled `font-medium text-xs` text.

Interface Vision t-104 bounded consistency tooling. Dry-run by default. The
writer is deliberately fail-closed: --write is allowed only after
`.kr-text-medium-xs` exists in assets/css/tailwind.css, so this helper can be
landed ahead of the primitive without ever producing broken runtime classes.

Only static `class="..."` attributes are considered, never :class/v-bind.
The base tokens may appear in either order. Extra tokens are preserved. Pass
--exact-only to restrict discovery or migration to the literal two-token shape.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from _class_attr import CLASS_ATTR

BASE_TOKENS = {"font-medium", "text-xs"}
PRIMITIVE = "kr-text-medium-xs"
TAILWIND_PATH = Path("assets/css/tailwind.css")


def is_candidate(classes: str, exact_only: bool) -> bool:
    tokens = classes.split()
    if not BASE_TOKENS.issubset(tokens):
        return False
    if exact_only and set(tokens) != BASE_TOKENS:
        return False
    return True


def migrate_classes(classes: str) -> str:
    tokens = classes.split()
    remaining = [token for token in tokens if token not in BASE_TOKENS]
    return " ".join([PRIMITIVE, *remaining])


def primitive_exists(root: Path) -> bool:
    path = root / TAILWIND_PATH
    if not path.exists():
        return False
    return f".{PRIMITIVE}" in path.read_text(encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument(
        "--exact-only",
        action="store_true",
        help="Restrict matches to class strings containing exactly font-medium and text-xs.",
    )
    parser.add_argument(
        "--write",
        action="store_true",
        help=f"Replace matching tokens with {PRIMITIVE}; refuses until the CSS primitive exists.",
    )
    args = parser.parse_args()

    root = args.root.resolve()
    if args.write and not primitive_exists(root):
        parser.error(
            f"--write refused: .{PRIMITIVE} does not exist in {TAILWIND_PATH}; "
            "open the primitive first"
        )

    total = 0
    files = 0
    for path in sorted(root.rglob("*.vue")):
        if any(part in {"node_modules", ".nuxt", ".output"} for part in path.parts):
            continue
        with path.open(encoding="utf-8", newline="") as handle:
            text = handle.read()

        matches = [
            match
            for match in CLASS_ATTR.finditer(text)
            if is_candidate(match.group(1), args.exact_only)
        ]
        if not matches:
            continue

        files += 1
        total += len(matches)
        print(f"{path.relative_to(root)}: {len(matches)}")

        if args.write:
            def replace(match):
                classes = match.group(1)
                if not is_candidate(classes, args.exact_only):
                    return match.group(0)
                return match.group(0).replace(classes, migrate_classes(classes), 1)

            migrated = CLASS_ATTR.sub(replace, text)
            with path.open("w", encoding="utf-8", newline="") as handle:
                handle.write(migrated)

    action = "migrated" if args.write else "candidate"
    print(f"font-medium text-xs {action} occurrences: {total} across {files} files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
