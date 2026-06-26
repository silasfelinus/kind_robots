# DB reference cleanup

This branch removes app-side dependence on removed DB-backed records while keeping generated animations and interactibles available.

## Changed

- Reworked the animation store so generated items are local/session based.
- Reworked the net interaction to use local session state.
- Removed the retired target from the reaction store and reaction create route.
- Restored compact relationship Cypress coverage without removed-model references.
- Loaded Cypress support commands for e2e specs.
- Auto-register successful API `POST` creations for after-run cleanup.
- Track batch-created records when an endpoint returns an array.
- Use bearer/API-key headers from the create request, with an admin-key fallback for cleanup registrations that did not include auth.

## Follow-up recommended locally

Run:

```bash
npm run prisma:generate
npm run test
```

If generated Prisma artifacts are tracked, commit the generated cleanup after schema changes land locally.
