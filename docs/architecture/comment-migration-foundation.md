# Comment migration foundation

WonderLab is retired. Its archived Bot and Character commentary is source material for voice, not a queue of pairings that must survive.

## Current transition pass

Generate fresh first-party comments only for low-stakes objects:

- ~~Resources~~ — deferred, see below
- Rewards
- Facets

Do not generate transition comments for Dreams, Scenarios, Bots, or Characters. Those get later bespoke, ecosystem-aware passes.

### Phase one is Rewards and Facets

Resources are deferred, on evidence rather than preference. The census
(`docs/architecture/comment-census.md`) found:

- production exposes **zero** publicly visible Resource rows — every one is `isPublic: false`;
- `Resource` is the only one of the three models with no `allowReviews` column;
- `Resource` has no Character or Facet relations, so object-first casting has nothing to
  rank on but raw text.

Whether a private LoRA or checkpoint deserves in-world commentary is a product question, and
it should be answered before anything is built for it. `buildCommentDraftPrompt` still accepts
`RESOURCE` — the boundary that matters is enforced where the work happens, in the calibration
contract, which rejects any target that is not a Reward or a Facet.

## How casting works

Object first, every time. `utils/comments/commentSignals.ts` computes four signals from real
data and `rankCommentSpeakers` weights them 0.4 / 0.35 / 0.2 / 0.05:

| Signal | Source |
|---|---|
| `relationshipScore` | `Reward.Characters`, shared `RewardFacet` × `CharacterFacet`/`BotFacet` links, direct or neighbouring Facet links |
| `targetAffinityScore` | token overlap between the object's text and the speaker's own characterization |
| `voiceEvidenceScore` | archived sample depth from `utils/comments/voiceEvidence.ts`, falling back to live `personality`/`voice`/`sampleResponse` |
| `noveltyScore` | anti-concentration within a batch |

There is no input for historical WonderLab pairings, and adding one would fail
`utils/scripts/verifyCommentSignals.ts`.

To see why a speaker was chosen for any live object:

    npx tsx utils/scripts/commentCastingPreview.ts --rewards 276 --facets 285 --samples

### Deliberate contrast is an override, not a signal

Novelty carries a weight of 0.05, so a full-marks novelty score moves a total by five points —
far less than the spread between real candidates. A "cast someone surprising" nudge expressed
as a score would therefore never actually cast anyone while appearing to. `ContrastDirective`
instead force-places a named speaker after ranking, requires a written reason, and appends that
reason to the cast. Surprising castings stay possible; unexplained ones do not.

### Exchange shapes

Not every object wants the same scene. `buildCommentDraftPrompt` accepts `SOLO`, `DUET`,
`DUET_REPLY`, and `TRIO`. Two speakers remains the default everywhere; a third is opt-in via
`maxSpeakers: 3`, because a crowd around one object should be a decision rather than a drift.

## Creative rules

- Choose the target object first, then cast one or two speakers who make sense for it.
- Existing object relationships and facet affinity are useful signals, never mandatory lore.
- Historical WonderLab pairings have no preservation requirement. Keep strong voice evidence and chemistry; discard weak exchanges.
- Do not paraphrase a Component review into a new object comment. New text should arise from the new object and the speakers' voices.
- The archive may provide cadence, vocabulary, emotional habits, stage-direction habits, and other voice evidence.
- Draft quality matters more than preserving row count. There is no target that all 706 historical entries must survive.

## Publication gate

Generation and curation may produce drafts automatically. No migrated comment is published until a calibration sample of the new exchanges receives human approval.

The calibration sample is `config/comment-calibration-batch-001.json`: fifteen hand-authored
exchanges across Rewards and Facets, each carrying the casting signals, the reasons, the
archived drafts used as voice evidence, and a curator note. It is a file, not a database row —
there is no publication path out of it, and `utils/scripts/verifyCommentCalibrationBatch.ts`
fails if anything in it starts to look like one.

That contract also enforces the creative rules above mechanically: comments may not contain
review vocabulary, and no eight-word run of a new comment may appear in any archived sample by
the same speaker. "Do not paraphrase" is a check, not an intention.

The database may continue to call these records reviews/reactions internally. Product-facing copy and project discussion call them comments.
