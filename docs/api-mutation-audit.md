# API Mutation Audit — thin-resource pass

_Definition-of-done audit for the API overhaul (issue #570), Phase 5. Enumerates
every public mutation route with its authentication, ownership source, input
contract, relation validation, response projection, and test coverage, then lists
the remaining findings ranked by risk._

Legend — **Input:** _reject_ = unknown fields return 400 via an explicit allowlist;
_ignore_ = unknown fields silently dropped. **Relations:** _E_ = existence-only,
_E+P_ = existence **and** permission (public/owner/admin). **Ownership:** _auth_ =
`userId` set from the validated key/session; body `userId` rejected or tolerated
only when it matches.

## Per-family summary

| Family | Auth | Ownership | Input | Relations | Projection | Verdict |
|---|---|---|---|---|---|---|
| dreams | requireApiUser | auth | reject | E+P | lean | clean |
| scenarios | validateApiKey | auth | reject | E+P | lean | clean |
| characters | validateApiKey | auth | reject | E+P | lean | clean |
| rewards | validateApiKey | auth | reject | E+P | lean | clean |
| themes | validateApiKey | auth | reject | n/a | lean | clean |
| reactions (main) | validateApiKey | auth | reject | **E+P** (per-category) | full | clean |
| sheets | requireApiUser | auth | reject | E (artImageId format) | lean | clean |
| projects | requireApiUser | auth | reject | E+P | lean | clean |
| todos | requireApiUser | auth (SQL-scoped) | reject (compat-tolerant) | E+P | full | clean |
| logs | requireApiUser | auth | reject | n/a | full | clean |
| chats | validateApiKey | auth | reject | E+P | lean | clean |
| achievements | requireAdminApiUser / owner | admin / auth | reject | E | lean | clean |
| art/collection | requireApiUser | auth | reject | E+P | lean | clean |
| art/image | requireMachineUser | owner/admin (transfer blocked) | **ignore** | E+P (Dream/Collection); **serverId/checkpointResourceId E only** | full (blob) | see F-2/F-4/F-5 |
| bots | requireApiUser / validateApiKey | auth | **ignore** | E+P | lean | see F-4/F-6 |
| prompts (create) | validateApiKey | auth | **ignore** | E only | lean | see F-4 |
| resources | validateApiKey | auth | **ignore** | E only | lean | see F-4 |
| server | requireAuthUser | auth (reassign blocked) | ignore (privilege fields gated) | enum | safeServer | see F-4 |
| users | requireApiUser / dedicated admin routes | self / admin | allowlist | n/a | scoped | clean |

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

### Remaining — ranked

- **F-2 (residual, medium): relation-connect IDs not permission-checked** on
  the paths that were not part of the bots/projects fix:
  - `art/image/[id].patch` — `serverId`/`checkpointResourceId` are set as raw
    scalars with no existence/permission check (machine-auth route; typically set
    by the render pipeline, so lower exposure).
  - `reactions/art` & `reactions/dream` sub-patches — target not visibility-checked
    (these have no first-party callers; the main `/api/reactions` route is gated).
  Recommend the same `assert*RelationsAttachable` gate used elsewhere.

- **F-4 (low, cosmetic): input contract is silent-ignore, not reject** on the
  `bots`/`prompts`/`resources`/`server` **create** paths (broad `Partial<Model>`
  bodies). Ownership is already safe; unknown/system fields are dropped rather than
  400'd. Bringing these to the allowlist-reject contract finishes Phase 1 for them —
  but each round-trips a full model from its store, so the reject boundary must ship
  with a validated-and-ignore compatibility set (verified against the running app)
  to avoid breaking those payloads.

- **F-5 (residual, low): heavy response graphs.** `art/image` create/patch/save
  return the full row including the base64 `imageData`/`thumbnailData` blobs.
  A lean projection is preferable, but clients may read the returned blob, so this
  needs validation against the running app before changing the response shape.

- **F-6 (low, by design): server-key ownership bypass.** A server key bypasses
  owner checks on `characters`/`bots` mutation/delete. No owner **reassignment** is
  possible, so this is a trust-level choice, not a takeover.

## Workflows
- The only auto-committing pipeline is `fallback-snapshot.yml` (`contents: write`),
  triggered by `schedule`/`workflow_dispatch` only — never `pull_request` — and
  guarded to `refs/heads/main`. No PR-triggered workflow has write permissions.
- Maintenance/migration endpoints (`users/cypress-cleanup`, `components/reconcile`,
  `bots/seed`, `art/collection/assign-orphans`, …) should be confirmed admin/
  server-key gated; the achievements/wonderlab ones are.

## Definition-of-done status
- No public mutation persists ownership from request identity. ✅
- Every hardened family rejects unknown/system fields; create paths on
  bots/prompts/resources/server still silently ignore them (F-4). ◑
- Relation IDs are bounded + existence + permission checked across the core
  families and now bots + projects; only `art/image` sub-patches and the
  caller-less reaction sub-patches remain (F-2 residual). ◑
- The self-service user PATCH is an explicit allowlist; no owner-reassignment
  path remains (F-1 closed, F-3 closed). ✅
- Mutation envelopes and status codes are consistent. ✅
- CI has no self-mutating PR workflows. ✅
- Residual items (F-4 create-path reject boundaries, F-5 art/image blob
  projection) are store/client-coupled and should be validated against the
  running app before landing.
