# Mandarin Tutor

Mandarin Tutor is the Play-channel study surface at `/play/mandarin`, with a per-word
tutorial page at `/play/mandarin/learn/<cardKey>`.

## Teach first, drill second (m5)

Silas reopened the project on 2026-09-19 asking for an evolution of the flashcard
trainer: _"a tutorial page for each of the words that we teach, and a system where we only
show flashcards after showing the instruction that shows the pinyin plus what each aspect
represents, with historical info ... a point system."_ Milestone m5 is that inversion. The
character data described under "Character-analysis rule" below was always good; it was
simply shown **after** the drill, behind a collapsed "Parts & history" panel.

`utils/mandarinLesson.ts` is the derivation and is deliberately pure — a `MandarinCard`
plus the rest of the catalog in, a `MandarinLesson` out, no database and no network — so
the teaching layer is testable by `npm run test:mandarin-lesson`. It produces:

- **pinyin anatomy** per syllable (initial, final, tone number, tone contour, a
  plain-language description of the pitch movement, and third-tone sandhi where it
  applies);
- **component roles** rendered as complete sentences that say what each piece _does_ and,
  equally, what it does _not_ claim;
- **the phonetic series** — other catalog cards built on the same sound component. 青
  gathers 请/清/情/晴; 兑 gathers 说 shuō and 税 shuì. A family whose readings have drifted
  apart is flagged as `drifted` rather than hidden, because the drift is the history
  showing through: the sound component records how a character sounded when it was
  coined, not how it sounds now;
- **homophone groups**, split into identical-reading and same-syllable-different-tone, and
  kept structurally separate from the sound families. A shared modern reading is a
  coincidence of pronunciation, never evidence that two characters are related, and the
  UI must not let the two blur together;
- **a `teachability` verdict.** A card whose only pieces are unasserted structural leaves
  is reported as `vocabulary`, not padded out with an invented story.

The honesty rule below is not softened by the lesson layer — it is enforced by it. Nothing
in a lesson is a mnemonic. Every claim is either something the pinned source asserted or a
mechanical fact about the pinyin string, and where the source is silent the lesson says so
in as many words.

`GET /api/mandarin/lessons/[key]` is unauthenticated and cacheable, like
`GET /api/mandarin`: a lesson is public reference material derived from the pinned public
catalog, and it should render for a signed-out visitor.

## Points and the soft gate

`MandarinLessonProgress`, `MandarinPointEvent` and `MandarinLearnerProfile` carry the
learner's comprehension and score. The points upgrade deliberately does **not** add a
column to `User`: that model already carries `questPoints`, `karma`, `mana`, `tokens` and
`earnedTokens`, and a sixth global balance owned by one study surface would collide with
the kind-economy ledgers. A study score belongs to the study domain, behind the same plain
`userId` ownership scalar every other Mandarin model uses.

`server/utils/mandarinPoints.ts` owns all of the arithmetic and is pure, so the scoring
model can be read and argued with rather than reverse-engineered:

- reading a lesson through pays a fixed amount, **once per card, ever**;
- a recall pays `base(rating) × dueFactor × lapseFactor × maturityFactor`;
- `hard` beats `good` beats `easy`, because a card recalled with effort was closer to
  being forgotten and pulling it back is where the learning happened;
- `again` pays zero and nothing is ever deducted — a system that punishes an honest
  "Again" teaches people to press "Good" when they did not remember, which corrupts the
  schedule the whole trainer runs on;
- `dueFactor` scores a review against how much of its scheduled interval actually elapsed.
  That is the anti-grinding rule: sitting on one easy card and re-rating it pays the
  1-point floor, while the same card actually due pays its full value. Reviewing late caps
  at 1 rather than paying a bonus, so neglecting the deck is never rewarded either.

The learn-before-drill gate is **soft**, by Silas's explicit choice. Cards whose lesson has
been read sort to the front of the study queue; cards that have not sort to the back and
carry a "Learn this one first" prompt. Nothing is ever withheld, and for a learner with no
completed lessons the partition is a no-op, so a fresh account never faces an empty deck.

**Do not add streaks, daily targets, or notification nudges here.** Silas ruled them out by
name when reopening the project — _"I don't want to recreate duolingo, as that is both
insistent and focused on interactions, notifications, nudges"_ — and
`MandarinLearnerProfile` deliberately carries no streak and no last-active field, because a
schema that quietly provides the column is how the mechanic gets added later by accident.

## Current foundation

The starter catalog normalizes the inclusive new-HSK level 1 and level 2 data from `jelleverheyen/hsk-vocabulary`, pinned to commit `a66fd30b9580da2c2af7eb19e4b9d8099a29c061`. The API refuses to serve the catalog if fewer than 500 unique usable cards survive normalization.

The upstream dataset provides simplified forms, traditional forms, pinyin, meanings, radicals, frequency, parts of speech, and classifiers. Kind Robots overlays curated study-set membership and a small practical vocabulary layer for categories that should not depend on an exam list, especially animals, colors, and casino language.

The upstream repository and its source/attribution information remain the provenance authority for imported dictionary data. Do not strip provenance when the catalog is later vendored or moved into the database.

## Character-analysis rule

The UI deliberately distinguishes:

- semantic components;
- phonetic components;
- dictionary/indexing radicals;
- uncertain or not-yet-sourced historical analysis.

A radical is never presented as a complete etymology merely because the dictionary indexes the character under it. Cards without a vetted decomposition say so instead of generating a mnemonic and labeling it history.

The first hand-checked starter analyses cover a few high-value semantic-phonetic patterns such as `说`, `妈`, `请`, `清`, and `河`. A broader sourced decomposition/history dataset is Conductor `mandarin-tutor/t-003`.

## Pronunciation playback

Every normalized lexical card has tone-marked pinyin and a pronunciation action backed by a durable shared reference-audio contract.

`POST /api/mandarin/audio` accepts only a catalog `cardKey`. It resolves the sourced/curated card server-side, derives a deterministic SHA-256 identity from the Hanzi, pinyin, provider, pinned synthesis model, voice, format, and recipe version, then either returns the existing asset or creates it once. The current recipe uses the pinned OpenAI `gpt-4o-mini-tts-2025-12-15` snapshot with the `marin` voice and MP3 output. The generated bytes and full synthesis provenance live in `MandarinAudioAsset`; immutable clips are served from `GET /api/mandarin/audio/:id` with long-lived caching.

This is lazy materialization, not “browser TTS dressed up as persistence.” A card that has not been heard yet has a stable audio identity and creates its shared clip on first use; subsequent web or future native clients reuse the same stored bytes without another synthesis request. Recipe changes intentionally produce a new immutable identity so corrected pinyin or future voice direction can coexist with older cached assets safely.

The browser's Mandarin `SpeechSynthesis` voice remains only as a graceful fallback when durable generation is temporarily unavailable or a browser blocks delayed playback after the first asynchronous cache fill.

## Voice practice and correction

The study card also has a record → transcribe → compare → retry loop.

- The browser records a short microphone attempt with `MediaRecorder`.
- `POST /api/mandarin/pronunciation` accepts that authenticated multipart audio and forwards it to the configured OpenAI transcription service using `gpt-4o-mini-transcribe` with Mandarin language selection.
- The endpoint intentionally **does not send the target Hanzi or pinyin as an ASR prompt**. “What I heard” is therefore an independent recognition signal rather than a target-biased autocorrection.
- Kind Robots does not persist the learner's recording. The browser keeps only the current object URL for replay; changing cards or leaving the component drops it.
- Broad tone-shape analysis happens locally in the browser. `mandarinToneAnalysis.ts` reuses the Music Mentor YIN pitch detector rather than introducing a second pitch algorithm.
- Tone feedback is deliberately modest: level, rising, falling, dipping, mixed, or insufficient pitch. It handles the common 3 + 3 third-tone sandhi case and avoids a fake numerical “pronunciation score.”
- Recognition evidence and acoustic evidence remain separate. A transcript mismatch is an intelligibility clue, not proof that a particular consonant or vowel was wrong; a pitch-shape match likewise does not prove the whole pronunciation was native-like.

The MVP uses equal voiced-span syllable partitioning for multi-syllable tone guidance. Forced alignment, phoneme-level consonant/vowel assessment, richer tone-sandhi modeling, and persistent personal pronunciation diagnostics belong in the next pronunciation-depth task rather than being implied by this first pass.

## Art

A learner can queue a private Krea 2 illustration for the current card. The store calls the existing durable `/api/art/enqueue` path with `projectSlug: mandarin-tutor`; the prompt asks for the concept only and explicitly forbids generated text or Chinese characters.

The MVP remembers queued ArtJob IDs locally. Durable card-to-ArtImage attachment and batch coverage are tracked by `mandarin-tutor/t-005` and `t-010`. Do not create a second render queue.

## Learner state

Custom study sets and queued illustration IDs are persisted by `mandarinTutorStore` in local storage. Components never touch local storage or APIs directly. Voice-practice recordings are not added to that state. Reference pronunciation audio is shared curriculum media rather than learner state. This is an intentionally lightweight first learning loop; portable authenticated mastery/review state is `mandarin-tutor/t-009`.

## Requested words

The first catalog can search Hanzi, traditional forms, pinyin, and English definitions. Arbitrary words not present in the starter catalog are not synthesized into fake dictionary facts. Structured requested-word creation, with generated fields clearly separated from sourced facts and a Krea 2 request, is `mandarin-tutor/t-005`.
