# Da Vinci play-loop API

The app-owned durable-state substrate for a life run: create a run, record
choices that move stats, read a run back, then resolve it into its ending.
AI narration (prose, choices, art prompts) is a separate layer that calls
these — it never owns state. All endpoints require an authenticated user
(`requireApiUser`) and enforce run ownership.

Outcome math and the resolve/award flow live in `server/utils/davinci.ts`
alongside the play-loop helpers (`createLifeRun`, `recordLifeChoice`,
`getLifeRunForUser`).

## Endpoints

### `POST /api/davinci/runs`

Create a new run for the caller. Starts `ACTIVE` at chapter 1.

Body: `title` (required). Optional: `seed` (auto-generated if omitted),
`protagonistName`, `genre`, `currentChapter`, and link ids `characterId`,
`dreamId`, `botId`, `artCollectionId`.

→ `201` with the created `LifeRun`.

### `GET /api/davinci/runs/:id`

Read a run for resume: includes `Stats` (key order), `Choices` (chapter
order), and the linked `Ending` once resolved.

→ `200` with the run. `403` if not the owner, `404` if missing.

### `POST /api/davinci/runs/:id/choices`

Record a choice and apply its stat effects atomically. Only `ACTIVE` runs
accept choices.

Body: `chapter` (positive int), `prompt`, `choiceText` (required);
optional `resultText`, `chatId`, and `effects` — a `{ statKey: intDelta }`
map applied to `LifeStat` via upsert-increment. The choice's `chapter`
advances the run's `currentChapter` when greater. `effects` are also stored
on the `LifeChoice` row for audit.

→ `201` with `{ choice, stats }`. `409` if the run is not `ACTIVE`,
`403`/`404`/`400` as above.

### `POST /api/davinci/runs/:id/resolve`

(Existing — davinci/t-009.) Resolves accumulated stats into the 10-bit
`outcomeKey`, marks the run `COMPLETE`, and awards the linked Achievement +
LifeAchievement once per user.

## Stat model

`effects` keys are arbitrary `LifeStat` keys; deltas may be negative. The
resolver reads only the ten `DAVINCI_DIMENSIONS` (a dimension passes at
value ≥ 1), so a choice can track extra stats without affecting the ending
math. A dimension with no stat row fails by default.

## Where this sits

This is the engine behind Storybook's `life` shape. The two products merged on
2026-09-09 (Silas: _"merge the projects ... a solid single interface that is a
stylish and effective storymaker with many endings"_), so there is one route,
one setup screen, and one story library; the reader picks the shape and this
engine runs when they pick a life.

The play loop still owns its own `Life*` models. That is a statement about what
they encode — ten dimensions resolving to one of 1,024 pre-seeded endings, which
the beat loop has no equivalent of — not a separation between products.
Storybook seeds a run from the Character and LOCATION Dream chosen on the setup
screen, through the FK columns `createLifeRun` already accepts.
