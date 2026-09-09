#!/usr/bin/env python3
"""Drop the dead `label-text` token from any class string that already
carries a `kr-*` primitive.

Generalizes `kr_text_bold_xs_label_cleanup_codemod.py` (interface-vision
t-104 slice 171, which fixed this for `kr-text-bold-xs` specifically) after
a fresh grep found the identical leftover-dead-token pattern behind six
more `kr-*` primitives shipped in earlier slices: `kr-text-eyebrow`,
`kr-text-eyebrow-bold`, `kr-text-dim-xs`, `kr-text-dim-xs-55`,
`kr-text-dim-xs-70`, and `kr-text-bold-sm`. Each of those primitives'
codemods used the same subset-match convention (order-independent, extra
tokens preserved) as `kr_text_bold_xs_codemod.py`, so any of them run
against a source that also had `label-text` in its class string carried
that dead token along as an "extra" token rather than recognizing it as
inert markup -- the exact mechanism slice 171 diagnosed and fixed for one
primitive at a time. Rather than write a seventh single-primitive cleanup
script, this one is scoped to the general shape: any class string with
both `label-text` and at least one `kr-`-prefixed token.

`label-text` is confirmed dead under daisyUI 5 -- no `.label-text` CSS rule
exists anywhere in this repo's `assets/` or in daisyui's own dist CSS (see
`kr_label_bold_codemod.py`'s docstring, which established this fact first).
Dropping it wherever a `kr-*` primitive already carries the real styling is
a pure no-op: no CSS rule lost, no `@apply` fallout, no test/lint file.

Deliberately does NOT touch class strings with `label-text` but no `kr-*`
primitive alongside it (e.g. the bare `label-text text-xs` family, 21
occurrences, or `label-text text-xs font-semibold`, 15 occurrences) --
those are real un-migrated hand-rolled patterns, not leftover dead tokens
from an already-shipped primitive, and are left for a future slice's own
survey and (if warranted) new primitive.

Dry-run by default, --write to update matching Vue files in place. Only
static `class="..."` attributes are touched, never `:class`/`v-bind:class`
bindings.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from _class_attr import CLASS_ATTR

DEAD_TOKEN = "label-text"
PRIMITIVE_PREFIX = "kr-"


def migrate_classes(classes: str) -> str | None:
    tokens = classes.split()
    if DEAD_TOKEN not in tokens:
        return None
    if not any(token.startswith(PRIMITIVE_PREFIX) for token in tokens):
        return None
    remaining = [token for token in tokens if token != DEAD_TOKEN]
    return " ".join(remaining)


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
        # newline="" preserves the file's original line endings verbatim --
        # see kr_badge_codemod.py for why this matters (kind_robots
        # add-bot.vue, interface-vision t-104 slice 106).
        with path.open(encoding="utf-8", newline="") as f:
            text = f.read()
        migrated, count = migrate_text(text)
        if not count:
            continue
        total += count
        print(f"{path.relative_to(args.root)}: {count}")
        if args.write:
            with path.open("w", encoding="utf-8", newline="") as f:
                f.write(migrated)

    mode = "migrated" if args.write else "candidate"
    print(f"dead-label-text {mode} occurrences: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
