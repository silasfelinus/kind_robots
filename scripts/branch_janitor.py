#!/usr/bin/env python3
"""Delete merged automation branches and report old unmerged branches."""

from __future__ import annotations

import argparse
import subprocess
from datetime import datetime, timezone

DEFAULT_PREFIXES = ("claude/", "worker/", "agent/")


def git(*args: str) -> str:
    return subprocess.run(["git", *args], capture_output=True, text=True, check=False).stdout.strip()


def remote_branches(prefixes: tuple[str, ...]) -> list[str]:
    branches: list[str] = []
    for ref in git("branch", "-r", "--format=%(refname:short)").splitlines():
        ref = ref.strip()
        if not ref.startswith("origin/") or "->" in ref:
            continue
        name = ref.removeprefix("origin/")
        if name != "main" and any(name.startswith(prefix) for prefix in prefixes):
            branches.append(name)
    return branches


def merged(branch: str) -> bool:
    return subprocess.run(
        ["git", "merge-base", "--is-ancestor", f"origin/{branch}", "origin/main"],
        capture_output=True,
        text=True,
        check=False,
    ).returncode == 0


def patch_equivalent(branch: str) -> bool:
    """Return true when every branch patch already exists on main.

    ``git cherry`` compares patch IDs rather than commit ancestry. This catches
    abandoned branches whose work was replayed onto a fresh branch and merged,
    while still refusing to delete a branch that has any unique patch left.
    """

    result = subprocess.run(
        ["git", "cherry", "origin/main", f"origin/{branch}"],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        return False
    lines = [line.strip() for line in result.stdout.splitlines() if line.strip()]
    return bool(lines) and all(line.startswith("-") for line in lines)


def age_hours(branch: str) -> float:
    timestamp = git("log", "-1", "--format=%ct", f"origin/{branch}")
    if not timestamp:
        return 0.0
    committed = datetime.fromtimestamp(int(timestamp), tz=timezone.utc)
    return (datetime.now(timezone.utc) - committed).total_seconds() / 3600


def all_remote_branches() -> list[str]:
    """Every remote branch short name (no 'origin/'), minus main/HEAD — no prefix filter."""
    branches: list[str] = []
    for ref in git("branch", "-r", "--format=%(refname:short)").splitlines():
        ref = ref.strip()
        if not ref.startswith("origin/") or "->" in ref:
            continue
        name = ref.removeprefix("origin/")
        if name != "main":
            branches.append(name)
    return branches


def delete(branch: str, dry_run: bool) -> bool:
    if dry_run:
        return True
    return subprocess.run(
        ["git", "push", "origin", "--delete", branch],
        capture_output=True,
        text=True,
        check=False,
    ).returncode == 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--stale-hours", type=float, default=12.0)
    parser.add_argument(
        "--force-delete",
        default="",
        help="Comma-separated branch names to delete regardless of merge state "
        "(one-shot removal of branches an operator/session has already verified "
        "superseded — e.g. content confirmed replayed onto main under a different "
        "commit trail, or scratch/diagnostic work the branch's own later commits "
        "describe as retired).",
    )
    args = parser.parse_args()

    git("fetch", "origin", "+refs/heads/*:refs/remotes/origin/*", "--prune")
    deleted: list[str] = []
    stranded: list[str] = []
    active: list[str] = []
    failed: list[str] = []

    force_set = {b.strip() for b in args.force_delete.split(",") if b.strip()}
    branches = remote_branches(DEFAULT_PREFIXES)
    # A forced name is explicit operator/agent intent regardless of naming
    # convention — it must not be silently dropped just because it falls
    # outside DEFAULT_PREFIXES.
    if force_set:
        for b in force_set & set(all_remote_branches()):
            if b not in branches:
                branches.append(b)

    for branch in branches:
        if branch in force_set or merged(branch) or patch_equivalent(branch):
            (deleted if delete(branch, args.dry_run) else failed).append(branch)
        elif age_hours(branch) >= args.stale_hours:
            stranded.append(branch)
        else:
            active.append(branch)

    verb = "Would delete" if args.dry_run else "Deleted"
    print(f"Considered {len(branches)} automation branch(es).")
    print(f"{verb} (merged, patch-equivalent, or forced): {', '.join(deleted) or '(none)'}")
    print(f"Stranded (review only): {', '.join(stranded) or '(none)'}")
    print(f"Active (left alone): {', '.join(active) or '(none)'}")
    if failed:
        print(f"Delete failed: {', '.join(failed)}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
