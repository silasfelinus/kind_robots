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

1. **Move the source file to `components/abandonware/`**, mirroring its original folder
   (`components/butterfly/butterfly-net.vue` → `components/abandonware/butterfly/butterfly-net.vue`).
   See "Park, don't delete" below for why this replaced deletion.
2. Set the `Component`'s status to `RETIRED` with a `statusReason` saying what replaced it or why it
   went. `ComponentStatus.RETIRED` is a real enum value (`prisma/schema.prisma:2540`), settable from
   the admin UI at `components/wonderlab/lab-interact.vue:154`, rendered by
   `components/wonderlab/component-card.vue`, and sorted last in
   `utils/wonderlab/componentCatalog.ts` (`statusOrder.RETIRED = 6`).
3. Regenerate the manifest (`npm run components:manifest`). The entry stays, flagged
   `abandoned: true`, and `isDiscovered` stays **true** — the file genuinely still exists.

The reviews stay on the retired exhibit. That is the point — they document what the site was.

## Park, don't delete

Silas, 2026-08-05, verbatim:

> "if we aren't using a component, it should move to /abandonware. that way it is still reachable by
> wonderlab, but should not affect built"

Deleting kept the reviews but cost the museum the exhibit itself: `wonderlab-preview-host.vue`
renders "Component source not found" for a missing file, and no new AI review draft can ever be
generated for it (`reviewDraftPrompt.ts:209` throws without source evidence). Parking keeps the
exhibit whole while taking the file out of the app.

### What parking actually removes

| | Parked? |
|---|---|
| Nuxt auto-import registration | **Gone** — `nuxt.config.ts` `components[].ignore` lists `abandonware/**/*.vue`, resolved relative to `~/components`. Confirm with: no parked name appears in `.nuxt/components.d.ts`. |
| `vue-tsc` typechecking | **Gone** — `tsconfig.json` excludes `components/abandonware/**/*`. |
| WonderLab preview | **Kept** — the museum's `import.meta.glob('@/components/**/*.vue')` still matches. `ignore` governs auto-import, not globs. |
| Manifest entry + reviews | **Kept**, with `abandoned: true`. |
| SFC compilation | **Kept.** The glob makes each a lazy chunk rather than main-bundle weight, but Vite still compiles it. Dropping the preview is the only way to zero this, and that costs the exhibit. |

### The known rough edge

A parked component that references *another* parked component loses auto-import resolution for that
child, so the child renders as an unresolved custom element in the museum preview. This is common in
the parked clusters (`butterfly/`, `builder/`), which reference each other heavily. The parent's own
markup still renders; the nested child comes up empty. Fixable per-component with an explicit
`import`, if a particular exhibit is ever worth the fidelity.

### Finding what to park

`npm run test:component-reachability` traverses from `app.vue`, `error.vue`, `pages/`, `layouts/`,
and `content/*.md` MDC mounts, and reports every component nothing reaches. A grep cannot answer this
— a cluster that only cites itself looks referenced from every angle except the one that matters. The
baseline is a ratchet at **zero**: a PR that orphans a component fails until it parks it.

That check reports rather than judges. Its blind spots are runtime mounts — `<component :is>`, a
string-addressed registry, a plugin CSS selector — so read the list before acting on it. Three edge
classes were found and taught to it the hard way, each after a first pass parked something live:
directory-local `import.meta.glob` registries (all 47 `screenfx/` effects), explicit `.vue` imports
(`stage-manager`'s three cards, caught by vue-tsc), and Nuxt's `Lazy` prefix
(`<LazyWorkspaceNarrator>`, six components, caught by `test:narrative-kit`).

### Succeed — only when reviews describe a surface that still exists

Use this only when a component was **renamed or redesigned in place** and its reviews genuinely
describe the successor's behaviour. Re-point the `Reaction`s at the successor `Component`, then
retire the original as above.

Do not reach for this to "save" reviews from retirement. A review of a deleted surface belongs on
the deleted surface.

## What this policy is not

It is not licence to park a component that is still mounted somewhere. Check first — the ordinary
dead-code checks still apply, and `verifyLayoutContract.ts` resolves every MDC mount in `content/`,
so a component referenced from a content file will fail CI if you move it.

It is also not a reason to reach for deletion instead. Deleting still behaves exactly as documented
above — the row and its reviews survive — but it costs the exhibit its preview, and parking costs
nothing that matters. Park.
