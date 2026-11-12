"""Focused branch-retirement safety tests. Run: python -m unittest discover -s scripts/tests -p test_branch_janitor.py"""

import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts import branch_janitor as bj


class BranchJanitorRetirementTests(unittest.TestCase):
    def test_only_unmodified_unreviewed_heads_are_retired(self):
        manifest = {"claude/old": "a" * 40, "claude/moved": "b" * 40, "claude/open": "c" * 40}
        current = {"claude/old": "a" * 40, "claude/moved": "d" * 40, "claude/open": "c" * 40}
        eligible, skipped = bj.eligible_retirements(
            manifest, set(current), {"claude/open"}, current.get
        )
        self.assertEqual(eligible, {"claude/old"})
        self.assertEqual(skipped, {"claude/moved": "tip moved", "claude/open": "open PR"})

    def test_api_failure_skips_all_retirements(self):
        eligible, skipped = bj.eligible_retirements(
            {"claude/old": "a" * 40}, {"claude/old"}, None, lambda _: "a" * 40
        )
        self.assertFalse(eligible)
        self.assertEqual(skipped["claude/old"], "open PR lookup unavailable")

    def test_missing_ref_is_not_a_retirement(self):
        eligible, skipped = bj.eligible_retirements(
            {"worker/ghost": "a" * 40}, set(), set(), lambda _: "a" * 40
        )
        self.assertFalse(eligible)
        self.assertFalse(skipped)

    def test_manifest_rejects_default_branch(self):
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / "retirements.json"
            path.write_text(json.dumps({"version": 1, "retirements": {"main": "a" * 40}}))
            with self.assertRaisesRegex(ValueError, "Invalid retirement entry"):
                bj.read_retirements(path)

    def test_deletion_leases_exact_head(self):
        with patch.object(bj, "git", return_value="a" * 40), patch.object(
            bj.subprocess, "run"
        ) as runner:
            runner.return_value.returncode = 0
            self.assertTrue(bj.delete("claude/old", False))
            argv = runner.call_args.args[0]
            self.assertIn(
                "--force-with-lease=refs/heads/claude/old:" + "a" * 40, argv
            )

    def test_dry_run_never_pushes(self):
        with patch.object(bj.subprocess, "run") as runner:
            self.assertTrue(bj.delete("claude/old", True))
            runner.assert_not_called()


if __name__ == "__main__":
    unittest.main()
