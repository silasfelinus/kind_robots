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

| Resource | Current problem | Action |
| --- | --- | --- |
| Dream create | Created ArtCollection and Chat records, updated ArtCollection, and returned `dreamInclude` | Removed unrelated writes and replaced the response with `dreamMutationSelect` |
| Dream patch | Updated ArtCollection, created Chat records as an update log, re-read `dreamInclude` | Removed unrelated writes and second read; return the updated Dream projection |
| Dream batch create | Created ArtCollection, three ArtImage rows, Chat rows, updated Dream and collection, then re-read every Dream | Reduced to batch Dream creation with optional links to existing records |
| Dream delete | Manually detaches Chats, Reactions, and many-to-many links before deletion | Keep temporarily for referential integrity; replace with explicit database delete behavior in a migration before simplifying the route |

### P1 — Oversized mutation responses or mixed single/batch behavior

| Resource | Finding | Planned action |
| --- | --- | --- |
| Character | Creates only Character, but accepts several relation sets and returns ArtImage, Rewards, Scenarios, and Dreams | Add a scalar mutation projection; let `characterStore` refresh detail when needed |
| Scenario | One route handles both single and batch creation and returns ArtImage, User, Characters, and Dreams | Move batch behavior to the batch route and make single create return a scalar projection |
| Reward | Shared helpers return ArtImage, Characters, Dreams, Reactions, and User after every mutation | Split mutation and detail projections; update `rewardStore` hydration |
| Prompt | Returns User, Bot, and ArtImage after create and also awards public-content karma | Return a scalar Prompt projection; keep karma as server-side domain policy but isolate it from response shaping |

### P2 — Moderate response weight or combined command behavior

| Resource | Finding | Planned action |
| --- | --- | --- |
| Bot | Creates only Bot and uses a bounded include, but mutation callers receive relation summaries by default | Add a mutation projection and explicitly refresh detail in `botStore` |
| Project | Returns manager, art, collection, pitch sheet, and six counts after create | Return Project mutation fields; retain the stale-connection fallback as persistence infrastructure |
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

1. Dream mutation boundaries and regression tests.
2. Dream store/form cleanup and removal of obsolete collection/chat flags.
3. Character, Scenario, Reward, and Prompt mutation projections.
4. Bot, Project, PitchSheet, and SocialPost response cleanup.
5. Database referential-action migration for deletes that currently require manual cross-resource cleanup.
6. Re-run API Cypress tests and compare Vercel mutation duration/error volume before merging each tier.

## Definition of Done

- Mutation route creates or updates one resource or declared aggregate.
- No hidden creation of unrelated records.
- Mutation response uses a bounded named projection.
- Store owns optional multi-resource workflows.
- Tests assert both intended writes and absence of former side effects.
- Detail/list hydration remains available through query routes.
