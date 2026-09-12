# Storybook and Taskmaster: the boundary, and what replaced it

**Superseded 2026-09-12.** This document used to open with the sentence "This boundary is
intentional and permanent" and then list permanent implementation invariants, including that
Taskmaster's store and state machine remain separate from Storybook's. That is no longer the
plan of record.

Silas, 2026-09-12: *"Stories should be able to be selected as open-ended (endless mode), episodic
(scenario based), structured (da Vinci mode), and taskmaster (we should work taskmaster into this
project as well, removing the taskmaster route when done)."*

**Taskmaster is becoming the fourth mode of Storybook, not a second product.** The page is kept at
its original path so nothing linking here dies, and because the second half of it — the safety
rules — is still in force and is the harder half to get right.

Plan of record: Conductor `projects/storybook/roadmap.yaml`, milestone **m9 "Taskmaster absorbed"**
(t-043 through t-047). The product spec is `projects/storybook/docs/storymaker-redesign.md`.

## What changed

Storybook stopped being a beat loop in the reader's browser. A story is now a server-side run: one
row, a deck of predetermined endings, a bounded turn loop, a bible snapshot, an inventory and a
server-held pending turn (`server/utils/storybookRuns.ts`). That is the same architecture
`stores/taskmasterStore.ts` hand-rolled on the client — a session, a checkpoint plan, real hooks,
and write-backs — so keeping two of them is now duplication rather than separation.

| Was | Is |
| --- | --- |
| Two products, two stores, two state machines | One engine, four modes: open-ended, episodic, structured, taskmaster |
| Taskmaster owns a `taskmaster-session` localStorage key | A story run row, resumable on any device |
| Checkpoints are a client-side plan | Checkpoints are turns |
| Projects and HONEYDOs are "real hooks" | Real work is dealt into the Thread slot as cards |
| `/taskmaster` is the sole task-story route | `/taskmaster` redirects to `/storybook`, the way `/play/davinci` does (t-047) |

Da Vinci went through this same merge three days earlier and became the `life` shape — now the
**structured** mode — of the same engine. Its boundary document got exactly this treatment:
rewritten in place, path kept.

Taskmaster's three CI guards — `verifyTaskmasterCheckpointEngine.mjs`,
`verifyTaskmasterSampleTasks.mjs`, `verifyTaskmasterSessionStorageRecoveryGuard.mjs` — are
**rewritten against the new surface, never deleted**. They pin the checkpoint engine, the sample
tasks, and the storage recovery path, and the merge has to keep all three true.

## Rules that survive the merge

These were never about product separation. They are what makes a story safe to point at real work,
and they bind the Taskmaster mode exactly as they bound the Taskmaster product. Conductor
`storybook/t-045` carries them; a regression here is a correctness bug, not a UX nit.

- **A story answer is a proposal until the reader explicitly applies it.** Nothing a narrator writes
  lands on a real project or todo on its own. The apply step is separate, explicit, and the reader's.
- **The real objective stays visible beside the fiction.** The turn payload keeps the objective
  structurally distinct from the prose — a field, not a paragraph — so the screen can always show
  what is actually being worked on.
- **Conductor roadmap YAML is never modified by a story answer.** No exceptions, no "just the status
  field", no indirection through an API that happens to write it.
- **A story must never look like it silently edited a task list.** If a proposal was not applied, the
  fiction must not narrate it as done.

## Serendipity name

The former task-story product was renamed completely to Taskmaster, leaving the Serendipity name and
route free for the voice-led experience. That rename stands; absorbing Taskmaster into Storybook does
not reopen it.

- `/taskmaster` is the sole task-story product route until t-047 retires it in favour of `/storybook`.
- `/serendipity` is the sole Serendipity product route and hosts the voice-led experience.
- `/serendipity-voice` must not remain as a route, redirect, alias, compatibility page, content slug,
  component identity, or dashboard key.
- The separate voice-relay repository and internal integration types may retain `serendipity-voice`
  only where they specifically name that relay subsystem.
- Obsolete Serendipity task-story files remain deleted after their Taskmaster replacements are wired.

The application is still in alpha. Temporary development paths are not compatibility contracts.

## Automatic art direction

Storybook does not ask the reader to choose an art engine, model, sampler, scheduler, step count,
CFG, denoise value, or dimensions. This applies to every mode, Taskmaster included.

Product code selects a centralized narrative art profile and derives the prompt from:

- product identity
- genre, setting, mood, theme, style, and art-direction Facets
- active characters and locations
- current narrative milestone
- intended display surface
- cost and mana constraints

The default narrative profile uses the existing Krea 2 art path with four generation steps. The
profile is centralized so model and numerical tuning do not leak into product setup UX.

Illustrations are reserved for meaningful moments: opening, chapter or major location changes,
important character introductions, pivotal events, and finales. Generation is asynchronous and
persisted; rendering a page must never enqueue duplicate art.
