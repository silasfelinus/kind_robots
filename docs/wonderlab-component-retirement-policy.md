# WonderLab component retirement policy

A museum review is a record of what the site **has been**, not a claim about what it currently
ships. Reviews are therefore never a reason to keep a component file alive.

Silas, 2026-08-03, verbatim:

> "kill them, and just keep the components … the museum reviews are actually literally reviews of
> what the site has been, not where it is … it's not so we have a reason to cling to outdated
> components."

This document exists because that question came up as a blocker — two dead components were left in
the tree on the theory that deleting them would orphan four published reviews. **It would not.** The
machinery below already handles retirement end to end, and nothing needs to be built.

## Deleting a reviewed component is safe

The museum record is anchored to the database, not the filesystem. Delete the `.vue` file and:

| Thing | What happens |
|---|---|
| `Component` row | **Survives.** Reconcile never deletes rows. |
| Its `Reaction`s (the reviews) | **Survive**, still attached to the same `Component`. |
| `isDiscovered` | Flips to `false` on the next reconcile run. |
| `lastSeenAt` | Stops being refreshed, so it dates the disappearance. |
| `sourceKey` / `sourcePath` | Retained on the row, so historical batch configs still resolve. |

The mechanism is `server/utils/wonderlabComponentReconcile.ts:359-366`: every existing component
not matched by the current scan, and still marked discovered, gets an `isDiscovered: false` update.
There is no delete branch. `utils/scripts/verifyComponentCanonicalRuntime.ts:138` asserts that
branch exists, so it cannot be quietly removed.

### Why published review batches don't break

Configs like `config/wonderlab-voice-polish-batch-011.json` pin each review by `sourceKey`, which
reads like a filesystem dependency. It isn't. `scripts/preflight-wonderlab-voice-polish-batch.mjs`
compares that value against the **`Component` row's** `sourceKey` column
(`sourceLock: actual.sourceKey === revision.sourceKey`), never against a file on disk. The
corresponding workflow only triggers on changes to itself, its scripts, or
`config/*wonderlab-voice-polish-batch*.json` — component sources are not in its path filter.

### Generated artifacts regenerate

`public/wonderlab-components.json` and `utils/generated/wonderLabSourceEvidence.ts` both list every
discovered component, and both are **untracked build artifacts**. They simply stop listing a deleted
component on the next generation. No contract asserts a fixed entry count.

## The two operations

### Retire — the default

The component is gone and has no successor. This is already fully supported; it is a status change,
not a new concept.

1. Delete the source file.
2. Set the `Component`'s status to `RETIRED` with a `statusReason` saying what replaced it or why it
   went. `ComponentStatus.RETIRED` is a real enum value (`prisma/schema.prisma:2540`), settable from
   the admin UI at `components/wonderlab/lab-interact.vue:154`, rendered by
   `components/wonderlab/component-card.vue`, and sorted last in
   `utils/wonderlab/componentCatalog.ts` (`statusOrder.RETIRED = 6`).
3. Let reconcile flip `isDiscovered` on its next run. The museum's `discovery: 'missing'` filter
   (`normalizeWonderLabMuseumQuery`) is what surfaces these as history.

The reviews stay on the retired exhibit. That is the point — they document what the site was.

### Succeed — only when reviews describe a surface that still exists

Use this only when a component was **renamed or redesigned in place** and its reviews genuinely
describe the successor's behaviour. Re-point the `Reaction`s at the successor `Component`, then
retire the original as above.

Do not reach for this to "save" reviews from retirement. A review of a deleted surface belongs on
the deleted surface.

## What this policy is not

It is not licence to delete a component that is still mounted somewhere. Check first — the ordinary
dead-code checks still apply, and `verifyLayoutContract.ts` resolves every MDC mount in `content/`,
so a component referenced from a content file will fail CI if you remove it.
