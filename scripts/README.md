# scripts/

Repo-root scripts invoked directly by GitHub Actions `run:` steps (bash, Node/mjs,
Python) — build hooks, seeders, one-off maintenance, and small shell helpers extracted
out of workflow files. This is distinct from `utils/scripts/`, which holds this repo's
TypeScript regression tests and migration tooling; a script belongs here when a workflow
step needs to `bash`/`node`/`python3` it directly, not when it's a `vitest`/`tsx`-run test.

## Extracting inline workflow bash into a shared script

A workflow `run:` block that contains real decision logic (not just a couple of
straight-line commands) is a maintenance risk: the only way to verify a change to that
logic is to push a commit and watch CI, and the only way to regression-test it is a
hand-written re-implementation that can silently drift from the real thing.

Extract the logic into a standalone script here when:

- The `run:` step has a non-trivial conditional, loop, or exit-code decision worth
  covering with a regression test.
- You want that test to exercise the **exact** logic the workflow runs, not a
  reimplementation of it.
- The logic is (or can be made) hermetic — no network calls, no dependency on secrets
  or live services — so it can run standalone in a test's temp directory/repo.

Keep the extracted script:

- **Hermetic.** No network I/O. Callers (the workflow step) are responsible for any
  fetching/setup the script needs beforehand (e.g. deepening a shallow git checkout);
  the script itself only operates on state already present.
- **A pure function of its arguments**, invoked the same way from both call sites:
  positional args in, exit code (and/or stdout) out. Avoid reading step-only
  environment variables inside the script — pass them as arguments instead, so the
  test can pass its own values without faking the workflow's env.
- **Documented at the top of the file** with what it does, which workflow step and
  which test invoke it, and why it was extracted (link the roadmap task if there is
  one).

## Wiring it into the workflow and the test

1. The workflow step invokes the script the same way a user would from a shell —
   `bash scripts/your-script.sh "$ARG1" "$ARG2"` — instead of inlining the logic.
2. Add a `verify*.ts` regression test under `utils/scripts/` that calls the script via
   `execFileSync('bash', [scriptPath, ...args], ...)` (or `node`/`python3` for a
   non-bash script) against a hermetic fixture — a temp git repo, temp directory, etc.
   — and asserts on its exit code / stdout for both the accept and reject paths, plus
   any edge cases. The test must invoke the real script file, not a copy of its logic.

## Worked example

`check-deploy-ancestry.sh` / `verifyDeployWaitAncestry.ts` is the reference
implementation of this pattern (kind-robots/t-018, t-023 in conductor's roadmap):

- `scripts/check-deploy-ancestry.sh` — extracted out of `.github/workflows/cypress.yml`'s
  "Wait for deploy to go live" step. Takes `<target_sha> <live_sha>`, exits 0 when
  `live_sha` is a commit this checkout knows about and already contains `target_sha`
  as an ancestor, exits 1 otherwise. No network I/O — the caller is responsible for
  fetching/deepening the checkout first.
- `.github/workflows/cypress.yml` (the "Wait for deploy to go live" step) invokes it
  with `bash scripts/check-deploy-ancestry.sh "$TARGET_SHA" "$live"`.
- `utils/scripts/verifyDeployWaitAncestry.ts` regression-tests it by building a
  hermetic temp git repo with forked branches and running the same script against the
  accept path (superseding commit), the reject path (sibling-branch commit), and the
  unknown-commit edge case.
