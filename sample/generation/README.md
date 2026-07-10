# Generation framework — auto-creating Kind Robots objects

Spec sheets for the primary objects that agents (or Silas) may generate
automatically, grounded in `prisma/schema.prisma`. Each sheet says what a
finished, shippable object looks like: required fields, house voice, the
art it is presumed to include, file conventions, and the endpoint that
accepts it. `sample/README.md` covers wiring a NEW model; this folder
covers generating INSTANCES of the models we already have.

## The specs

| Object | Spec | Variants |
| --- | --- | --- |
| Bot | [`bots.md`](./bots.md) | NARRATOR (dreams), PROMPTBOT (bots), MANAGER (projects) |
| Dream | [`dreams.md`](./dreams.md) | LOCATION, GENRE (a.k.a. vibe), PROJECT (+ full enum) |
| Character | [`characters.md`](./characters.md) | includes portrait + expression art |
| Reward | [`rewards.md`](./rewards.md) | by `rewardType` and `rarity` |
| Scenario | [`scenarios.md`](./scenarios.md) | by `outputType` |
| Narration threads | [`threads.md`](./threads.md) | NarratorTopic + NarratorThread |
| Expression media | [`expressions.md`](./expressions.md) | 10 emotions + 10 actions, stills/video/transitions |
| PitchSheet | [`pitchsheets.md`](./pitchsheets.md) | includes artist mockup |

## Universal rules (apply to every generated object)

1. **Art is presumed.** Every generation includes its desired art, not just
   text. At minimum, fill `artPrompt` on the object (house style: subject,
   staging, "adult animated cartoon style", palette, "crisp clean
   linework, no text"); then either generate the image through the art
   pipeline or queue it in conductor's `projects/art-prompts.yaml`. Never
   ship an object with an empty `artPrompt` — that image can then never be
   regenerated. Missing image files never block: the UI falls back to
   placeholders.
2. **Standard art sizes:** icon 256×256, card 512×768, hero 1280×720,
   avatars and expression stills square (1:1). All webp.
3. **Provenance.** Set `creationSource: 'AI'` where the field exists
   (Dream, Prompt), set `designer` to the generating agent/pipeline name,
   and keep the prompt/model/seed metadata needed to recreate or delete
   the image (AGENTS.md generated-art rule).
4. **Flags.** `isPublic: true`, `isActive: true`, `isMature: false` unless
   the content genuinely warrants otherwise. Mature content must be
   flagged, never smuggled.
5. **Ownership.** System-generated canon uses `userId: 1` and
   `designer: 'silasfelinus'` (matching existing seeds); user-requested
   generations belong to the requesting user. Guest/system fallback id
   is `10`.
6. **Slugs.** Lowercase kebab, globally unique per model. A slug is also a
   folder name: an object's inspiration set lives at
   `public/images/{slug}/` (or `public/images/artcollections/{slug}/` for
   dream parity collections), tracked by a `gallery.json` manifest — the
   folder IS the ArtCollection.
7. **Inspiration sets.** When generating multiple candidate images for one
   object (portrait options, expression candidates, mockup variants), put
   them in the slug's inspiration folder as
   `{slug}-inspiration-{n}.webp` and promote the winner to the canonical
   path. This is how characters can be handed avatar/expression options
   instead of a single take.
8. **Endpoints.** All writes go through the API (never raw SQL):
   single-object `index.post.ts`, bulk `batch.post.ts` with
   `created/skipped/failed` and 207 on partial success. The expression and
   thread batch endpoints accept `dryRun: true` — use it to validate a
   payload before writing. Auth via `validateApiKey` (`KR_API_TOKEN` for
   agents).
9. **Never overwrite silently.** Batch endpoints upsert by slug/unique
   key; if a generation would replace an existing image file, the old file
   moves to the slug's inspiration folder first (conductor
   `distribute_images.py` behavior — mirror it when writing files
   directly).
10. **Voice.** Kind Robots copy is playful, kind, and specific — see any
    `narrative:` in `stores/helpers/dashboardHelper.ts` or the narrator
    seeds in `stores/seeds/narrators.ts` for register. Generated text that
    reads like beige LLM filler gets rejected in review.
