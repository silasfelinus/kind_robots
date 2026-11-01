# Agent standards — full detail

> Moved verbatim from `AGENTS.md` on 2026-11-01 PT (token-essentialization pass). `AGENTS.md`
> keeps the condensed rule; this file holds the full text and history. If they disagree, `AGENTS.md`
> wins — fix this file. Sections: human commands, self-hosted production, deleting a component, project identity, formatting.

## Commands you hand a human start from a fresh window

Every command block written for Silas to run is copied into a shell you know nothing
about — a new PowerShell window, a fresh ssh session, a terminal that has been sitting
open on some other directory since yesterday. It is NOT a continuation of the block you
wrote three messages ago, and it is not a continuation of the one you wrote in the same
message either, because the useful ones get copied one at a time.

So every block is self-contained. Include the `cd`. Include the `git pull` if the block
needs code that was just pushed. Never open with `.\scripts\thing.ps1` or
`./scripts/thing.sh` and leave the working directory implied.

    # wrong -- fails from anywhere but the one directory you were picturing
    .\scripts\sync-comfy-models.ps1 -Tier core -Yes

    # right
    cd D:\code\kind_robots
    git pull
    .\scripts\sync-comfy-models.ps1 -Local D:\comfy\comfy-fast\models -Tier core -Yes

Silas, 2026-09-08, after this cost him two rounds: _"if I ran your commands 'from
ferngrotto' they would fail ... I'm missing a cd and git pull at minimum"_, and again:
_"don't assume that I'm going to be running commands immediately after the last message
from the same window."_

The same rule covers paths: write them for the shell he is actually in. `/d/code/...` is
Git Bash and means nothing to PowerShell, which resolves it against the current drive and
looks for `D:\d\code\...`. When the shell is unknown, ask or give the PowerShell form,
since Ferngrotto is Windows.

## Self-hosted production — merge is not deploy

Production is Alexandria/Unraid. A GitHub merge, a green workflow, and a published GHCR
image are **not** proof that production is running that code or that its migrations ran.
Keep these states distinct in every handoff: **merged → image published → deployed → schema
verified**.

- Alexandria scheduling is owned by the **Unraid User Scripts** plugin so it survives host
  restarts in the normal Unraid-supported way. The scheduled script should invoke
  `scripts/unraid-user-script.sh`, which refreshes a clean `main` checkout and delegates to
  `scripts/deploy-unraid.sh`.
- `scripts/deploy-unraid.sh` pulls the new image, runs that image's pending migrations with
  the isolated migration credential, and only then asks Unraid DockerMan to replace
  `KindRobots` from its saved template.
- **Do not tell Silas to use Force Update as the normal Kind Robots deploy step.** Force
  Update knows how to recreate the container but knows nothing about Prisma migrations.
- Any change to `prisma/schema.prisma` or `prisma/migrations/**` must be called out as
  **schema-affecting** in the PR/session handoff. Do not describe it as live merely because
  CI passed or the image was published.
- Automatic migrations run before the old container is replaced. Therefore routine
  unattended migrations must be backward-compatible with the currently running build during
  that handoff window. Additive migrations are the default. Destructive drops/renames that
  the old build still uses require an explicit staged rollout rather than ordinary auto-deploy.
- If the automatic Alexandria User Script is installed and healthy, routine schema changes
  do not require a separate human migration instruction. If automation is unavailable,
  broken, or not yet installed, give Silas the exact `bash scripts/deploy-unraid.sh`
  production command before calling the operational work complete.
- Never place `MIGRATION_DATABASE_URL` in the long-running application environment to make
  deployment easier. The elevated credential belongs only to the throwaway migration
  process documented in `docs/runbooks/migration-credential-boundary.md`.
- Read `docs/runbooks/unraid-auto-deploy.md` before changing the production container,
  migration wrapper, deployment scripts, image publication, or Unraid update behavior.

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

## Formatting changed files before CI

Keep the repo-wide Prettier ratchet: old formatting debt is grandfathered in,
but new unformatted files may never enter the baseline. **Do not weaken the
ratchet or re-record its baseline to make a PR green.**

After `npm install` / `npm ci` in a local checkout, the repo installs a
pre-commit hook that formats staged, Prettier-supported files and re-stages
those files. It refuses to touch partially staged files with additional
unstaged edits; stage or stash those edits first.

Before opening or updating a PR, run `npm run format:changed` and commit
the resulting formatting changes. Both the hook and fast check skip files already
listed as unformatted in the existing ratchet baseline, avoiding unrelated
whole-file formatting churn. `npm run format:check-changed` is the
read-only equivalent. Both select only new/modified files on the current
branch compared to `origin/main`, not the whole repository.

**Connector-only GitHub edits bypass local hooks.** Their author must use
the fast `Changed-file Prettier` PR check and apply its exact suggested
patch when red. That job reports the specific formatting diff without
waiting for the much slower full Contract Tests ratchet. The ratchet stays
required as the backstop; checking green on an earlier commit does not
prove a newer commit is green.
