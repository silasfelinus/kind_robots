"""Shared `class="..."` attribute regex for the kr-* codemods.

Every kr-* codemod under this directory finds hand-rolled static
`class="..."` attributes to migrate onto a shared `kr-*` primitive. They
must never touch a `:class="..."` or `v-bind:class="..."` dynamic binding --
but a plain `re.compile(r'class="([^"]*)"')` is unanchored against the
attribute name, so it can start matching one character into a `:class="..."`
binding whenever the bound expression happens to contain a literal
`class="`-shaped substring, corrupting the binding instead of leaving it
untouched (interface-vision t-104 slice 180 hit this for real against
components/pages/rebel-button.vue's `:class="`... text-2xl ... font-bold
...`"` binding; caught via manual diff review since vue-tsc/eslint don't
parse `:class` template-literal contents; conductor task interface-vision
t-126 is the hardening pass this module exists for).

Import `CLASS_ATTR` from this module instead of each codemod defining its
own copy, so a future codemod can't reintroduce the gap:

    from _class_attr import CLASS_ATTR
    ...
    CLASS_ATTR.sub(replace, text)

The `(?<!:)` negative lookbehind rejects a match whose `class` is
immediately preceded by `:` (covers both `:class="..."` and
`v-bind:class="..."`, since the latter also ends in `:class="`), while
leaving every legitimate static `class="..."` attribute -- which is always
preceded by whitespace or a quote, never `:` -- unaffected. This is the
same guard already hand-added to kr_text_bold_2xl_codemod.py (slice 180) and
kr_badge_codemod.py (slice 181); kr_panel_codemod.py's own
`(?<![:\\w-])class="([^"]*)"` is a stricter superset of the same protection
and is left as-is rather than folded into this shared module.
"""

from __future__ import annotations

import re

CLASS_ATTR = re.compile(r'(?<!:)class="([^"]*)"')
