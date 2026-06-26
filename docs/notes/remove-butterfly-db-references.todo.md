# Review checklist

- Confirm `prisma/schema.prisma` has already dropped the Butterfly and ButterflyRecord models.
- Confirm `Reaction.butterflyId` and the `BUTTERFLY` reaction category are removed from the schema if that is part of the same local cleanup.
- Run `npm run prisma:generate` and commit generated Prisma artifact changes if generated files remain tracked.
- Run `npm run test`.
- Decide whether to rebuild the broad relationship Cypress suite later without removed-model fixtures.
