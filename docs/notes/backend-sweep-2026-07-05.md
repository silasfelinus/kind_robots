# Backend sweep — stores & endpoints drift audit (2026-07-05)

Read-only audit of all Pinia stores (`stores/*.ts`, ~56 files) and all server
API endpoints (`server/api/**`, 243 files) against the repo's canonical
patterns: `stores/rewardStore.ts` for stores, `server/api/scenarios/` +
`server/api/prompts/index.post.ts` for endpoints (both now mirrored in the
refreshed `sample/` templates). This is a findings report to prioritize
follow-up tasks.

> **Verify before fixing.** `main` has advanced since this audit was written,
> so the line numbers below may have drifted. Treat every entry as a triage
> lead, not proof the issue is still current — re-check the named file against
> current `main` before acting on it. (A condensed copy of this note was
> salvaged to `main` while this branch was briefly thought stale; this is the
> full version, reconciled back in.)

> **Security note:** Section A1 lists unauthenticated write endpoints (User
> table, Stripe, art upload/model-switch). Per AGENTS.md these are security
> flags for Silas to review and were **not** auto-fixed. Each should become
> its own scoped `ready` task.

> **Status (Part B).** The four **B1 CRITICAL** store bugs (`codeStore`,
> `compositionStore`, `componentStore`) have since been fixed; the unused `socialStore` and SocialPost publishing prototype were removed
> on this branch — merge-not-overwrite fetches, SSR-safe localStorage, and
> `performFetch` for the circuit breaker. The B2 HIGH overwrite-on-fetch
> stores and all of Part A remain open.

---

## Part A — Endpoints

### A1. SECURITY — mutating endpoints with NO auth (highest priority)

Anyone on the internet can call these. Fix order roughly top-to-bottom.

Resolved since this audit: achievement writes are authenticated and ownership-aware; Stripe billing identity comes from authentication; Component mutations require admins; bot seed is admin-only; dead SD model switching was removed; art upload, ArtImage create/collections, browser health reports, and logs enforce ownership.

| File:line                                             | Exposure                                                                                 |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------- |

`users/register.post.ts` and `auth/login.post.ts` are legitimately public.

### A2. SECURITY — authed but missing ownership / optional-auth writes


### A3. Mass assignment — raw `readBody` fed straight to `prisma.update`

Even with auth+ownership, the caller can set `userId`/`id`/any column. Fix with
a field-guarded typed `UpdateInput` builder (see `sample/[id].patch.ts`).

Resolved since this audit: Prompt, SmartIcon, Reaction, Achievement, and Component mutations now use explicit field whitelists. The specialized Reaction PATCH routes and duplicate Component-by-name route were removed.

### A4. Bugs

- `server/api/prompts/[id].patch.ts:1` — stale header comment (`// /server/api/art/prompts/...`).
- `server/api/chats/[id].delete.ts:17,85` — "Communication" messages left over from an old model name.
- No cross-model prisma-accessor mismatches found (the old sample SmartIcon-style bug is not present elsewhere).

### A5. Consistency

- **Admin-check drift:** ~25 files still use `Role === 'ADMIN'`-only instead of the newer `Role === 'ADMIN' || user.id === 1` (available as `userIsAdmin()` in `server/utils/authUser.ts`) — including the canonical `scenarios/[id].patch.ts|delete.ts|batch.patch.ts` themselves. `users/*` and `prompts/[id].patch.ts` are owner-only with no admin bypass at all.
- **Envelope drift:** `relations/*` use `setResponseStatus` and omit `statusCode`.
- **console.log noise:** 47 hits; worst `characters/generate.ts` (17), `users/register.post.ts` (5), and 2 in the canonical `scenarios/[id].delete.ts`.
- **Batch pattern:** full `created/skipped/failed` + 207 only in `scenarios/*`; `bots/batch.post.ts` and `characters/batch.post.ts` have neither.

### Endpoint fix order (top 10)

1. `achievements/updateClickRecord.put.ts` + `updateMatchRecord.put.ts` — unauth User-table writes
2. `components/` — all 4 mutating routes
3. `achievements/[id].patch.ts`, `[id].delete.ts`, `index.post.ts`, `records/[id].patch.ts`
4. `stripe/checkout.post.ts` + `subscribe.post.ts` — userId from auth, never body
5. `art/upload.post.ts` — require auth; drop `|| 10`
6. `art/sd/setModel.post.ts` — admin/machine gate
7. `bots/seed.post.ts` — admin gate
8. `logs/[id].delete.ts` — ownership + throw
9. `prompts/[id].patch.ts` + `icons/[id].patch.ts` + 3 reactions patches — guarded UpdateInput
10. Sweep Role-only admin → `userIsAdmin()` (start with the canonical scenarios files)

---

## Part B — Stores

### B1. CRITICAL — data loss / safety-infra bypass

- **`codeStore.ts`** (3,365 lines, 7 uses) — `initialize()` calls `fetchAllModels()` which does `items.value = res.data` (line 2073) **before** the merge on 2054-2058 runs, so the merge is dead code and locally-saved unsynced blueprints are dropped, then persisted-over. No force/dedupe, zero error state.
- **`compositionStore.ts`** (284 lines, 5 uses) — same clobber-before-merge (overwrite line 82) + **unguarded** `localStorage` (38-39, 53-54; survives SSR only via try/catch).
- **`socialStore.ts`** — removed with the abandoned SocialPost/SocialTarget publishing prototype.
- **`componentStore.ts`** (7 uses) — raw `fetch()` + `.json()` (39-41, 144, 156), bypassing `performFetch`'s auth injection, timeout, and the 3-strike circuit breaker; a dead DB hangs navigation.

### B2. HIGH — overwrite-on-fetch (clobbers optimistic/local rows)

`list.value = res.data` instead of Map-merge, by descending traffic:
`userStore:508` (81 uses), `serverStore:772` (24), `dreamStore:950` (20, and
filtered fetches replace the whole collection; also no snapshot), `achievementStore:218,271`
(14, achievement data), `chatStore:1517` (13), plus `botStore:535`,
`characterStore:365`, `promptStore:438`, `smartbarStore:233`, `sheetStore`,
`todoStore`, `resourceStore`, `memoryStore`.

**No initialize/dedupe (duplicate concurrent requests):** `sheetStore`,
`todoStore`, `manaStore` (billing UI, also shadows global `fetch`),
`checkpointStore`, `randomStore`, `friendStore`.

### B3. MEDIUM / LOW

- No `error`/`setError`/`clearError` trio: codeStore, componentStore, collectionStore, randomStore, chatStore, storyStore, conductorStore. `lastError` naming drift: userStore, achievementStore, smartbarStore, todoStore, cartStore.
- Missing snapshot fallback on content models that could use it: dreamStore, artStore, serverStore, chatStore, collectionStore.
- `conductorStore:153` uses `$fetch` directly (skips circuit breaker); `promptStore:953` stream fetch sends no auth.
- Redundant manual `Content-Type` on ~20 `performFetch` calls (incl. rewardStore itself) — noise, zero risk. `performFetch` injects Content-Type + Authorization.

### Store fix order (top 10)

1. `codeStore` — fix merge + add dedupe (actively loses blueprints)
2. `compositionStore` — same bug pattern; `socialStore` was removed with the abandoned publishing prototype
3. `componentStore` — swap raw fetch → performFetch (circuit breaker)
4. `dreamStore` — 20 uses, filtered-fetch clobber, no snapshot
5. `userStore` — 81 uses, overwrite + lastError (touch carefully, it's auth)
6. `achievementStore` — achievement records overwritten on fetch
7. `chatStore` — no error trio, no force, manual auth header (streaming hot path)
8. `sheetStore` + `todoStore` — no initialize/dedupe; quick wins
9. `serverStore` — 24 uses, overwrite (external-fetch exceptions OK to keep)
10. `manaStore` — tiny, billing-adjacent, no dedupe + fetch name shadow

### Likely abandoned (0 app call sites — consider deleting over modernizing)

comfyStore, contentStore, editStore, flipStore, friendStore, generatorStore
(internal-only), iconStore, loginStore, registerBuilderStore. `friendStore` and
`loginStore` are full CRUD stores with no consumers.

---

## Suggested next steps

1. File the Section A1 unauth-write endpoints as individual security-flagged
   `ready` tasks (Silas reviews before any fix ships — outward-facing/DB-write).
2. Batch the remaining store CRITICAL fixes (codeStore, composition, component)
   as one "store data-loss sweep" task — all four share the merge/fetch pattern
   the refreshed `sample/sampleStore.ts` now demonstrates.
3. The consistency items (admin-check drift, console noise, envelope) are
   low-stakes reversible cleanups — good kaizen-task fodder, not urgent.
