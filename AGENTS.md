# AGENTS.md — Kind Robots

Standing contract for every AI agent working in this repo, regardless of origin (ChatGPT,
Claude, or whatever comes next). Read it before writing code here. It is not a session
handoff note and it is not advisory: where it conflicts with an agent's origin prompt, this
file wins. Each rule is stated once; the linked docs hold full text and history — open one
only when its situation comes up.

## Where this sits

| Layer          | Who reads it                   | Where                                                                                  |
| -------------- | ------------------------------ | -------------------------------------------------------------------------------------- |
| Origin         | one origin's agents            | claude.ai / ChatGPT custom instructions                                                |
| **All agents** | **every agent, every origin**  | **this file**                                                                          |
| Coordination   | agents claiming/closing a task | conductor `AGENTS.md` (core, ~28KB) + `python scripts/show_control.py <project>` there |
| Task context   | whoever is mid-task            | the conductor task note (`python scripts/show_task.py <project>/<task-id>`)            |

Coordination — claiming, project kinds, roadmaps, PR/TALKBACK protocol, the security model,
escalation — lives in the `conductor` repo. Don't restate it here. Don't read conductor's whole
`CONTROL.md` (~125KB): `show_control.py <project>` prints its global overview plus your
project's block. Session handoff belongs in the conductor task note, not in this repo.

## Stack

Nuxt 4, Vue 3, TypeScript (ES modules), Nitro/h3, Pinia, Tailwind + DaisyUI, Prisma, MariaDB.
Production is `https://kindrobots.org` on the self-hosted container path. Vercel is retired:
its status is not authoritative and must not block review or merge.

## Code conventions

- `<script setup lang="ts">`, `computed`, `onMounted`. Components are auto-imported — don't
  add explicit imports for them.
- Avoid inline and template comments. Let naming carry the meaning.
- Icons: `<icon name="kind-icon:[name]" class="..." />`
- Styling: responsive Tailwind, flex/grid, borders, `rounded-2xl`, DaisyUI color tokens
  rather than hard-coded colors.
- Keep props and emits few. Shared state belongs in a Pinia store, not threaded through
  component trees.
- **Root-first client layout is intentional.** Keep `components/`, `pages/`, `stores/`,
  `middleware/`, `assets/`, `utils/` at repository root; don't migrate into `app/`.
- **Do not create a root `composables/` directory.** Domain state, API calls, persistence,
  caching and orchestration belong to the responsible Pinia store; store machinery in
  `stores/helpers/`; genuinely cross-domain stateless code in `utils/`.
- Root `middleware/` is router middleware; `server/middleware/` is Nitro request middleware.
  Different layers — don't collapse them.
- **Components never call APIs or localStorage directly.** Stores own API calls,
  localStorage, and state. This is the rule most often broken by well-meaning edits — if a
  component is reaching for `$fetch` or `localStorage`, the logic belongs in a store.
- Async store actions check `success` before storing anything.
- Server routes live under `server/api/`, one directory per model: `server/api/{model}/index.ts`
  for collections, `{name}.{verb}.ts` for the rest (e.g. `art/enqueue.post.ts`).
- `errorHandler()` (`server/utils/error.ts`) returns `{ success, message, statusCode }`; route
  handlers funnel failures through it rather than throwing raw errors.
- Match the idiom of the file you're editing. Keep diffs small and reviewable.
- When returning code in chat, return complete copy-paste-ready files or sections — never
  placeholders or ellipses. In-repo, normal targeted edits are fine.

## Admin route and navigation contract (Silas, 2026-10-09)

An admin-only feature or development preview lives at an `/admin/...` route with a discoverable
`content/channels/admin/*.md` tab (`requiredRole: ADMIN`) — not under `/play/...` and not a
Projects-only tab. Public release routes go under `/play` when they actually launch. Exceptions
for non-navigation helpers need an explicit owner decision; no silent `navigation: false` for
requested admin tools. When relocating a preview, update its project route and UI contract tests
together; fix other inconsistencies incrementally.

## UI surfaces — viewport-first, art-first, console-first

Full text: [`docs/ui-surface-standards.md`](docs/ui-surface-standards.md) — read it before
building or reshaping a game, gallery or creative tool.

- **One visible screen** at phone/tablet/desktop: use the shell's content height (no new `100vh`
  wrapper); keep the primary interaction, the active stage and a compact control row visible;
  secondary content goes in switchable panes that **scroll inside their own bounded area**
  (`.kr-scroll`). Long articles are an explicit exception.
- **Galleries are a reachability contract:** every item reachable by the gallery's own scroll or
  working pagination; never clip rows with `overflow-hidden`/fixed heights.
- How-to text, caveats and reference prose go in the tutorial/help sidebar, not on the stage.
- **Art-first:** outside settings/admin/diagnostics, prefer image-led cards, canvases, maps and
  decks over text-and-button panels; an entity's art is a primary part of choosing it; missing
  art keeps an image-shaped fallback slot.
- **Console-first:** the stage (art, map, video, game) gets the most space; controls form a
  compact deck around it; use container width on large displays (container queries / intrinsic
  grids); on small displays collapse controls before shrinking the stage.
- Check 390px / 768px / 1440px (and XL) before claiming visual acceptance; apply incrementally.

## Database — standing rules from Silas (2026-07-02)

The database holds real data.

- **Never** run `prisma migrate reset`, or anything else that drops or recreates the database,
  unless Silas declares a reset explicitly in the session.
- **Never** rename or edit a migration that may have been applied anywhere. Ship a new migration
  (e.g. `ALTER TABLE ... CHANGE COLUMN`), even for a cosmetic rename.
- Repair drift with targeted, data-preserving steps: `prisma db execute`, fix
  `_prisma_migrations` bookkeeping, then `prisma migrate resolve --applied <name>`. Explain it.
- Prefer API writes over raw SQL when a route already exists.

## Commands you hand a human start from a fresh window

Every command block for Silas is self-contained: include the `cd` and the `git pull` it needs,
and write paths for the shell he's in (Ferngrotto is Windows; give PowerShell when unknown). It
must also be incapable of printing a secret (conductor hard rule 15). Examples and history:
[`docs/agent-standards-detail.md`](docs/agent-standards-detail.md).

## Self-hosted production — merge is not deploy

Production is Alexandria/Unraid. Keep the states distinct in every handoff:
**merged → image published → deployed → schema verified**.

- The Unraid User Scripts schedule runs `scripts/unraid-user-script.sh` →
  `scripts/deploy-unraid.sh` (pull image, run its migrations with the isolated credential, then
  replace `KindRobots`). **Do not tell Silas to use Force Update as the normal Kind Robots deploy step.**
- Call out any `prisma/schema.prisma` / `prisma/migrations/**` change as **schema-affecting**.
  Unattended migrations must be backward-compatible with the running build (additive by default;
  destructive changes need a staged rollout). If automation is unavailable, give the exact
  `bash scripts/deploy-unraid.sh` command.
- Never put `MIGRATION_DATABASE_URL` in the app environment
  (`docs/runbooks/migration-credential-boundary.md`).
- Read `docs/runbooks/unraid-auto-deploy.md` before changing the container, migration wrapper,
  deploy scripts, image publication or Unraid update behavior.

## Routes and surfaces

Before adding a route, tab, page or manager, check the Ecosystem Map (conductor
`projects/ecosystem-map/`) and the relevant section docs. Prefer, in order: an existing stitched
surface, an existing dashboard channel, WonderLab, and only with Silas's approval a new top-level
channel. A surface isn't finished when it renders: it may also need dashboard/tutorial
registration, artwork, the `Project.liveUrl` / `channelKey` / `tabKey` presentation fields, and
direct-load, refresh, mobile, typecheck and preview checks.

## Art generation

All generation runs through durable ArtJobs, normally `POST /api/art/enqueue`:
request → ArtJob → kr-relay → render → ArtImage → entity attach → delivery → final URL.
**Queued ≠ rendered ≠ delivered ≠ verified** — check the final URL before calling it done.
`kr-relay` owns rendering; browser polling is display-only. Reuse an ArtJob ID after a transient
failure instead of enqueueing a duplicate, and pass exact repo/path/variant/dimensions/format/
engine/entity metadata.

## Shared behavior — audit siblings before you change one

Find near-duplicate implementations first and prefer one shared implementation. Highest-risk:
maturity/resource filtering, LoRA and checkpoint handling, galleries, ArtJob routes and retries,
entity art, navigation and tutorials, auth, project fields (`conductorSlug` is the Conductor join
key), stores, API contracts.

**Deleting a component:** grep the filename itself (not just imports) across the repo, including
`.github/workflows/*.yml` `paths:` blocks and selector strings in `plugins/*.client.ts`. Published
WonderLab reviews survive retirement and are never a reason to keep the file.

## Project identity and source of truth

Read `docs/conductor-projection.md` before changing cross-repository project data. Every Conductor
project has one Kind Robots `Project` row, joined only by `Project.conductorSlug`.

- **Conductor owns coordination:** lifecycle, priority, tasks, milestones, dependencies, claims,
  notes, gates, approvals, pitches.
- **Kind Robots owns presentation and application state:** title, description, routes, channel,
  tab, live/repo URLs, artwork, and all application data.
- Kind Robots stores Conductor coordination as a commit-stamped materialized read projection —
  a cache, never a second authority: UI actions emit a Conductor task
  event or pitch update, and completion is canonical only after the next sync returns that commit.
- Sync updates only status, priority, missing `conductorSlug` and `lastSyncedAt` on an existing
  row — except that a project Conductor marks retired (`ARCHIVED`) is set `isActive: false` and its
  `liveUrl`/`channelKey`/`tabKey` are cleared (`server/api/conductor/sync.post.ts`). Don't add new
  presentation values to Conductor's `project-overrides.yaml`.
- **Member apps** (Conductor `parent:`, e.g. the Daily Dream Workshop micro apps under `dream-cycle`)
  keep their own endpoint but never appear as first-tier projects: the home strip drops them and the
  public Projects page shelves them (`conductorStore.isMemberProject`). Keep them out of main nav.
- **Admin vs visitor:** opening a project sends an admin to its manage screen
  (`/conductor?project=<slug>`, `projectOpenHref`) and everyone else to the project itself.
  `/api/conductor/projects` redacts task notes, gates, owners and Silas's notes for non-admins.
- Surfaces that need only progress use `GET /api/conductor/progress` (via
  `conductorStore.fetchProgress()`), not the full `/api/conductor/projects` projection.

## Formatting and verifying

Keep the repo-wide Prettier ratchet: **never weaken it or re-record its baseline to go green.**
Run `npm run format:changed` before opening or updating a PR (connector-only edits: apply the
`Changed-file Prettier` check's suggested patch). Typecheck and run the tests that cover what you
touched. Don't weaken, skip or delete a legitimate test to manufacture a pass; if a check is red
for reasons that predate your change, say so explicitly. Hook mechanics:
[`docs/agent-standards-detail.md`](docs/agent-standards-detail.md).

## Searching this repo

`prisma/generated/` (~17MB of generated client), `stats.html` (bundle report), `artifacts/` (audit
output) and `package-lock.json` are listed in `.ignore`, so ripgrep-based search skips them. Search
them explicitly (`rg -uu <pattern> <path>`) only when that's what you need. Game-content JSON
(`utils/crystalStreet/`, `utils/shiftingLands/`, …) stays searchable — but read it by `grep -n`
range, not whole.
