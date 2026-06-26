# Review checklist

- Confirm local schema changes are present.
- Run `npm run prisma:generate` and commit generated Prisma artifact changes if generated files remain tracked.
- Run `npm run test`.
- Check `.cypress-cache/seed-cleanup-latest.json` after a Cypress run. All cleanup entries should pass.
- Watch for specs that create records through non-POST side effects. Those should register cleanup explicitly.
