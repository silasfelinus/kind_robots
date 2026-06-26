# Butterfly DB reference cleanup

This branch removes the app-side dependence on DB-backed butterfly records while keeping generated butterfly animations and interactibles available.

## Changed

- `stores/butterflyStore.ts`
  - Removed DB-backed butterfly and catch-record fetching/posting.
  - Replaced persisted catch records with local session capture state.
  - Kept swarm generation, presets, animation controls, startup loader behavior, and interactible support.

- `components/butterfly/butterfly-net.vue`
  - Uses local session capture state instead of user catch records.

- `stores/reactionStore.ts`
  - Removed butterfly as a reaction target type.

- `server/api/reactions/index.post.ts`
  - Removed butterfly target payload handling.
  - Rejects the retired `BUTTERFLY` reaction category while generated Prisma artifacts still contain it.

- `cypress/e2e/api/butterflies.cy.ts`
  - Replaced obsolete DB endpoint tests with route-retirement coverage.

- `cypress/e2e/api/relationships.cy.ts`
  - Replaced stale relationship fixture suite so it no longer creates removed butterfly relation records.

## Follow-up recommended locally

Run:

```bash
npm run prisma:generate
npm run test
```

If generated Prisma artifacts are tracked, commit the generated cleanup after schema changes land locally.
