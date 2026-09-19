"""The PowerShell parse check must actually cover every .ps1, with 5.1.

Ported from conductor after its 2026-09-19 incident, where three
`Write-Log "$name: ..."` lines were a PARSE error -- PowerShell reads `$name:`
as a scope- or drive-qualified variable, the `$env:PATH` / `$script:foo` syntax
-- and a parse error disables the WHOLE file. A render-box watchdog therefore
did nothing for eleven days: every trigger launched, PowerShell refused the
file, and the log recorded nothing because no line ever ran.

These scripts are in the same position. They run on Windows boxes, by hand or on
a schedule, where a parse error is silent until someone notices the work did not
happen, and no Linux-hosted check can see it.

The PowerShell Syntax Contract workflow closes that, but only while three things
hold, and each is a quiet way for the check to stop checking:

1. It runs on Windows with `shell: powershell` (Windows PowerShell 5.1). `pwsh`
   is PowerShell 7 and accepts syntax 5.1 rejects, so switching would let the
   original bug class through while still reporting green.
2. Its paths filter covers where the .ps1 files actually live. One added
   elsewhere would never trigger the workflow, and nothing would say so.
3. The checker it invokes exists and refuses to pass on an empty file list.
"""
import re
from pathlib import Path

import yaml

REPO = Path(__file__).resolve().parents[2]
WORKFLOW = REPO / ".github" / "workflows" / "powershell-syntax-contract.yml"
CHECKER = REPO / "scripts" / "Test-PowerShellSyntax.ps1"

VALID_QUALIFIERS = {
    "env", "script", "global", "local", "private", "using",
    "variable", "function", "alias", "workflow",
}
QUALIFIED = re.compile(r"\$([A-Za-z_][A-Za-z0-9_]*):")


def _workflow():
    doc = yaml.safe_load(WORKFLOW.read_text(encoding="utf-8"))
    # PyYAML parses the `on:` key as the boolean True.
    return doc, doc.get("on", doc.get(True)), doc["jobs"]["verify"]


def _repo_ps1_files():
    return sorted(
        p.relative_to(REPO).as_posix()
        for p in REPO.rglob("*.ps1")
        if ".git" not in p.parts and "node_modules" not in p.parts
    )


def test_runs_on_windows():
    _, _, job = _workflow()
    assert "windows" in str(job["runs-on"]).lower(), (
        f"a real PowerShell parser needs Windows; runs-on is {job['runs-on']!r}"
    )


def test_parses_with_windows_powershell_51_not_pwsh():
    """pwsh is PowerShell 7; these scripts run under 5.1."""
    _, _, job = _workflow()
    shells = [s.get("shell") for s in job["steps"] if "shell" in s]
    assert "powershell" in shells, (
        f"no step declares shell: powershell; found {shells!r}"
    )
    assert "pwsh" not in shells, (
        "pwsh is PowerShell 7, which accepts syntax 5.1 rejects"
    )


def test_it_invokes_the_checker_that_exists():
    _, _, job = _workflow()
    assert CHECKER.exists(), f"missing checker: {CHECKER}"
    runs = " ".join(s.get("run", "") for s in job["steps"])
    assert "Test-PowerShellSyntax.ps1" in runs, (
        "the workflow no longer invokes the checker"
    )


def test_the_checker_refuses_to_pass_on_an_empty_file_list():
    """Otherwise a moved folder turns the check into a permanent green."""
    text = CHECKER.read_text(encoding="utf-8")
    assert "NO .ps1 FILES FOUND" in text, (
        "the checker no longer fails loudly on an empty file list"
    )
    assert "ParseFile" in text, "the checker no longer calls the parser"


def test_the_paths_filter_covers_every_ps1_in_the_repo():
    """The filter is a cost control; it must not become a coverage hole."""
    _, triggers, _ = _workflow()
    ps1_files = _repo_ps1_files()
    assert ps1_files, "no .ps1 files found in the repo at all"

    prefixes = set()
    for event in ("push", "pull_request"):
        for pattern in triggers[event]["paths"]:
            if pattern.endswith(".ps1"):
                prefixes.add(pattern.split("**")[0])
    assert prefixes, "no .ps1 path patterns in the filter"

    uncovered = [f for f in ps1_files if not any(f.startswith(p) for p in prefixes)]
    assert not uncovered, (
        "these .ps1 files would never trigger the parse check:\n  "
        + "\n  ".join(uncovered)
        + f"\nfilter covers: {sorted(prefixes)}"
    )


def test_no_undelimited_variable_before_a_colon():
    """The original bug, checked directly rather than only via the parser.

    Cheap, runs on every push regardless of the paths filter, and names the
    offending line -- the Windows job is the backstop for everything else.
    """
    offenders = []
    for rel in _repo_ps1_files():
        path = REPO / rel
        for lineno, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if line.lstrip().startswith("#"):
                continue
            for match in QUALIFIED.finditer(line):
                if match.group(1).lower() in VALID_QUALIFIERS:
                    continue
                offenders.append(
                    f"{rel}:{lineno}: {match.group(0)} -- use ${{{match.group(1)}}}: instead"
                )
    assert not offenders, (
        "undelimited $var: parses as a qualified variable and breaks the WHOLE "
        "file:\n" + "\n".join(offenders)
    )
