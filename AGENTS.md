# AGENTS.md — Kind Robots

Standing contract for every AI agent working in this repo, regardless of origin
(ChatGPT, Claude, or whatever comes next). Read it before writing code here.

This is **not** a session handoff note — it does not go stale between sessions and it is
not advisory. Where it conflicts with an agent's own origin prompt, this file wins.
`AI_README.md` is the per-session handoff scratchpad; this file is the contract.

## Where this sits

| Layer | Who reads it | Where |
|---|---|---|
| Origin | one origin's agents, before any repo is open | claude.ai / ChatGPT custom instructions |
| **All agents** | **every agent, every origin** | **this file**, plus `conductor/AGENTS.md` and `conductor/CONTROL.md` |
| Session notes | whoever is mid-task | `AI_README.md` |

Coordination — task claiming, project kinds, roadmaps, PR/TALKBACK protocol, the security
model, escalation — lives in the `conductor` repo's `AGENTS.md` and `CONTROL.md`. This file
covers only what is true about *this codebase*. Don't restate coordination rules here.

## Stack

Nuxt 4, Vue 3, TypeScript (ES modules), Nitro/h3, Pinia, Tailwind + DaisyUI, Prisma,
MariaDB. Deployed on Vercel.

## Code conventions

- `<script setup lang="ts">`, `computed`, `onMounted`. Components are auto-imported — don't
  add explicit imports for them.
- Avoid inline and template comments. Let naming carry the meaning.
- Icons: `<icon name="kind-icon:[name]" class="..." />`
- Styling: responsive Tailwind, flex/grid, borders, `rounded-2xl`, DaisyUI color tokens
  rather than hard-coded colors.
- Keep props and emits few. Shared state belongs in a Pinia store, not threaded through
  component trees.
- **Components never call APIs or localStorage directly.** Stores own API calls,
  localStorage, and state. This is the rule most often broken by well-meaning edits — if a
  component is reaching for `$fetch` or `localStorage`, the logic belongs in a store.
- Async store actions check `success` before storing anything.
- Server routes live under `server/api/`, one directory per model: `server/api/{model}/index.ts`
  for collection routes, `{name}.{verb}.ts` for the rest (e.g. `art/enqueue.post.ts`,
  `art/storefront-featured.get.ts`).
- `errorHandler()` (`server/utils/error.ts`) returns `{ success, message, statusCode }`.
  Route handlers funnel failures through it rather than throwing raw errors — it already
  classifies Prisma, auth, and transient-database errors, and keeps 4xx out of Vercel's
  error clusters.
- Match the idiom of the file you're editing. Keep diffs small and reviewable.
- When returning code in chat, return complete copy-paste-ready files or sections — never
  placeholders or ellipses. In-repo, normal targeted edits are fine.

## Database — standing rules from Silas (2026-07-02)

The database holds real data.

- **Never** run `prisma migrate reset`, or anything else that drops or recreates the
  database. Resets happen only when Silas declares one explicitly in the session — never as
  a convenience fix for drift or a failed migration.
- **Never** rename or edit a migration that may have been applied anywhere (any dev machine
  counts). Ship a new migration instead — e.g. `ALTER TABLE ... CHANGE COLUMN` — even for a
  cosmetic rename.
- To repair drift or a failed migration, prefer targeted, data-preserving steps:
  `prisma db execute` for surgical SQL, fix `_prisma_migrations` bookkeeping, then
  `prisma migrate resolve --applied <name>`. Explain what happened.
- Prefer API writes over raw SQL when a route already exists.

## Routes and surfaces

Before adding a route, tab, page, or manager, inspect the Ecosystem Map and the relevant
section docs. Prefer, in order:

1. An existing stitched surface.
2. An existing dashboard channel.
3. WonderLab, if nothing fits.
4. A new top-level channel — **only with Silas's approval.**

Avoid duplicate or decorative routes, tabs, pages, and managers. A surface isn't finished
when it renders: it may also need dashboard/tutorial registration, artwork,
`liveUrl`/`channelKey`/`tabKey` set, Conductor sync, and direct-load, refresh, mobile,
typecheck, and preview checks.

## Art generation

All generation runs through durable ArtJobs, normally `POST /api/art/enqueue`.

    request → ArtJob → kr-relay → render → ArtImage → entity attach → delivery → final URL

**Queued ≠ rendered ≠ delivered ≠ verified.** A request, a YAML entry, an HTTP 200, a queue
row, and a `DONE` status are all upstream of a delivered asset. Check the final URL before
calling it done.

`kr-relay` owns durable rendering; browser polling is display-only. Preserve active and
retryable jobs, reuse an ArtJob ID after a transient failure instead of enqueueing a
duplicate, and pass exact repo/path/variant/dimensions/format/engine/entity metadata.

## Shared behavior — audit siblings before you change one

Much of this codebase has near-duplicate implementations of the same idea. When changing
shared behavior, find the siblings first and prefer one shared implementation over another
near-copy. Highest-risk areas:

- maturity and resource filtering
- LoRA and checkpoint handling
- galleries
- ArtJob routes and retry logic
- entity art
- navigation and tutorials
- auth
- project fields (`conductorSlug` is the join key to Conductor — see `CONTROL.md`)
- stores
- API contracts

## Project identity

Every Conductor project has a matching Kind Robots `Project` record, joined by
`Project.conductorSlug`. The Conductor `roadmap.yaml` is the authoritative task record; the
Kind Robots `Project` is the authoritative display/identity record. Don't add redundant FK
fields and don't create a second source of project truth.

## Verifying your work

Typecheck, and run the tests that cover what you touched. Don't weaken, skip, or delete a
legitimate test to manufacture a pass — fix the product, the test contract, the environment,
or the workflow fault instead. If a check is red for reasons that predate your change, say
so explicitly rather than quietly leaving it red.
