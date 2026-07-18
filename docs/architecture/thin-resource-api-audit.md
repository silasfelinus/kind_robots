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

| Resource           | Previous problem                                                                                              | Completed action                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Dream create       | Created ArtCollection and Chat records, updated ArtCollection, and returned `dreamInclude`                    | Removed unrelated writes and replaced the response with `dreamMutationSelect`                                                   |
| Dream patch        | Updated ArtCollection, created Chat records as an update log, re-read `dreamInclude`                          | Removed unrelated writes and second read; returns the updated Dream projection                                                  |
| Dream batch create | Created ArtCollection, three ArtImage rows, Chat rows, updated Dream and collection, then re-read every Dream | Reduced to batch Dream creation with optional links to existing records                                                         |
| Dream delete       | Manually detached Chats, deleted Reactions, and cleared many-to-many links before deletion                    | Declared preserve-vs-cascade behavior in Prisma, migrated Dream reactions to cascade, and reduced the route to one Dream delete |

### P1 — Completed response and resource-boundary cleanup

| Resource  | Previous finding                                                                                                                                                                                | Completed action                                                                                                                                                                                                                                                        |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Character | POST/PATCH returned ArtImage, Rewards, Scenarios, and Dreams                                                                                                                                    | Added `characterMutationSelect`; mutation routes return Character scalars while relationship fetches remain explicit                                                                                                                                                    |
| Scenario  | Single/batch create and PATCH returned ArtImage, User, Characters, and Dreams; single-resource POST also accepted arrays and returned skipped pseudo-records                                    | Added `scenarioMutationSelect`; `scenarioStore` force-hydrates detail after mutations. `POST /api/scenarios` now creates one Scenario and returns `409` for duplicates; `POST /api/scenarios/batch` owns array, skip, and partial-success behavior                      |
| Reward    | Shared helpers returned ArtImage, Characters, Dreams, Reactions, and User after every mutation                                                                                                  | Added `rewardMutationSelect`; create, batch create, and update return Reward scalars while GET routes retain detail                                                                                                                                                     |
| Prompt    | Create returned User, Bot, and ArtImage; GET fetched related art IDs; PATCH passed raw `Partial<Prompt>` through to Prisma, including owner and queue fields                                     | Added `promptResourceSelect`; Prompt POST/PATCH/GET return Prompt only. PATCH whitelists user-editable content, flags, and validated Bot/ArtImage links while the store sends only those fields. Related art remains on the existing art-by-prompt endpoint                |

### P2 — Moderate response weight or combined command behavior

| Resource                  | Finding                                                                                                                                          | Action                                                                                                                                                                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot                       | POST/PATCH returned User, Server, and ArtImage summaries; the helper used a nonexistent singular route and posted arrays to single-resource CRUD | Added `botMutationSelect`; mutations return Bot scalars. `botHelper` now uses `/api/bots` and coordinates multiple creates as individual POSTs                                                                                                              |
| Project                   | POST/PATCH returned manager, art, collection, pitch sheet, and six counts; direct fallback fabricated empty relation objects                     | Added `projectMutationSelect`; Prisma and direct-write paths return the same Project scalar shape. `projectStore` merges lean rows into loaded detail and clears stale relation objects when foreign keys change                                            |
| Server                    | POST/PATCH duplicated stale handwritten enum lists that rejected OLLAMA; collection POST also accepted arrays                                    | Validation now derives from Prisma enum values, OLLAMA is available in the form, single POST rejects arrays, and `/api/server/batch` owns partial-success creation while preserving masked-key responses                                                    |
| Theme                     | Collection POST silently accepted arrays and Theme routes returned overlapping `data`, `theme`, and `themes` aliases                             | Shared normalization now powers single and batch creation. `/api/themes` creates one Theme with `409` duplicates, `/api/themes/batch` owns partial-success imports, and Theme routes use `data` as the response contract                                      |
| Resource                  | POST/PATCH returned User, ArtImage, Server, and usage relation graphs; collection POST also doubled as runtime/seed import                         | Added `resourceMutationSelect`; single create/update return Resource scalars, `/api/resources/batch` owns imports and partial results, enum validation derives from Prisma, and `resourceStore.addResources()` consumes the explicit batch contract       |
| SmartIcon                 | Collection POST silently switched to `createMany`, ineffective `skipDuplicates`, and PATCH accepted raw Prisma ownership fields                   | Shared normalization now powers single and explicit batch creation. Duplicate owner/title/type identities return `409` or skip in batch, authenticated ownership is enforced, and PATCH uses a whitelist                                                   |
| Reaction                  | Store sent partial updates while PATCH required type and category; generic and target-specific routes passed raw `Partial<Reaction>` into Prisma | Generic PATCH now owns mutation with immutable targets; redundant chat/component PATCH routes were removed. The malformed chat GET route was corrected and now returns the array envelope expected by `reactionStore`                                       |
| PitchSheet                | `/api/sheets` mixed standalone CRUD with Dream-derived defaults and every mutation returned Dream, Project, or ArtImage detail                   | `/api/sheets` now creates standalone PitchSheets only. `/api/sheets/by-dream/:dreamId` remains the explicit derivation command. Both command and CRUD mutations return `pitchSheetMutationSelect`, and `sheetStore` hydrates Dream detail after the command |
| SocialPost / SocialTarget | Abandoned publishing prototype had no active product workflow                                                                                    | Removed the models, enums, migration surface, API routes, Pinia store, formatter, dashboard tab, component, and Cypress suite                                                                                                                               |

## Explicit Workflow Exceptions

These routes are intentionally multi-resource or operational and should not be rewritten as generic CRUD:

- Art generation and save-generated commands
- Model Builder commit and artifact commands
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
3. ✅ Character, Scenario, Reward, and Prompt resource projections, including explicit Scenario single/batch create routes and a whitelisted Prompt PATCH contract.
4. ✅ Bot, Project, Server, Theme, Resource, SmartIcon, Reaction, and PitchSheet response/create-boundary cleanup; retired the unused SocialPost/SocialTarget prototype instead of preserving dead CRUD.
5. ✅ Dream delete referential actions and route simplification; continue the same audit for other resources only where manual cleanup remains.
6. Re-run deployed API Cypress tests and compare Vercel mutation duration/error volume when production catches up to the merged API tier.

## Definition of Done

- Mutation route creates or updates one resource or declared aggregate.
- No hidden creation of unrelated records.
- Mutation response uses a bounded named projection.
- Store owns optional multi-resource workflows.
- Tests assert both intended writes and absence of former side effects.
- Detail/list hydration remains available through query routes.
