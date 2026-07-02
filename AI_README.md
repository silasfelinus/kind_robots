# AI README for Kind Robots

Last updated: 2026-06-23

This file is a shared handoff note for future AI coding sessions helping Silas with Kind Robots.

## Project conventions

- Nuxt 4, Vue 3, TypeScript, Prisma, MariaDB.
- Server routes live under `/server/api`.
- Frontend state and data flow should go through Pinia stores.
- Styling uses Tailwind and DaisyUI.
- Prefer complete copy-pasteable code when requested.

## Database migration rules (standing, from Silas 2026-07-02)

- NEVER run `prisma migrate reset` or any command that drops/recreates the
  database. The database contains real data. Resets happen only under specific
  circumstances that Silas declares explicitly in the session — never as a
  convenience fix for drift or a failed migration.
- Never rename or edit a migration folder that may have been applied anywhere
  (any dev machine counts). Ship a new migration instead (e.g.
  `ALTER TABLE ... CHANGE COLUMN`), even for cosmetic renames.
- To repair drift or a failed migration, prefer targeted, data-preserving
  steps: `prisma db execute` for surgical SQL, fix `_prisma_migrations`
  bookkeeping, then `prisma migrate resolve --applied <name>` — and explain
  what happened.

## Current focus

The current focus is stabilizing the Cypress API suite after recent sign-in changes.

## Notes for future sessions

- Read this file first.
- Check the newest failing test output before editing.
- Keep changes small and easy to review.
- Update this file when priorities change.

## Active todo

- [ ] Review Cypress config and package versions.
- [ ] Inspect the failing specs.
- [ ] Reduce repeated setup code across API specs.
- [ ] Re-run the API tests.
- [ ] Record remaining failures here.
