# Generating Expression Media

Models: `ExpressionMedia` (+ `ExpressionTransition`). Endpoints:
`POST /api/bots/expressions`, `POST /api/bots/transitions` (batch
upserts, CHUNK_SIZE 25, accept `dryRun: true`). Video generation via
`server/api/comfy/ltx/` (image2Video / FLF2V).

One row per (owner, expressionKey), where the owner is a Bot OR a
Character. `NEUTRAL` is the canonical generated avatar; the owner's
`artImageId` portrait stays the identity anchor.

## The canonical set — 20 per owner

Every NARRATOR and MANAGER bot gets the full set; characters get it when
promoted to chat/stage use. From the `Expression` enum:

- **10 emotions** (`kind: EMOTION`, face-only edits, body/framing locked):
  `NEUTRAL, JOYFUL, SORROWFUL, AFRAID, DISGUSTED, ENRAGED, SURPRISED,
  ANXIOUS, PROUD, LOVING`
- **10 actions** (`kind: ACTION`, pose/state edits):
  `LAUGHING, CRYING, SLEEPING, THINKING, SHRUGGING, WINKING, FACEPALMING,
  CHEERING, WHISPERING, SHOUTING`
- `CUSTOM` is the escape hatch for freeform actions (`expressionKey` is
  then a freeform slug like `backflip`).

## Field spec

| Field | Fill with |
| --- | --- |
| `expression`, `kind` | Enum value + EMOTION/ACTION |
| `expressionKey` | Lowercase enum name (`"laughing"`) or custom slug — always set, matches the filename |
| `botId` XOR `characterId` | The owner |
| `imagePath` | Still: see file convention below |
| `videoPath` | Optional looping reaction clip (animated webp/mp4) |
| `label`, `emoticon` | Display name + emoji |
| `message`, `additionalPhrases` | Optional in-voice line(s) the owner can say when striking this expression |
| `artPrompt` | The edit prompt used — REQUIRED for regeneration |
| `designer` | README rule 5 |

## File conventions

| Owner | Path |
| --- | --- |
| Bot stills | `public/images/bots/expressions/{slug}/{key}_01.webp` |
| Character stills | `public/images/characters/expressions/{slug}/{key}_01.webp` (mirror of the bot convention) |
| Reaction videos | same folder, `{key}_loop.webp` |
| Transitions | same folder, `{from}_to_{to}.webp` |

`{key}` is the lowercase `expressionKey`; `_01` allows numbered variants —
extra takes stay in the folder as `_02`, `_03` (the row points at the
promoted one). Square (1:1), consistent framing across the whole set.

**Consistency rule:** all 20 stills derive from the owner's promoted
portrait with the same `presentation`/identity language in every
`artPrompt`. EMOTION edits change the face only; ACTION edits may change
pose. A set where the character drifts between takes is a failed set.

## ExpressionTransition (optional polish)

Directed clips `fromKey -> toKey` for the same owner (`videoPath`,
`fps` 16, unique per (owner, fromKey, toKey)). The frontend falls back to
the static still when no transition row exists, so generate transitions
lazily — the high-value pairs are `neutral -> *` and `* -> neutral`.

## Checklist

1. Generate the 20 stills from the promoted portrait into the owner's
   expressions folder.
2. `dryRun: true` the batch to `/api/bots/expressions`; then write rows
   with `imagePath`, `label`, `emoticon`, `message`, and `artPrompt`.
3. Do NOT create an ArtImage row per expression — `imagePath` on the
   ExpressionMedia row is enough; `artImageId` is reserved for stills
   that need full ArtImage provenance (the NEUTRAL avatar, typically).
4. Verify: the narrator screen swaps expressions, and unknown keys fall
   back to NEUTRAL.
