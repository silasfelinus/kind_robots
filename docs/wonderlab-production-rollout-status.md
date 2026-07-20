# WonderLab production rollout status

This document is a stable entry point for the live Component registry and first-party personality commentary rollout.

## Authoritative live handoff

Read GitHub issue [#531](https://github.com/silasfelinus/kind_robots/issues/531) for the latest automated production commit, deployment, reconciliation plan, audit checks, and exact resume instructions. The guarded workflow overwrites that issue after every read-only audit or apply attempt.

Related tracking:

- [#381](https://github.com/silasfelinus/kind_robots/issues/381) — WonderLab overhaul and acceptance
- [#472](https://github.com/silasfelinus/kind_robots/issues/472) — first-party personality commentary
- [#473](https://github.com/silasfelinus/kind_robots/issues/473) — canonical Component identity/status rollout

## Reconciliation safety

The production reconciliation:

- always performs a conflict-checking dry run first;
- refuses the apply when any canonical identity conflict exists;
- preserves database-only Components and every Reaction;
- commits canonical updates and new manifest Components atomically;
- uses a non-interactive batch transaction, with one `createMany` for all new rows, so a large manifest is not constrained by Prisma's interactive callback timeout;
- deletes only exact orphaned Cypress Component fixtures with no source identity and no reviews;
- verifies every manifest source key, path, hash, name, folder, slug, and discovered state after apply;
- reruns the read-only personality rollout audit and stores JSON evidence as a GitHub Actions artifact.

## Trigger semantics

- `[wonderlab-audit]` runs the reconciliation dry run and personality audit only.
- `[wonderlab-rollout]` performs the guarded registry apply, exact fixture cleanup, canonical verification, and audit.

Neither trigger generates, approves, or publishes personality review drafts.

## Acceptance after a successful registry apply

1. Generate a small representative draft set, including Dotti and Catbot.
2. Curate, approve, and explicitly publish only useful, grounded, voice-ready drafts.
3. Rerun the rollout audit.
4. Verify `/wonderlab`, `/memory`, and `/screenfx` on desktop and mobile.
5. Confirm human reviews remain intact and first-party reviews have no duplicates, unsafe author rows, or draft/Reaction link mismatches.
