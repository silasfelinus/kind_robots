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
    args = parser.parse_args()

    git("fetch", "origin", "+refs/heads/*:refs/remotes/origin/*", "--prune")
    deleted: list[str] = []
    stranded: list[str] = []
    active: list[str] = []
    failed: list[str] = []

    branches = remote_branches(DEFAULT_PREFIXES)
    for branch in branches:
        if merged(branch) or patch_equivalent(branch):
            (deleted if delete(branch, args.dry_run) else failed).append(branch)
        elif age_hours(branch) >= args.stale_hours:
            stranded.append(branch)
        else:
            active.append(branch)

    verb = "Would delete" if args.dry_run else "Deleted"
    print(f"Considered {len(branches)} automation branch(es).")
    print(f"{verb} (merged or patch-equivalent): {', '.join(deleted) or '(none)'}")
    print(f"Stranded (review only): {', '.join(stranded) or '(none)'}")
    print(f"Active (left alone): {', '.join(active) or '(none)'}")
    if failed:
        print(f"Delete failed: {', '.join(failed)}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
