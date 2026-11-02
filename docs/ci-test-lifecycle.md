# CI test lifecycle: regression gates vs. acceptance proofs

Not every successful verification belongs on every subsequent commit. Keep test
commands and source fixtures available for investigation without automatically
paying for large, historical proof-of-acceptance simulations.

## Always-required regression gates

- TypeScript checks and the `Contract verifiers` aggregate remain required.
- The existing contract suite still runs ordinary game physics, collision,
  no-stuck-ball, control, UI, content, and cross-cutting regression contracts.
- The broad project-architecture `verify` check remains available on every
  pull request; no required branch-protection status is path-filtered away.

## Accepted, expensive game soaks

`.github/workflows/game-soak-acceptance.yml` is **manual-only**. Select
**Actions > Game Acceptance Soaks (Manual) > Run workflow** after a major game
engine or physics rewrite, or when reproducing a specific failure.

- `npm run test:arcade-engine`: the original broad 29-script Arcade acceptance
  suite. Its source tests remain in the repository, but it is not run for every
  unrelated PR.
- `npm run test:zuzu-pinball-croc`: the thousand-swallow River Croc simulation
  (not a visual-animation rendering test).
- `npm run test:zuzu-pinball-stress`: a full six-ball endurance simulation.

These were removed from `contract-tests.yml` without deleting their commands,
fixtures, or executable test implementations. Do not treat passing an
acceptance soak once as permanent proof of correctness after a future engine
rewrite; run the manual workflow again when the behavior being proven changes.

## Feature-scoped regressions

Small standalone Storybook, narrative, and Taskmaster verifiers are tied to
their real inputs with `pull_request.paths` and retain `workflow_dispatch`.
They do not rerun on a merge to main or on unrelated CI/documentation changes.
The larger Facet Catalog audit remains a regression check for application and
schema changes, not every workflow-only change.

Global checks with repo-wide authority (for example deleted-guard references,
retired-hosting references, and layout baseline enforcement) still run on all
PRs. Their redundant `push` invocation was removed.

## Runner budget (2026-11-02 essentialization)

The cost of a workflow is mostly not its checks: every workflow that fires on a
PR push gets a fresh runner, a checkout and usually an `npm ci` (~60-90s)
before doing any work, and all of them share one concurrent-runner pool with
the crons and production lanes. On 2026-11-02 a single five-push PR queued
~85 workflow runs, and ten per-PR workflows did ~40s of real checking between
them. The pass that day:

- **Folded into `contract-tests.yml` shards** (same checks, no extra runner):
  API client follow-ups, generated Prisma client parity, retired provider
  references, verifier filename / deleted-guard references, MDC scroll
  ownership, lazy model-card boundary, art prompt repair + icon audit, the
  comment migration contracts, and the whole Facet catalog contract. Prefer a
  shard step over a new workflow for anything DB-free that finishes in seconds.
- **Prettier ratchet moved from shard 2 to shard 3.** Shard 2 ran both ~100s
  ratchets back to back and was the long pole of every Contract verifiers run.
- **Cancel superseded runs.** Every `pull_request` workflow declares
  `concurrency` keyed by PR number with `cancel-in-progress: true`; push and
  dispatch runs key on `run_id`, so they never cancel each other.
- **No push-to-main reruns of pure PR contracts** (arcade viewport, every
  villain tactics, memory world browser, playbook kit, playbook slices, save
  plumber, project architecture). `contract-tests.yml` and `typecheck.yml` keep
  their push run as the post-merge signal for merge skew, since main is what
  gets tested by hand.
- **Schedules are daily or rarer** unless listed with a reason in
  `FREQUENT_SCHEDULES` (health monitor, branch janitor). Responsive Layout
  Audit went from hourly (~45 runner-minutes a run) to daily; the Emperor
  dispatch contract lost its daily cron (it is deterministic code, already
  gated on PRs).
- **Finished one-shot lanes retired** (restore from git history to re-run):
  comment backfill live + plan export (their branch is gone), population /
  nexus comments live, connection assignments live, dream locations live (all
  completed 2026-08-13), Krea semantic art repair and entity art slot cleanup
  (2026-09-05/06), sync Monster games tags (2026-09-30).
- **`CYPRESS_INSTALL_BINARY: '0'`** wherever `npm ci` runs but Cypress does not.

`npm run test:workflow-budget` (in contract shard 3) enforces the concurrency
and schedule rules. `npm run audit:workflow-budget` prints the advisory report.

## Weekly essentialization routine

Once a week (Conductor schedules it), run `npm run audit:workflow-budget` and
act on each advisory:

1. **one-shot?** Check the workflow's last run (Actions tab or GitHub MCP
   `list_workflow_runs`). If its job is done, or its trigger branch is gone,
   delete it and note the retirement in the PR. If it is a deliberate keeper,
   add it to `REVIEWED_KEEP` in `utils/scripts/auditWorkflowBudget.mjs` with a
   reason.
2. **fold?** A PR workflow whose paths cover whole top-level directories runs
   on nearly every PR. Time its steps locally; if they are DB-free and take
   seconds, move them into the lightest contract shard and delete the file
   (grep for scripts that read the workflow path and repoint them).
3. **duplicate?** A pure contract workflow rerunning on push to main: drop the
   `push` trigger unless it publishes or writes something.
4. **cypress?** Add `CYPRESS_INSTALL_BINARY: '0'` to the workflow `env`.
5. Re-check the shard balance from the latest main Contract Tests run and move
   a slow step if one shard is more than ~60s longer than the others.

Do not fold or delete a workflow whose job name might be a required status
check (`TypeScript`, `Contract verifiers`, `Schema Migration Parity`, `verify`)
without confirming on the PR that `mergeable_state` is not `blocked`.

## Future additions

Prefer placing a cheap, stable regression guard in a required suite only when
it protects behavior that normal edits can break. For performance endurance,
massive simulation counts, one-off migrations, and initial acceptance checks,
prefer an explicit manual Actions workflow. For focused contracts, scope the
workflow to the files it reads (and the workflow itself). Avoid broad,
duplicate standalone `verify` jobs without defining which changes need them.
