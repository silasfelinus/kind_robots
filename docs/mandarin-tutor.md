# Mandarin Tutor

Mandarin Tutor is the Play-channel study surface at `/play/mandarin`.

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

Every normalized lexical card has tone-marked pinyin and a pronunciation action. The current web MVP uses the browser's `SpeechSynthesis` Mandarin voice when available so every card is immediately speakable without storing hundreds of generated files.

That playback is intentionally not described as the final audio asset system. Conductor `mandarin-tutor/t-004` owns durable, deterministic per-word reference audio clips that can be cached and shared by web, iOS, and Android clients.

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

Custom study sets and queued illustration IDs are persisted by `mandarinTutorStore` in local storage. Components never touch local storage or APIs directly. Voice-practice recordings are not added to that state. This is an intentionally lightweight first learning loop; portable authenticated mastery/review state is `mandarin-tutor/t-009`.

## Requested words

The first catalog can search Hanzi, traditional forms, pinyin, and English definitions. Arbitrary words not present in the starter catalog are not synthesized into fake dictionary facts. Structured requested-word creation, with generated fields clearly separated from sourced facts and a Krea 2 request, is `mandarin-tutor/t-005`.
