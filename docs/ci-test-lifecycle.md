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

## Future additions

Prefer placing a cheap, stable regression guard in a required suite only when
it protects behavior that normal edits can break. For performance endurance,
massive simulation counts, one-off migrations, and initial acceptance checks,
prefer an explicit manual Actions workflow. For focused contracts, scope the
workflow to the files it reads (and the workflow itself). Avoid broad,
duplicate standalone `verify` jobs without defining which changes need them.
