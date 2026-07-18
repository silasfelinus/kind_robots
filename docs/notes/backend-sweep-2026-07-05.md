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

| File:line                                             | Exposure                                                                                 |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `server/api/achievements/updateClickRecord.put.ts:26` | unauth `prisma.user.update` on any userId from body                                      |
| `server/api/achievements/updateMatchRecord.put.ts:26` | same — writes matchRecord on any user                                                    |
| `server/api/achievements/[id].patch.ts:37`            | unauth update + raw body mass-assignment                                                 |
| `server/api/achievements/[id].delete.ts:21`           | unauth delete                                                                            |
| `server/api/achievements/index.post.ts:24`            | unauth batch create                                                                      |
| `server/api/achievements/records/[id].patch.ts:45`    | unauth update + mass-assignment                                                          |
| `server/api/components/[id].delete.ts:21`             | no auth import at all                                                                    |
| `server/api/components/[id].patch.ts:128`             | unauth update                                                                            |
| `server/api/components/index.post.ts:89`              | unauth upsert                                                                            |
| `server/api/components/name/[name].patch.ts:76`       | unauth + raw body update                                                                 |
| `server/api/stripe/checkout.post.ts:30`               | unauth; userId from body → attaches/overwrites Stripe customer, opens checkout as victim |
| `server/api/stripe/subscribe.post.ts:26`              | same for subscriptions                                                                   |
| `server/api/art/upload.post.ts:97`                    | unauth; `userId = getNumberField(...) \|\| 10` → anon uploads as any user                |
| `server/api/bots/seed.post.ts:9`                      | unauth bot seed/overwrite                                                                |
| `server/api/art/sd/setModel.post.ts:17`               | unauth POST to live SD server (GPU model-switch/DoS)                                     |

`users/register.post.ts` and `auth/login.post.ts` are legitimately public.

### A2. SECURITY — authed but missing ownership / optional-auth writes

- `server/api/logs/[id].delete.ts:41` — any authed user deletes any log (no `existing.userId` compare).
- `server/api/server/health/[id].patch.ts:37` — optional auth lets anon flip `lastStatus`/`lastCheckedAt` on public servers.

### A3. Mass assignment — raw `readBody` fed straight to `prisma.update`

Even with auth+ownership, the caller can set `userId`/`id`/any column. Fix with
a field-guarded typed `UpdateInput` builder (see `sample/[id].patch.ts`).

- `server/api/prompts/[id].patch.ts:60`
- `server/api/icons/[id].patch.ts:56`
- `server/api/reactions/[id].patch.ts:61-63`
- `server/api/reactions/chat/[id].patch.ts:40-42`
- `server/api/reactions/component/[id].patch.ts:41-43`
- plus the unauthenticated achievements/components ones above

### A4. Bugs

- `server/api/logs/[id].delete.ts:12-16` — returns `errorHandler({...})` as the body **without** setting `event.node.res.statusCode`, so failures return HTTP 200 with a `{success:false}` body — breaks clients that trust HTTP status.
- `server/api/reactions/chat/[id].patch.ts:53` and `reactions/component/[id].patch.ts:56` — double-nested `data: { reaction }` / `data: { updatedReaction }`, off-pattern vs every other reaction endpoint.
- `server/api/prompts/[id].patch.ts:1` — stale header comment (`// /server/api/art/prompts/...`).
- `server/api/chats/[id].delete.ts:17,85` — "Communication" messages left over from an old model name.
- No cross-model prisma-accessor mismatches found (the old sample SmartIcon-style bug is not present elsewhere).

### A5. Consistency

- **Admin-check drift:** ~25 files still use `Role === 'ADMIN'`-only instead of the newer `Role === 'ADMIN' || user.id === 1` (available as `userIsAdmin()` in `server/utils/authUser.ts`) — including the canonical `scenarios/[id].patch.ts|delete.ts|batch.patch.ts` themselves. `users/*` and `prompts/[id].patch.ts` are owner-only with no admin bypass at all.
- **Envelope drift:** `achievements/*` omit `message`; `bots/seed.post.ts` returns `{success,data}`; `art/sd/setModel.post.ts` returns `{success,message,model}` (no data); `relations/*` use `setResponseStatus` and omit `statusCode`.
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
