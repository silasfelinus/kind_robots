# API Mutation Audit — thin-resource pass

_Definition-of-done audit for the API overhaul (issue #570). Phase 5 enumerated
the "core" mutation families (dreams, scenarios, characters, rewards, themes,
reactions, sheets, projects, todos, logs, chats, achievements, art, bots,
prompts, resources, server, users) with their authentication, ownership source,
input contract, relation validation, response projection, and test coverage.
**Phase 6** (see its own section below) then swept the 16 mutation families the
core pass never covered — comfy, challenges, model-builder, facets,
dream-relations, davinci, botcafe, stripe, appmaker, relations, and the chatgpt
schema-relation service — and closed the findings that sweep surfaced._

> **Scope correction (Phase 6):** an earlier revision of this doc claimed the
> definition-of-done held across "every public mutation route." That was only
> ever verified for the core families in the table below. The Phase 6 families
> were outside that table; they are now audited and their findings fixed, and
> the definition-of-done statements have been re-scoped accordingly.

Legend — **Input:** _reject_ = unknown fields return 400 via an explicit allowlist;
_ignore_ = unknown fields silently dropped. **Relations:** _E_ = existence-only,
_E+P_ = existence **and** permission (public/owner/admin). **Ownership:** _auth_ =
`userId` set from the validated key/session; body `userId` rejected or tolerated
only when it matches.

## Per-family summary

| Family           | Auth                                    | Ownership                      | Input                           | Relations                                                        | Projection  | Verdict         |
| ---------------- | --------------------------------------- | ------------------------------ | ------------------------------- | ---------------------------------------------------------------- | ----------- | --------------- |
| dreams           | requireApiUser                          | auth                           | reject                          | E+P                                                              | lean        | clean           |
| scenarios        | validateApiKey                          | auth                           | reject                          | E+P                                                              | lean        | clean           |
| characters       | validateApiKey                          | auth                           | reject                          | E+P                                                              | lean        | clean           |
| rewards          | validateApiKey                          | auth                           | reject                          | E+P                                                              | lean        | clean           |
| themes           | validateApiKey                          | auth                           | reject                          | n/a                                                              | lean        | clean           |
| reactions (main) | validateApiKey                          | auth                           | reject                          | **E+P** (per-category)                                           | full        | clean           |
| sheets           | requireApiUser                          | auth                           | reject                          | E (artImageId format)                                            | lean        | clean           |
| projects         | requireApiUser                          | auth                           | reject                          | E+P                                                              | lean        | clean           |
| todos            | requireApiUser                          | auth (SQL-scoped)              | reject (compat-tolerant)        | E+P                                                              | full        | clean           |
| logs             | requireApiUser                          | auth                           | reject                          | n/a                                                              | full        | clean           |
| chats            | validateApiKey                          | auth                           | reject                          | E+P                                                              | lean        | clean           |
| achievements     | requireAdminApiUser / owner             | admin / auth                   | reject                          | E                                                                | lean        | clean           |
| art/collection   | requireApiUser                          | auth                           | reject                          | E+P                                                              | lean        | clean           |
| art/image        | requireMachineUser                      | owner/admin (transfer blocked) | **ignore**                      | E+P (Dream/Collection); **serverId/checkpointResourceId E only** | full (blob) | see F-2/F-4/F-5 |
| bots             | requireApiUser / validateApiKey         | auth                           | **ignore**                      | E+P                                                              | lean        | see F-4/F-6     |
| prompts (create) | validateApiKey                          | auth                           | **ignore**                      | E only                                                           | lean        | see F-4         |
| resources        | validateApiKey                          | auth                           | **ignore**                      | E only                                                           | lean        | see F-4         |
| server           | requireAuthUser                         | auth (reassign blocked)        | ignore (privilege fields gated) | enum                                                             | safeServer  | see F-4         |
| users            | requireApiUser / dedicated admin routes | self / admin                   | allowlist                       | n/a                                                              | scoped      | clean           |

## Findings

### Fixed in this pass

- **[FIXED] Narrator write access control** — `bots/threads.post.ts`,
  `bots/topics.post.ts` gated on a valid key only and upserted global
  `NarratorThread`/`NarratorTopic` rows. Now require admin or server key (PR #600).
- **[FIXED] Deprecated prompt driver ownership** — `prompts/generate.post.ts`
  mutated any prompt with no ownership check. Now restricted to owner / admin /
  render relay (PR #600).
- **[FIXED] F-1 — ArtImage owner transfer via general patch** —
  `art/image/[id].patch.ts` no longer keeps `userId` in `ART_IMAGE_PATCH_FIELDS`,
  so neither owner nor admin can reassign ownership through the ordinary PATCH
  (PR #610). Owner transfer, if ever needed, belongs behind a dedicated endpoint.
- **[FIXED] F-2 (bots, projects)** — relation connect/set IDs on `bots`
  (Server / ArtImage / Dreams) and `projects` (managerBotId / artImageId /
  artCollectionId) are now existence + permission gated via
  `assertBotRelationsAttachable` (PR #607) and `assertProjectRelationsAttachable`
  (PR #605), matching the Dream/Scenario/Character/Reward/Chat families.
- **[FIXED] F-3 — self-service user PATCH blocklist → allowlist** —
  `users/[id].patch.ts` now writes only an explicit self-editable allowlist;
  privilege / economy / membership / moderation / secret columns can no longer
  be set by the account owner (PR #608).
- **[FIXED] F-5 (projects)** — `projects/[id].delete` returns the lean
  `projectMutationSelect` instead of the heavy `projectInclude` graph, matching
  create/PATCH (PR #611).

- **[FIXED] F-2 residual** — `art/image/[id].patch` now existence + permission
  gates `serverId`/`checkpointResourceId` (server keys bypass), and the
  `reactions/art` / `reactions/dream` sub-patches now visibility-check their
  target (PR #628).
- **[FIXED] F-4** — the `bots` (PR #623) and `prompts`/`resources`/`server`
  (PR #624) create paths now reject unknown fields via an allowlist +
  `assertOnlyFields`, each carrying a full round-trip compatibility set built
  from every model column. A genuinely-unknown key 400s; if a real create ever
  400s with "Unsupported <Model> fields: X", add `X` to that route's compat set.
  The live e2e suite (`cypress.yml`, push-to-main) exercises a happy-path create
  per family, so a broken allowlist surfaces there post-merge.

### Remaining — ranked

- **[FIXED] F-5 (art/image): lean mutation projections.** `art/image`
  create/patch/save-generated now use the named `artImageMutationSelect`, which
  excludes inline media blobs. Callers that need immediate pixels explicitly
  hydrate `GET /api/art/image/:id`, and lean cache merges preserve richer media.

- **[FIXED] Phase 4 (store-safety): fallback-user sweep.** Mutable client forms
  now use the authenticated identity or `null`; auth-owned mutation requests omit
  client identity. A source contract rejects new `userId`/`ownerId` fallbacks to
  users 1 or 10 while leaving deliberate static seed ownership out of scope.

- **F-6 (low, by design): server-key ownership bypass.** A server key bypasses
  owner checks on `characters`/`bots` mutation/delete. No owner **reassignment** is
  possible, so this is a trust-level choice, not a takeover.

## Phase 6 — the previously un-audited families

The core pass covered ~18 families but described itself as covering "every
public mutation route." It did not. Phase 6 audited the 16 remaining mutation
families and fixed the findings below (all merged to `main`; each bullet notes
the fix, not a TODO).

### High

- **[FIXED] auth/login password-hash leak** — `validateUserCredentials` returned
  the full `User` row (including the bcrypt `password` hash) to the login
  response. Now strips `password` before returning (PR #653).
- **[FIXED] model-builder run source-ownership (CRITICAL)** —
  `model-builder/runs` accepted any `sourceType`/`sourceId`; the commit path
  writes back to that record, so a user could point a run at another user's
  Bot/Character/Dream/etc. and overwrite it. Now `assertSourceOwnership` gates
  the run's source record to owner/admin and constrains `sourceType` to a known
  allowlist (PR #655).
- **[FIXED] comfy SSRF + server-token exfiltration** — six comfy routes
  (`characterSheet`, `hunyuan3d`, `kontext/generate`, `kontext/kombine`,
  `ltx/image2Video`, `ltx/text2Video`) honored a client-supplied `apiUrl` and
  then sent `ART_SERVER_PROXY_TOKEN` to it. `apiUrl` is no longer accepted; the
  base URL always comes from the access-checked Server. `resolveComfyUrl` drops
  its `apiUrl` branch (PR #658).
- **[FIXED] challenge-submission relation attach + read oracle** —
  `challenges/[slug]/submissions` connected `artImageId`/`characterId`/
  `scenarioId` with no permission check and echoed the full related rows. Now
  gated to own-or-public (admins bypass) with a lean response select (PR #658).

### Medium

- **[FIXED] appmaker scaffold command injection** — `scaffold-request` built a
  shell command string (stored for Worker execution) by interpolating `title`
  unescaped and `description` with only quote-swapping. Both are now POSIX
  single-quoted and length-capped.
- **[FIXED] relations block self-unblock** — `relations/[id]` delete & patch let
  either participant act, so a blocked user could remove/neutralize the BLOCK.
  BLOCK edits are now owner-only; status is enum-validated.
- **[FIXED] facet attach gates** — `facets` create/patch attached
  `artImageId`/`artCollectionId` raw. Now gated to own-or-public via
  `assertFacetRelationsAttachable`.
- **[FIXED] dream-relation target access** — `dream-relations` existence-checked
  the target Dream only. Now gated behind `assertDreamAccess` view (own/admin/
  public), closing a private-Dream link + enumeration oracle.
- **[FIXED] model-builder artImage attach** — item/artifact `artImageId` is later
  promoted onto the run's source record; `assertArtImageAttachable` now gates it
  to own-or-public on the single patch, batch patch, and artifacts routes.
- **[FIXED] davinci life-run/choice attach** — `createLifeRun`/`recordLifeChoice`
  attached `characterId`/`dreamId`/`botId`/`artCollectionId`/`chatId` raw; now
  gated to own-or-public.
- **[FIXED] chatgpt M2M relation injection** — an M2M `relation.add` mutates the
  target's visible relation set (join row shows on both sides) but required only
  read on the target. It now requires write access to the target; scalar links
  and removes keep read-on-target.
- **[FIXED] botcafe billing bypass** — `n` (completions) was sent to the provider
  but omitted from the mana estimate and `max_tokens` was unclamped. `n` is now
  in `estimateTextCostUsd` and both `n`/`max_tokens` are clamped.
- **[FIXED] stripe subscribe envelope** — the catch passed a wrapper object to
  `errorHandler` and never set the HTTP status, returning 200 on failure. Now
  uses the standard `errorHandler` + status envelope.

### Audited — clean

- Stripe money routes (`checkout`, webhooks) do not trust client-supplied
  amounts or user identity.
- The admin / components / conductor / chatgpt-content mutation surfaces were
  reviewed and found already gated (admin/server-key or owner checks in place).

## Workflows

- The only auto-committing pipeline is `fallback-snapshot.yml` (`contents: write`),
  triggered by `schedule`/`workflow_dispatch` only — never `pull_request` — and
  guarded to `refs/heads/main`. No PR-triggered workflow has write permissions.
- Maintenance/migration endpoints (`users/cypress-cleanup`, `components/reconcile`,
  `bots/seed`, `art/collection/assign-orphans`, …) should be confirmed admin/
  server-key gated; the achievements/wonderlab ones are.

## Definition-of-done status

- No public mutation persists ownership from request identity, across both the
  core families and the Phase 6 sweep. ✅
- Every public create/patch path in the audited families rejects unknown/system
  fields via an explicit allowlist (F-4 closed for bots/prompts/resources/
  server). ✅
- Relation IDs are bounded + existence + permission checked across every audited
  family with writable relations — the core set (bots, projects, `art/image`
  patch, reaction sub-patches; F-2 closed) plus the Phase 6 attach gates
  (challenges, facets, dream-relations, model-builder, davinci, chatgpt M2M). ✅
- The self-service user PATCH is an explicit allowlist; no owner-reassignment
  path remains (F-1 closed, F-3 closed). ✅
- Mutation envelopes and status codes are consistent (stripe/subscribe envelope
  fixed in Phase 6). ✅
- No credential or server secret leaks through a mutation response or an
  outbound proxy request (auth/login hash + comfy SSRF/token closed in Phase 6). ✅
- CI has no self-mutating PR workflows. ✅
- F-5 (ArtImage blob projection) and the Phase 4 fallback-owner sweep were
  completed together in #829 with explicit hydration and source contracts. ✅
