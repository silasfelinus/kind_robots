"""Parity + behaviour tests for scan_loras.py's LoRA category classifier.

The classifier exists twice on purpose: `utils/loraCategory.ts` is what the
app reads, and `scripts/lora-catalog/scan_loras.py` is the only place the
Civitai model tags are ever in hand -- they are not stored on the Resource, so
an import that does not classify while it has them leaves every later pass with
nothing but filename heuristics.

Two copies of a vocabulary drift. These tests fail when they do, by reading the
tables out of both files and comparing them, so the duplication stays honest
rather than becoming two classifiers that disagree about what a style is.
"""

import importlib.util
import os
import re
import sys

_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_SCAN_PATH = os.path.join(_ROOT, "scripts", "lora-catalog", "scan_loras.py")
_TS_PATH = os.path.join(_ROOT, "utils", "loraCategory.ts")

_spec = importlib.util.spec_from_file_location("scan_loras", _SCAN_PATH)
scan_loras = importlib.util.module_from_spec(_spec)
# Registered before exec: @dataclass resolves its own annotations through
# sys.modules, and a module loaded by path alone is not there yet.
sys.modules["scan_loras"] = scan_loras
_spec.loader.exec_module(scan_loras)


def entry(**fields):
    row = scan_loras.LoraEntry()
    for key, value in fields.items():
        setattr(row, key, value)
    return row


def test_civitai_tag_wins_over_filename():
    row = entry(name="gothic_outfit_v2.safetensors", civitai_tags=["poses"])
    assert scan_loras.classify_category(row) == ("ACTION", "CIVITAI")


def test_filename_heuristic_when_no_tags():
    row = entry(name="victorian_outfit_v3.safetensors")
    assert scan_loras.classify_category(row) == ("CLOTHING", "HEURISTIC")


def test_style_is_checked_before_character():
    row = entry(customLabel="Kim Jung Gi style")
    assert scan_loras.classify_category(row)[0] == "STYLE"


def test_word_boundaries_not_substrings():
    assert scan_loras.classify_category(entry(name="freestyle_rap.safetensors")) == ("", "")
    assert scan_loras.classify_category(entry(name="trait_pack.safetensors")) == ("", "")


def test_underscores_read_as_word_separators():
    row = entry(name="my_cool_pixel_art_thing.safetensors")
    assert scan_loras.classify_category(row)[0] == "STYLE"


def test_nothing_to_go_on_stays_unclassified():
    assert scan_loras.classify_category(entry()) == ("", "")
    assert scan_loras.classify_category(entry(name="xyzzy_v4.safetensors")) == ("", "")


def _typescript_table(name):
    """Read one of loraCategory.ts's tables back as {category: [values]}.

    Scanned rather than regex-matched. Two things defeat a regex here: prettier
    reflows these tables between one-line and one-value-per-line depending on
    length, and several patterns contain a literal `]` of their own
    (`add[_ -]?detail`), which ends a non-greedy bracket match in the middle of
    a string. So the scanner tracks whether it is inside a quote before it
    believes any bracket.
    """
    source = open(_TS_PATH, encoding="utf-8").read()
    start = source.index(f"const {name}:")

    table = {}
    category = None
    values = []
    depth = 0
    # From the `= [` that opens the VALUE, not the first bracket after the
    # name -- the type annotation `Array<[LoraCategory, string[]]>` sits in
    # between and its brackets would close the scan before it started.
    index = source.index("= [", start) + 2

    while index < len(source):
        char = source[index]

        if char == "'":
            literal = ""
            index += 1
            while source[index] != "'":
                if source[index] == "\\":
                    index += 1
                literal += source[index]
                index += 1
            if category is None:
                category = literal
            else:
                values.append(literal)
        elif char == "[":
            depth += 1
        elif char == "]":
            depth -= 1
            if depth == 1 and category is not None:
                table[category] = values
                category, values = None, []
            if depth == 0:
                break
        index += 1

    return table


def test_civitai_tag_table_matches_typescript():
    python_table = {
        category: list(values)
        for category, values in scan_loras.CIVITAI_TAG_CATEGORIES
    }
    assert python_table == _typescript_table("CIVITAI_TAG_CATEGORIES")


def test_heuristic_table_matches_typescript():
    python_table = {
        category: list(values)
        for category, values in scan_loras.HEURISTIC_CATEGORIES
    }
    assert python_table == _typescript_table("HEURISTIC_CATEGORIES")
