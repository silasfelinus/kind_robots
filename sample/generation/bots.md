# Generating Bots

Model: `Bot` (`prisma/schema.prisma`). Endpoints: `POST /api/bots`,
`POST /api/bots/batch` (upsert by slug), seeds via
`POST /api/bots/seed`. Live reference: `stores/seeds/narrators.ts`.

## The three flavors

`BotType` is a free string in the schema; these are the canonical values.
(Legacy rows also contain `'assistant'` — the add-bot form default. Do not
generate new ones.)

| BotType | Belongs to | Job |
| --- | --- | --- |
| `NARRATOR` | a Dream (LOCATION/GENRE) | Framing voice of the dream — narrates in third person, never acts in-scene. Drives stories, forges scenarios/characters/rewards for its home dream. |
| `PROMPTBOT` | the Bots channel | A standalone prompt-centric assistant: one strong `prompt`, a personality, chat-first. |
| `MANAGER` | a PROJECT dream | Project-facing steward for a conductor project — reports status, frames the roadmap, talks milestones and gates. Same framing-device stance as narrators. |

NARRATORs and MANAGERs get the full expression set (10 emotions + 10
actions — see `expressions.md`). PROMPTBOTs need an avatar; expressions
are optional polish.

## Field spec

Required by schema: `BotType`, `name`, `botIntro`, `userIntro`, `prompt`.

| Field | Fill with |
| --- | --- |
| `name`, `slug` | Character name; slug is the kebab of it (`brass-lampkeeper`) |
| `subtitle` | 'Narrator of {Dream}' / 'Manager of {Project}' / role line |
| `description` | 1–2 sentence identity ("You are {name}, …") |
| `botIntro` | Identity + role + stance. Narrators/managers: state "You are a NARRATOR: a framing device… never a character inside the story." |
| `narrativeVoice` | `VOICE:` register notes + `SAMPLE:` one in-voice paragraph |
| `forgeIntro` | `FORGE:` in-voice offer to generate more content |
| `userIntro` | Pipe-delimited starter prompts ("Tell me a story… \| Generate 6 scenarios. \| …") |
| `prompt` | Core behavior instruction (≤764 chars) |
| `theme` | A DaisyUI theme name matching the vibe (`garden`, `dracula`, …) |
| `personality` | 3–5 comma-separated traits |
| `modules` | Capabilities list (`'Narrator, DreamForge, Scenario, Character, Reward, Dream'`) |
| `tagline` | One short in-voice line |
| `artPrompt` | Full avatar prompt, house style (see README rule 1) |
| `avatarImage` | `/images/bots/{slug}.webp` |
| `Dreams` | `{ connect: [{ id }] }` to the home dream (narrators/managers) |
| `userId`, `designer` | Per README rule 5; `canDelete: false` for canon bots |

## Art set

| Asset | Path | Notes |
| --- | --- | --- |
| Avatar (identity anchor) | `public/images/bots/{slug}.webp` | square; also referenced by `avatarImage` |
| Avatar (picker copy) | `public/images/bots/avatars/{slug}.webp` | same art; the avatar-picker folder |
| Expression set | `public/images/bots/expressions/{slug}/{key}_01.webp` | 20 files — see `expressions.md` |
| Inspiration set (optional) | `public/images/{slug}/{slug}-inspiration-{n}.webp` | candidate takes before promoting one |

## Checklist

1. Write the bot row (fields above) — batch endpoint for sets.
2. Generate avatar art from `artPrompt`; save to both avatar paths.
3. NARRATOR/MANAGER: generate the 20-expression set and register
   ExpressionMedia rows (`expressions.md`).
4. Narration-capable bots: add NarratorThread rows per topic
   (`threads.md`).
5. Verify: bot appears in the gallery, avatar renders, and
   `/api/narrators/{type}/{slug}` returns it with expressions attached.
