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
| projects | requireApiUser | auth | reject | **E only (format)** | lean* | see F-5 |
| todos | requireApiUser | auth (SQL-scoped) | reject (compat-tolerant) | E+P | full | clean |
| logs | requireApiUser | auth | reject | n/a | full | clean |
| chats | validateApiKey | auth | reject | E+P | lean | clean |
| achievements | requireAdminApiUser / owner | admin / auth | reject | E | lean | clean |
| art/collection | requireApiUser | auth | reject | E+P | lean | clean |
| art/image | requireMachineUser | owner/admin | **ignore** | **E only** | full (blob) | see F-1/F-2 |
| bots | requireApiUser / validateApiKey | auth | **ignore** | **Dreams: none; Server/ArtImage E** | lean | see F-2/F-6 |
| prompts (create) | validateApiKey | auth | **ignore** | E only | lean | see F-2 |
| resources | validateApiKey | auth | **ignore** | E only | lean | see F-2 |
| server | requireAuthUser | auth (reassign blocked) | ignore (privilege fields gated) | enum | safeServer | clean |
| users | requireApiUser / dedicated admin routes | self / admin | **blocklist** | n/a | scoped | see F-3 |

\* `projects/[id].delete.ts` returns the heavy `projectInclude` graph instead of the
lean `projectMutationSelect` (cosmetic; see F-4).

## Findings

### Fixed in this pass
- **[FIXED] Narrator write access control** — `bots/threads.post.ts`,
  `bots/topics.post.ts` gated on a valid key only and upserted global
  `NarratorThread`/`NarratorTopic` rows. Now require admin or server key (PR #600).
- **[FIXED] Deprecated prompt driver ownership** — `prompts/generate.post.ts`
  mutated any prompt with no ownership check. Now restricted to owner / admin /
  render relay (PR #600).

### Remaining — ranked

- **F-1 (medium): admin owner-reassignment via a general patch route.**
  `art/image/[id].patch.ts` keeps `userId` in `ART_IMAGE_PATCH_FIELDS`; an admin
  token can reassign ArtImage ownership through the ordinary patch. The DoD wants
  owner transfer confined to a dedicated administrative endpoint — recommend
  dropping `userId` from the patch allowlist. No non-admin path exists, so this is
  a policy tightening, not an active exploit.

- **F-2 (medium): relation-connect IDs not permission-checked.** These accept
  user-supplied connect IDs with existence-only or no validation, unlike the
  Dream/Scenario/Character/Reward/Chat families which enforce E+P:
  - `bots` — `Dreams.connect` is neither existence- nor permission-checked;
    `serverId`/`artImageId` are existence-only. A user can attach their Bot to
    another user's private Dream.
  - `projects` — `managerBotId`/`artImageId`/`artCollectionId` format-validated
    then connected, no existence/ownership check.
  - `art/image/[id].patch` — `serverId`/`checkpointResourceId` unchecked.
  - `reactions/art` & `reactions/dream` sub-patches — target not visibility-checked
    (these have no first-party callers; the main `/api/reactions` route is gated).
  Recommend the same `assert*RelationsAttachable` gate used elsewhere.

- **F-3 (medium): `users/[id].patch` uses a blocklist body.** It denies a fixed set
  (Role, karma, mana, apiKey, password, …) and writes every other User scalar
  straight through, so any not-yet-denied column (email, designerName, counters) is
  writable by the account owner. Convert to an explicit allowlist.

- **F-4 (low, cosmetic): input contract is silent-ignore, not reject** on the
  `bots`/`prompts`/`resources`/`server` **create** paths (broad `Partial<Model>`
  bodies). Ownership is already safe; unknown/system fields are dropped rather than
  400'd. Bringing these to the allowlist-reject contract finishes Phase 1 for them.

- **F-5 (low): heavy response graphs.** `projects/[id].delete` returns
  `projectInclude`; `art/image` create/patch/save return the full row including the
  base64 `imageData`/`thumbnailData` blobs. Prefer a lean projection.

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
- Relation IDs are bounded + existence + permission checked on the core families;
  bots/projects/art-image still have gaps (F-2). ◑
- Mutation envelopes and status codes are consistent. ✅
- CI has no self-mutating PR workflows. ✅
- The one remaining owner-reassignment path (art/image admin patch, F-1) should be
  moved behind a dedicated transfer endpoint.
