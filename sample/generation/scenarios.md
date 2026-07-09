# Generating Scenarios

Model: `Scenario`. Endpoints: `POST /api/scenarios`,
`PATCH /api/scenarios/batch`. Parser: `stores/helpers/scenarioHelper.ts`.

Scenarios are playable story settings: the user picks an intro, then
continues via skill checks, inventory, rewards, or custom prompts while
the narrator turns choices into consequences.

## Field spec

Required: `title`, `description`, `intros`, `userId`.

| Field | Fill with |
| --- | --- |
| `title`, `slug` | Adventure title; kebab slug |
| `description` | Player-facing setup — where you are, what's at stake |
| `intros` | **JSON string array.** Each entry is one opening, formatted `"TITLE IN CAPS: opening scene text…"` (see `splitIntro`). 3–6 intros per scenario. Newline-delimited text is tolerated by the parser; JSON array is canonical. |
| `locations` | Named places within the scenario |
| `genres` | Comma-separated genre tags |
| `inspirations` | Source vibes ("Treasure Planet by way of…") |
| `secretNotes` | GM-only twists the narrator may deploy — never shown to players |
| `cast` | Json of featured characters; also `Characters` connect |
| `difficulty`, `tier`, `group` | Optional tuning knobs |
| `outputType` | `STORY` (default) — or `ART / CHARACTER / REWARD / DREAM / SCENARIO / MIXED` when playing it is meant to *produce* another object |
| `artPrompt` | Key-art prompt, house style |
| `designer` | README rule 5 |

Connect: `Dreams` (home world), `Characters` (cast).

## Art set

| Asset | Path / field | Notes |
| --- | --- | --- |
| Key art | `imagePath` / `artImageId` (512×768 card or 1280×720 hero) | one per scenario |

## Checklist

1. Write the scenario with 3–6 titled intros as a JSON array string.
2. Connect the home dream and any cast characters (mirror into `cast`).
3. Generate key art from `artPrompt`.
4. Verify: intros parse (`parseScenarioIntros`), choice selector shows
   them, and the scenario is playable end-to-end in `/stories`.
