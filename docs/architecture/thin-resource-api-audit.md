# Thin Resource API Audit

## Rule

Resource mutation routes own one resource or aggregate. They may validate and connect existing related records when those links are part of the resource state, but they do not silently create unrelated records, publish events as database rows, or return an entire relationship graph.

- Routes own validation, authorization, and persistence for one resource.
- Stores coordinate workflows across resource endpoints.
- Components express user intent through stores.
- Query routes use named projections for the screen they serve.
- Explicit command routes may coordinate multiple resources when their name and tests make that behavior obvious.

Examples of explicit commands include publish, import, reconcile, generate, commit, register, and purge routes.

## Mutation Audit

### P0 — Cross-resource side effects

| Resource | Previous problem | Completed action |
| --- | --- | --- |
| Dream create | Created ArtCollection and Chat records, updated ArtCollection, and returned `dreamInclude` | Removed unrelated writes and replaced the response with `dreamMutationSelect` |
| Dream patch | Updated ArtCollection, created Chat records as an update log, re-read `dreamInclude` | Removed unrelated writes and second read; returns the updated Dream projection |
| Dream batch create | Created ArtCollection, three ArtImage rows, Chat rows, updated Dream and collection, then re-read every Dream | Reduced to batch Dream creation with optional links to existing records |
| Dream delete | Manually detaches Chats, Reactions, and many-to-many links before deletion | Kept temporarily for referential integrity; replace with explicit database delete behavior in a migration before simplifying the route |

### P1 — Completed response and resource-boundary cleanup

| Resource | Previous finding | Completed action |
| --- | --- | --- |
| Character | POST/PATCH returned ArtImage, Rewards, Scenarios, and Dreams | Added `characterMutationSelect`; mutation routes return Character scalars while relationship fetches remain explicit |
| Scenario | Single/batch create and PATCH returned ArtImage, User, Characters, and Dreams | Added `scenarioMutationSelect`; `scenarioStore` force-hydrates detail after mutations. The existing single-or-array POST contract remains temporarily for compatibility |
| Reward | Shared helpers returned ArtImage, Characters, Dreams, Reactions, and User after every mutation | Added `rewardMutationSelect`; create, batch create, and update return Reward scalars while GET routes retain detail |
| Prompt | Create returned User, Bot, and ArtImage; GET also fetched related art IDs | Added `promptResourceSelect`; Prompt POST/PATCH/GET return Prompt only. Related art remains on the existing art-by-prompt endpoint. Public-content karma remains isolated server-side domain policy |

### P2 — Moderate response weight or combined command behavior

| Resource | Finding | Action |
| --- | --- | --- |
| Bot | POST/PATCH returned User, Server, and ArtImage summaries; the helper used a nonexistent singular route and posted arrays to single-resource CRUD | Added `botMutationSelect`; mutations return Bot scalars. `botHelper` now uses `/api/bots` and coordinates multiple creates as individual POSTs |
| Project | POST/PATCH returned manager, art, collection, pitch sheet, and six counts; direct fallback fabricated empty relation objects | Added `projectMutationSelect`; Prisma and direct-write paths return the same Project scalar shape. `projectStore` merges lean rows into loaded detail and clears stale relation objects when foreign keys change |
| PitchSheet | One create route handles standalone and Dream-derived creation and returns Dream plus ArtImage | Keep Dream-derived creation as an explicit command route; use lean PitchSheet mutation responses |
| SocialPost | Creates owned SocialTarget children as part of the post aggregate | Keep aggregate creation; replace full target rows with the smallest useful response where callers allow it |

## Explicit Workflow Exceptions

These routes are intentionally multi-resource or operational and should not be rewritten as generic CRUD:

- Art generation and save-generated commands
- Model Builder commit and artifact commands
- Social publish commands
- Registration, referral attribution, and welcome workflows
- User purge and test cleanup workflows
- Reconcile, sync, import, seed, and batch commands

Their tests should assert the complete workflow and their route names should make side effects unsurprising.

## Projection Policy

Each resource should expose named projections instead of one universal include:

- `mutationSelect`: scalar fields and foreign-key IDs returned by POST/PATCH
- `listSelect`: fields required for cards and indexes
- `detailSelect` or bounded `detailInclude`: fields required by one detail screen
- `adminSelect`: operational fields used only by admin tools

Mutation routes must not use a detail include.

## Store Migration Pattern

A store mutation should:

1. POST or PATCH the resource.
2. Upsert the lean mutation result immediately.
3. Fetch the resource detail only when the active screen needs it.
4. Coordinate optional work through the owning stores.

For Dreams, collection creation remains an explicit `collectionStore` action. Chat creation remains an explicit `chatStore` action. Neither is part of Dream persistence.

## Execution Order

1. ✅ Dream mutation boundaries and regression tests.
2. ✅ Dream store/form cleanup and removal of obsolete collection/chat flags.
3. ✅ Character, Scenario, Reward, and Prompt resource projections.
4. Bot, Project, PitchSheet, and SocialPost response cleanup. Bot and Project are complete; PitchSheet is next.
5. Database referential-action migration for deletes that currently require manual cross-resource cleanup.
6. Re-run deployed API Cypress tests and compare Vercel mutation duration/error volume when production catches up to the merged API tier.

## Definition of Done

- Mutation route creates or updates one resource or declared aggregate.
- No hidden creation of unrelated records.
- Mutation response uses a bounded named projection.
- Store owns optional multi-resource workflows.
- Tests assert both intended writes and absence of former side effects.
- Detail/list hydration remains available through query routes.
