# Generating Characters

Model: `Character`. Endpoints: `POST /api/characters`,
`POST /api/characters/batch`, LLM-assisted `server/api/characters/generate.ts`.

Characters are in-story people/creatures — unlike bots they act INSIDE
scenes. A character can still chat (via `Chats`) and can carry its own
expression media set.

## Field spec

Required: `name`. Always set: `slug`, `species`, `class`, `genre`,
`personality`, `backstory`, `drive`, `quirks`, `artPrompt`.

| Field | Fill with |
| --- | --- |
| `name`, `slug`, `honorific`, `title`, `role` | Identity; honorific defaults to `adventurer` |
| `species`, `class`, `gender`, `alignment`, `genre` | Casting sheet — mix humans, robots, creatures, and originals (inclusive by default) |
| `personality`, `quirks`, `drive`, `backstory` | The playable core: how they talk, what's odd about them, what they want, where they came from |
| `presentation` | Visual description referenced by art prompts |
| `charm/empathy/grace/luck/might/wits` | `Rarity` enum stats (`COMMON`→`MYTHIC`); default COMMON, spike 1–2 to fit concept |
| `experience`, `level` | 0 / 1 for fresh characters |
| `artPrompt` | Portrait prompt built from `presentation`, house style |
| `userId`, `designer` | README rule 5 |

Connect at generation time when part of a set: `Dreams` (home world),
`Scenarios` (cast membership — also mirror into `Scenario.cast` Json),
`Rewards` (signature items).

## Art set — characters get multiple art, by design

| Asset | Path / field | Notes |
| --- | --- | --- |
| Primary portrait | `public/images/characters/{slug}.webp`, referenced by `imagePath` (and/or `artImageId`) | the identity anchor |
| Portrait inspiration set | `public/images/{slug}/{slug}-inspiration-{n}.webp` | 3+ candidate takes; promote the winner; the folder is the character's ArtCollection |
| Expression set (optional but desired) | `public/images/characters/expressions/{slug}/{key}_01.webp` | mirrors the bot convention (`bots/expressions/…`); register via `ExpressionMedia.characterId` — see `expressions.md` |

The inspiration set is what lets a character be *given* avatar
expressions later: generate candidates into the slug folder, then an
expression pass edits the chosen portrait per key. Keep every
expression's `artPrompt` anchored to the same `presentation` text so the
face stays consistent across all 20.

## Checklist

1. Write the character row (batch for casts).
2. Generate portrait candidates into the inspiration folder; promote one
   to the canonical portrait path.
3. Optional expression pass: 10 emotions + 10 actions from the promoted
   portrait (`expressions.md`), rows keyed by `characterId`.
4. Verify: gallery card renders, portrait resolves, stats display, and
   mature-gating behaves (`isMature` rows hidden unless
   `userStore.showMature`).
