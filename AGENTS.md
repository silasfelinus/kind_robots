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
- **Root-first client layout is intentional.** Kind Robots keeps `components/`, `pages/`,
  `stores/`, `middleware/`, `assets/`, and `utils/` at repository root. Do not migrate
  them into a wrapper `app/` directory merely because a newer Nuxt convention suggests it.
- **Do not create a root `composables/` directory.** Domain state, API calls, persistence,
  caching, and orchestration belong to the responsible Pinia store. Store-owned implementation
  machinery belongs in `stores/helpers/`; genuinely cross-domain stateless code belongs in
  `utils/`. Using `ref`, `computed`, or `watch` does not by itself justify a new
  architectural category.
- Root `middleware/` is client/router middleware (`defineNuxtRouteMiddleware`).
  `server/middleware/` is Nitro request middleware. Keep both when needed; they are different
  execution layers and must not be collapsed for folder-count aesthetics.
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
when it renders: it may also need dashboard/tutorial registration, artwork, and the matching
Kind Robots `Project.liveUrl` / `channelKey` / `tabKey` presentation fields, plus direct-load,
refresh, mobile, typecheck, and preview checks. These presentation fields belong here, not in
Conductor's lifecycle registry.

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

## Deleting a superseded component

A plain "who imports this `.vue` file" grep misses real dependents. When t-026 deleted
`conductor-art-gallery.vue` in favor of `entity-art-manager.vue` (kind_robots PR #1405), an
import-site search missed two live dependents: a plugin that DOM-scraped the deleted
component's specific rendered markup, and a CI workflow that named the file directly in its
trigger path list. Neither shows up in a normal import/component-usage search. Before
deleting a superseded component:

1. Grep the deleted filename (not just import statements) across the whole repo — `.yml`
   workflow files and DOM-scraping plugins are real dependents too, and they only show up
   on a plain filename search.
2. Check `.github/workflows/*.yml` `paths:` trigger blocks specifically for the filename.
3. Check `plugins/*.client.ts` for selector strings that could key off the deleted
   component's specific rendered markup (an attribute, class, or DOM structure), not just
   its component name.
4. If the component has published WonderLab museum reviews, read
   `docs/wonderlab-component-retirement-policy.md` first — reviews survive retirement by
   design and are never a reason to keep the file.

## Project identity and source of truth

Read `docs/conductor-projection.md` before changing cross-repository project data.

Every Conductor project has a matching Kind Robots `Project` record, joined only by
`Project.conductorSlug`. Do not add a redundant cross-repository foreign key.

**Conductor owns coordination:**

- lifecycle and coordination priority;
- roadmap tasks and milestones;
- dependencies, claims, owners, notes, and passes;
- human gates and approvals;
- pitches and coordination provenance.

**Kind Robots owns presentation and application state:**

- Project title and user-facing description;
- route, channel, tab, live URL, and displayed repository URL;
- project artwork;
- user state, conversations, runtime queues, ArtJobs, payments, grants, and all other
  application data.

Kind Robots stores Conductor coordination as a commit-stamped materialized read projection.
The projection is a cache, not a second authority. Never write projected task or milestone
state directly in this database. Human actions from the Kind Robots UI must emit a Conductor
task event or pitch update; canonical completion occurs only after Conductor commits the
change and the next projection sync returns that exact commit.

The projection sync may update only coordination fields on an existing `Project`: status,
priority, `conductorSlug` when missing, and `lastSyncedAt`. It must not overwrite title,
description, routes, placement, URLs, or artwork. Legacy presentation values in Conductor
`project-overrides.yaml` are bootstrap fallbacks for missing Project rows only. Do not add new
`liveUrl`, `channelKey`, `tabKey`, or `repoUrl` values there.

When the repositories disagree, Conductor wins for coordination fields and Kind Robots wins
for presentation/application fields. Repair the event or projection path instead of editing
both sides until they happen to match.

## Verifying your work

Typecheck, and run the tests that cover what you touched. Don't weaken, skip, or delete a
legitimate test to manufacture a pass — fix the product, the test contract, the environment,
or the workflow fault instead. If a check is red for reasons that predate your change, say
so explicitly rather than quietly leaving it red.
