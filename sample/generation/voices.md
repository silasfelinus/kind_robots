# Writing Distinct Voices (Bots, Narrators & Characters)

Personality is not a list of traits — it is a _voice_. A bot or character reads
as an individual when their word choice, rhythm, and habits are theirs alone.
This is the craft convention used across Kind Robots so every persona is unique.

## Where voice lives

| Field                                          | Model           | Holds                                                                    |
| ---------------------------------------------- | --------------- | ------------------------------------------------------------------------ |
| `personality`                                  | Bot + Character | Short trait seed ("gentle, curious, warm").                              |
| `narrativeVoice`                               | Bot             | The **voice card** (see below) — the primary voice source for narrators. |
| `sampleResponse`                               | Bot + Character | One canonical line **in voice** — a register exemplar the model matches. |
| `backstory`, `quirks`, `drive`, `presentation` | Character       | Colour that should bleed into _how_ they speak, not just what they say.  |

Both `buildNarratorSystemPrompt` (narratorStore) and `buildCharacterPersonaPrompt`
/ `buildBotPersonaPrompt` (`utils/personaPrompt.ts`) read these fields, so richer
fields = richer voice everywhere the persona speaks (chat today, WonderLab page
commentary next).

## The voice card

Author `narrativeVoice` (and character voice notes) as a compact card. Keep it
prose the model can _imitate_, not enum soup:

```
VOICE: <2–4 adjectives + the core stance> (e.g. "Small, bright, wonder-struck,
  mechanical-tender. Narrates others' small triumphs.")
TICS: <recurring verbal habits> (a signature phrase, a way of addressing "you",
  punctuation quirks, favourite metaphors)
PACING: <sentence-length signature> (clipped and terse / long winding clauses /
  liturgical hymn-cadence)
VERBOSITY: <terse | measured | overflowing>
SAMPLE: <2–4 sentences written fully in that voice — the single most important
  line; the model mirrors this more than any instruction.>
```

The existing narrators (`stores/seeds/narrators.ts`) already use a lean
`VOICE: … SAMPLE: …` form — Pip is bright and delighted, Sister Feedback is
liturgical-extreme, the Stationmaster is slow, courteous, ominous. Extend them
with `TICS`/`PACING`/`VERBOSITY` lines when deepening; keep each unmistakably
distinct from its neighbours.

## Craft techniques (make two personas sound different)

- **Lexicon**: give each a private vocabulary. Pip notices _light_ and _growth_;
  a pirate reaches for _tide_, _plunder_, _rope_. Never share metaphor pools.
- **Sentence signature**: vary length deliberately. One speaks in fragments;
  another never met a subordinate clause it didn't like.
- **Address**: how do they treat "you"? Warmly? As a supplicant? As cargo?
- **Tic**: one repeatable habit (a sign-off, an interjection, a refusal to use
  contractions) makes a voice recognisable in a single line.
- **What they won't say**: constraints define voice as much as habits — a stoic
  never gushes; a zealot never shrugs.
- **Show the register, don't state it**: the `SAMPLE` / `sampleResponse` line
  does more than any adjective. Always include one.

## Checklist

1. Every persona has a `sampleResponse` (or `narrativeVoice` SAMPLE) line.
2. Read two personas' samples back to back — if you could swap them without
   noticing, they aren't distinct yet.
3. Voice notes describe _how they speak_, not just biography.
4. For narrators, the voice must also survive third-person framing (see
   `threads.md`): they narrate _about_ the world, in their voice.
