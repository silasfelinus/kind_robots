# Backend sweep — stores & endpoints drift audit (2026-07-05)

Salvaged documentation from stale branch `claude/model-schema-docs-samples-m5d0jq`.

This note records a read-only audit of Pinia stores and server API endpoints. Treat the findings as triage leads, not as proof that each issue is still current; verify every listed file against current `main` before fixing.

## Security flags to verify first

The stale branch identified these unauthenticated or under-authorized mutating endpoints as highest priority review targets:

- `server/api/milestones/updateClickRecord.put.ts`
- `server/api/milestones/updateMatchRecord.put.ts`
- `server/api/milestones/[id].patch.ts`
- `server/api/milestones/[id].delete.ts`
- `server/api/milestones/index.post.ts`
- `server/api/milestones/records/[id].patch.ts`
- `server/api/components/[id].delete.ts`
- `server/api/components/[id].patch.ts`
- `server/api/components/index.post.ts`
- `server/api/components/name/[name].patch.ts`
- `server/api/stripe/checkout.post.ts`
- `server/api/stripe/subscribe.post.ts`
- `server/api/art/upload.post.ts`
- `server/api/bots/seed.post.ts`
- `server/api/art/sd/setModel.post.ts`

Do not batch-fix these blindly. Verify each route on current `main`, then file or implement scoped security tasks with ownership/auth expectations called out explicitly.

## Other endpoint drift to verify

- Raw `readBody` values passed into Prisma updates can create mass-assignment risk. Verify prompt, icon, reaction, milestone, and component patch routes.
- Error bodies returned without setting HTTP status can make failures look like HTTP 200. Verify `server/api/logs/[id].delete.ts`.
- Some reaction patch routes may have double-nested `data` payloads.
- Some route comments may still reference old paths or old model names.
- Admin-check style may drift between `Role === 'ADMIN'`, `id === 1`, and `userIsAdmin()`.
- Response envelope shape may drift across older routes.
- Batch endpoints may not consistently return `created/skipped/failed` with 207 on partial success.

## Store drift to verify

The stale audit flagged these patterns:

- Fetch paths that overwrite local collections instead of merging by id.
- Stores that lack request dedupe for `initialize()` or fetch methods.
- Stores that bypass `performFetch`, losing auth injection, timeout, and circuit-breaker behavior.
- Stores with no consistent `error` / `setError` / `clearError` shape.
- Content-heavy stores with no snapshot fallback.

Priority candidates from the stale branch were:

1. `codeStore`
2. `compositionStore`
3. `socialStore`
4. `componentStore`
5. `dreamStore`
6. `userStore`
7. `milestoneStore`
8. `chatStore`
9. `sheetStore`
10. `todoStore`
11. `serverStore`
12. `manaStore`

## Suggested salvage path

1. Verify the security endpoints against current `main` first.
2. Turn confirmed security findings into separate tasks or PRs.
3. Batch shared store-pattern fixes only when the pattern and tests are current.
4. Keep this note as triage context; do not treat it as current truth without re-checking.
