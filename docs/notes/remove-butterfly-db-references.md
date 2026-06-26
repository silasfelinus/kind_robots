# DB reference cleanup

This branch removes app-side dependence on DB-backed removed model records while keeping generated animations and interactibles available.

## Changed

- `stores/butterflyStore.ts`
  - Removed DB-backed fetching/posting.
  - Replaced persisted catch records with local session state.
  - Kept swarm generation, presets, animation controls, startup loader behavior, and interactible support.

- `components/butterfly/butterfly-net.vue`
  - Uses local session state instead of user catch records.

- `stores/reactionStore.ts`
  - Removed the retired target type.

- `server/api/reactions/index.post.ts`
  - Removed retired target payload handling.
  - Rejects retired category payloads while generated Prisma artifacts still contain them.

- `cypress/e2e/api/relationships.cy.ts`
  - Restored compact relationship coverage without removed-model references.

- `cypress/support/e2e.ts` and `cypress/support/commands.ts`
  - Load Cypress support commands for e2e specs.
  - Auto-register successful API `POST` creations for after-run cleanup.
  - Tracks batch-created records when an endpoint returns an array.
  - Uses bearer/API-key headers from the create request, with an admin-key fallback for cleanup registrations that did not include auth.

## Follow-up recommended locally

Run:

```bash
npm run prisma:generate
npm run test
```

If generated Prisma artifacts are tracked, commit the generated cleanup after schema changes land locally.
