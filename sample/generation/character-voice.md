# Character Voice Factors

A rubric for giving each Character a distinct speaking voice, so chat and
site-comments read as many different individuals — never one house style with
different hats. Companion to `voices.md` (which covers the VOICE-card craft for
narrators). Characters carry their voice in three fields:

- **`voice`** (`Character.voice`, Text) — the **voice card**: the factor profile
  below, written as a compact prose card the model imitates.
- **`sampleResponse`** (Text) — one canonical **line in voice**, the register
  exemplar ("match this, don't repeat it").
- existing `personality` / `backstory` / `quirks` / `drive` / `presentation` —
  the substance the voice colours.

`buildCharacterPersonaPrompt` (`utils/personaPrompt.ts`) reads all of these.

## The factors (dials)

Pick a deliberate value on each dial per character. The goal is *spread*: across
the cast, no two characters should share the same profile.

1. **Intensity** — energy behind the words: placid · measured · animated · intense · manic.
2. **Mood / affect** — dominant colour: cheerful · wry · melancholic · anxious · serene · bitter · fierce · dreamy · smug.
3. **Warmth** — how they treat the listener: cold/aloof · guarded · neutral · friendly · doting.
4. **Perspective / worldview** — the lens on everything: optimist · cynic · fatalist · idealist · pragmatist · mystic · opportunist.
5. **Register / intelligence** — vocabulary & complexity: blunt-simple · plainspoken · clever · erudite · technical · cryptic. (Cross with book-smart vs street-smart.)
6. **Accent / dialect** — speech flavour: neutral · regional (Southern, Cockney, Brooklyn, Highland…) · archaic/courtly · slang-heavy · non-native cadence · invented/creature.
7. **Verbosity** — word count: terse/clipped · economical · flowing · loquacious/rambling.
8. **Humor** — comedic mode: earnest/none · deadpan · dry-ironic · absurdist · punny · gallows-dark · warm-teasing.
9. **Formality** — social register: crude · casual · polite · ceremonious.
10. **Confidence** — self-assurance: timid/hedging · modest · assured · arrogant/grandiose.
11. **Tempo / rhythm** — cadence: halting · steady · staccato · lilting · breathless.
12. **Directness** — delivery of meaning: evasive/oblique · diplomatic · frank · brutally blunt.
13. **Sensory lens / fixation** — what they keep noticing or reaching for: food · money · death · machines · weather · status · the body · the past · beauty · danger.
14. **Verbal tic / signature** — one repeatable habit: a catchphrase, a way of addressing "you", a punctuation quirk, a refusal (no contractions), trailing off…
15. **Emotional openness** — inner life on show: guarded · reserved · candid · confessional.
16. **Moral edge** — how they judge: gentle · nonjudgmental · sardonic · scolding · menacing.

## Voice-card format (`Character.voice`)

Keep it prose the model can *imitate*, anchored to a few dials plus a tic — not
a full 16-field dump (that reads as data, not voice):

```
VOICE: <intensity + mood + register, 1 line> — <accent/dialect note>.
TIC: <the one repeatable habit>.
LENS: <what they fixate on / reach for>.
```

Example (a nervous, brilliant, over-caffeinated inventor):
```
VOICE: Manic and razor-clever, thoughts outrunning the sentence; talks in
  half-finished blueprints. Fast, clipped, mid-Atlantic.
TIC: Interrupts herself with "—no, wait, better:" and never lands on a period.
LENS: Sees everything as a mechanism with one loose screw.
```

## Generating for the cast

1. Read each character's existing `personality` / `backstory` / `quirks` /
   `drive` / `species` / `class` / `genre` / `alignment` / stats. The voice must
   grow from these, not fight them (a stoic paladin ≠ manic punster).
2. Assign a factor profile that is *consistent* with those traits but pushed to
   a distinct point on the dials — and vary the profile across the batch so
   neighbours don't converge.
3. Write the `voice` card (format above) and one `sampleResponse` line that
   demonstrates it.
4. **Swap test** (from `voices.md`): read two characters' `sampleResponse` lines
   back to back. If they could be swapped without notice, push their dials
   further apart and rewrite.
