# Generating Dreams

Model: `Dream`. Endpoints: `POST /api/dreams`, `POST /api/dreams/batch`.
Helper: `stores/helpers/dreamHelper.ts` (`parseDreamType` maps legacy
names — `VIBE` → `GENRE`, `DREAM` → `LOCATION`).

## The flavors

`dreamType` enum: `ART, BRAINSTORM, PROMPTBOT, NARRATOR, CHARACTER,
PROJECT, REWARD, SCENARIO, LOCATION, PITCH, GENRE, WISH` (default
`PITCH`). The three agents generate most often:

| dreamType | What it is | Extra obligations |
| --- | --- | --- |
| `LOCATION` | A place/world — the home of a narrator, cast, and stories | Gets a NARRATOR bot (`bots.md`) and usually an art collection |
| `GENRE` | A vibe/aesthetic that other dreams can inherit ("vibe" in older docs) | Link related dreams via `DreamRelation` (`IS_A`, `INSPIRED_BY`) |
| `PROJECT` | A conductor project mirror (`Dream.slug === projects/<slug>` dir name) | Fill the project block; gets a MANAGER bot; conductor sync owns creation — don't invent PROJECT dreams outside that flow |

## Field spec

Required: `title`. Always set: `slug`, `dreamType`, `description`,
`pitch`, `artPrompt`, `creationSource: 'AI'`.

| Field | Fill with |
| --- | --- |
| `title`, `slug` | Evocative title; kebab slug |
| `pitch` | The 1–3 sentence hook (the elevator version) |
| `description` | The expanded version — setting, vibe, conflicts, story fuel |
| `flavorText` | One quotable in-world line (≤512) |
| `examples` | Optional riffs/story seeds (LongText) |
| `artPrompt` | Hero/card prompt, house style |
| `icon` | `kind-icon:*` name |
| `designer`, `userId` | README rule 5 |

Project block (PROJECT only): `projectStatus` (`ACTIVE/PAUSED/DONE/
ARCHIVED/BRAINSTORM`), `priority` (`LOW/NORMAL/HIGH`), `goal` (what 100%
looks like, concretely), `waypoints` (pipe-delimited steps; `✓ ` prefix =
done, `~ ` = in progress), `repoUrl`, `liveUrl`.

Relations worth setting at generation time: `ArtImage`/`artImageId`
(primary image), `artCollectionId` (primary collection), `Characters`,
`Bots`, `Rewards`, `Scenarios` connects when generating a themed set, and
`DreamRelation` edges (`IS_A`, `APPEARS_IN`, `RELATED`, `INSPIRED_BY`)
instead of duplicating lore across rows.

## Art set

| Asset | Path / field | Notes |
| --- | --- | --- |
| Card | `cardPath` (512×768) | portrait key art |
| Hero | `heroPath` (1280×720) | banner |
| Primary image | `imagePath` / `artImageId` | the one image if only one exists |
| Art collection | `public/images/artcollections/{slug}/` | `{slug}-inspiration-{n}.webp` + `gallery.json`; set `artCollectionId` |

A generated LOCATION ships as a bundle: the dream row + card/hero art +
its NARRATOR bot + (optionally) starter scenarios, characters, and
rewards connected to it. A PROJECT dream additionally gets a PitchSheet
(`pitchsheets.md`).
