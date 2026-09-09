"""Regression tests for utils/scripts/codemods/_class_attr.py.

interface-vision t-126: every kr-* codemod under utils/scripts/codemods/
finds hand-rolled static `class="..."` attributes to migrate onto a shared
`kr-*` primitive, and must never touch a `:class="..."`/`v-bind:class="..."`
dynamic binding. A plain `re.compile(r'class="([^"]*)"')` is unanchored
against the attribute name, so it matches starting at the 'c' of ANY
`:class="..."` binding too -- dropping the leading ':' makes the binding
indistinguishable from a real `class="..."` attribute. This is not
hypothetical: interface-vision t-104 slice 180 hit it for real against
components/pages/rebel-button.vue's `:class="`... text-2xl ... font-bold
...`"` binding, stripping its enclosing template-literal structure.

These tests are the direct regression check the task's own note asks for:
confirm the shared `CLASS_ATTR` guard rejects a `:class="..."` binding while
still matching every real static `class="..."` attribute shape the kr-*
codemods rely on (bare, multi-token, empty, and adjacent-on-the-same-line).
"""

import importlib.util
import os

_MODULE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "utils", "scripts", "codemods", "_class_attr.py",
)
_spec = importlib.util.spec_from_file_location("_class_attr", _MODULE_PATH)
_class_attr = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_class_attr)

CLASS_ATTR = _class_attr.CLASS_ATTR


def test_rejects_class_binding() -> None:
    # The real incident shape: a template-literal :class binding. No nested
    # literal `class="` substring is needed to trigger the old bug -- the
    # binding itself IS the false-positive shape once its leading ':' is
    # ignored by an unanchored regex.
    fixture = '<div :class="`text-2xl font-bold ${maybe}`">'
    assert list(CLASS_ATTR.finditer(fixture)) == []


def test_rejects_v_bind_class_binding() -> None:
    fixture = "<div v-bind:class=\"['text-2xl', isBold && 'font-bold']\">"
    assert list(CLASS_ATTR.finditer(fixture)) == []


def test_matches_real_static_class_attribute() -> None:
    fixture = '<span class="font-bold text-2xl">hi</span>'
    matches = list(CLASS_ATTR.finditer(fixture))
    assert len(matches) == 1
    assert matches[0].group(1) == "font-bold text-2xl"


def test_matches_empty_class_attribute() -> None:
    fixture = '<span class="">hi</span>'
    matches = list(CLASS_ATTR.finditer(fixture))
    assert len(matches) == 1
    assert matches[0].group(1) == ""


def test_static_class_still_matches_immediately_after_a_dynamic_binding() -> None:
    # A static class="..." attribute on the same tag as a :class binding
    # (a common real shape: :class for conditional extras, class for the
    # base primitive) must still be found -- the guard is per-match, not a
    # whole-tag bailout.
    fixture = '<div :class="`extra ${x}`" class="font-bold text-2xl">'
    matches = list(CLASS_ATTR.finditer(fixture))
    assert len(matches) == 1
    assert matches[0].group(1) == "font-bold text-2xl"


def test_old_unguarded_pattern_would_have_matched_the_binding() -> None:
    # Proves the fixture above is a real regression check, not vacuously
    # true: the pre-fix pattern (no negative lookbehind) DOES match it.
    import re

    old_pattern = re.compile(r'class="([^"]*)"')
    fixture = '<div :class="`text-2xl font-bold ${maybe}`">'
    matches = list(old_pattern.finditer(fixture))
    assert len(matches) == 1
    assert matches[0].group(1) == "`text-2xl font-bold ${maybe}`"
