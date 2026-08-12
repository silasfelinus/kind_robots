// /utils/scripts/verifyCommentSignals.ts
//
// Contract for the object-first casting signals. Offline and deterministic.
//
// The load-bearing assertion here is the one about historical pairings: a
// speaker gains nothing from having appeared in the archive next to another
// speaker, and no amount of archive presence creates a relationship to an object
// (kind_robots#1769). The rest guards the ordering the weights depend on.
import assert from 'node:assert/strict'
import { rankCommentSpeakers } from '@/utils/comments/commentCasting'
import {
  applyContrastDirectives,
  noveltyScore,
  relationshipScore,
  scoreSpeaker,
  scoreSpeakerPool,
  targetAffinityScore,
  type CastingContext,
  type SignalSpeakerProfile,
  type SignalTargetProfile,
} from '@/utils/comments/commentSignals'
import {
  buildVoiceEvidenceIndex,
  selectVoiceSamples,
  speakerKey,
  voiceEvidenceScore,
  voiceEvidenceTier,
  type ArchivedVoiceRecord,
} from '@/utils/comments/voiceEvidence'

// ---------------------------------------------------------------- fixtures

const reward: SignalTargetProfile = {
  type: 'REWARD',
  id: 900,
  title: 'Lanternlight Deduction',
  description: 'reads the truth left behind in old light',
  flavorText: "shows you truths you didn't want confirmed",
  category: 'SKILL UNCOMMON',
  facetIds: [10, 11],
  linkedCharacterIds: [500],
}

const facet: SignalTargetProfile = {
  type: 'FACET',
  id: 10,
  title: 'Lanternkeeping',
  description: 'Tending a light that other people navigate by.',
  category: 'OCCUPATION',
}

const linkedCharacter: SignalSpeakerProfile = {
  kind: 'CHARACTER',
  id: 500,
  name: 'Pip the Lampkeeper',
  personality: 'Tends old light. Patient about truth.',
  facetIds: [10],
}

const strangerBot: SignalSpeakerProfile = {
  kind: 'BOT',
  id: 700,
  name: 'Ledger',
  personality: 'Counts things. Confirms nothing without a receipt.',
  botType: 'ANALYST',
}

const record = (draftId: number, id: number, text: string): ArchivedVoiceRecord => ({
  draftId,
  author: { kind: 'CHARACTER', id, name: `Speaker ${id}` },
  editedComment: text,
})

// ---------------------------------------------------------------- relationship

assert.equal(
  relationshipScore(reward, linkedCharacter).score,
  100,
  'a Reward that names a Character is the strongest possible relationship',
)
assert.equal(
  relationshipScore(facet, linkedCharacter).score,
  100,
  'a speaker who carries the target Facet is directly related to it',
)
assert.equal(
  relationshipScore(reward, strangerBot).score,
  0,
  'no recorded link means no relationship score',
)

const sharesOneFacet = relationshipScore(reward, { ...strangerBot, facetIds: [11] })
assert.ok(
  sharesOneFacet.score > 0 && sharesOneFacet.score < 100,
  'shared facets are real evidence but never outrank a direct link',
)
const sharesBothFacets = relationshipScore(reward, { ...strangerBot, facetIds: [10, 11] })
assert.ok(sharesBothFacets.score > sharesOneFacet.score, 'more shared facets score higher')
assert.ok(sharesBothFacets.score < 100, 'facet coincidence stays below an explicit link')

assert.equal(
  relationshipScore({ ...facet, relatedFacetIds: [42] }, { ...strangerBot, facetIds: [42] }).score,
  45,
  'a neighbouring facet is a weak relationship, not a direct one',
)

// ---------------------------------------------------------------- affinity

const near = targetAffinityScore(reward, linkedCharacter)
const far = targetAffinityScore(reward, { kind: 'BOT', id: 701, name: 'Blank', personality: null })
assert.ok(near.score > 0, 'shared vocabulary produces affinity')
assert.equal(far.score, 0, 'a speaker with no characterization has no affinity')
assert.ok(near.shared.includes('light'), 'affinity reports the tokens it matched on')

// ---------------------------------------------------------------- voice

const archive = [
  record(1, 500, 'A long archived sample with enough words to read as a real voice sample here.'),
  record(2, 500, 'A second archived sample, also long enough to carry rhythm and syntax.'),
  record(3, 500, 'A third sample from the same speaker, still recognisably the same person.'),
  record(4, 500, 'A fourth sample, which is what moves this speaker into the deepest tier.'),
  record(5, 600, 'A single archived sample, and nothing else to go on anywhere.'),
  record(6, 700, 'One of two samples for this speaker.'),
  record(7, 700, 'Two of two samples for this speaker.'),
  record(8, 800, 'A deeply archived speaker with no link to the Reward under test.'),
  record(9, 800, 'A second sample for that same unlinked, deeply archived speaker.'),
  record(10, 800, 'A third sample, still unlinked to anything in these fixtures.'),
  record(11, 800, 'A fourth sample, putting this unlinked speaker in the deepest tier.'),
]
const index = buildVoiceEvidenceIndex(archive)

assert.equal(voiceEvidenceTier(index.get('CHARACTER:500')), 'RICH')
assert.equal(voiceEvidenceTier(index.get('CHARACTER:700')), 'THIN')
assert.equal(voiceEvidenceTier(index.get('CHARACTER:600')), 'SPARSE')
assert.equal(voiceEvidenceTier(index.get('CHARACTER:999')), 'NONE')

const rich = voiceEvidenceScore(index.get('CHARACTER:500'))
const thin = voiceEvidenceScore(index.get('CHARACTER:700'))
const sparse = voiceEvidenceScore(index.get('CHARACTER:600'))
const liveOnly = voiceEvidenceScore(undefined, { personality: 'Described at some length. '.repeat(8) })

assert.ok(rich > thin && thin > sparse && sparse > liveOnly && liveOnly > 0, 'tiers are ordered')
assert.equal(voiceEvidenceScore(undefined, {}), 0, 'no evidence at all is not castable')
assert.ok(rich >= 60, 'only the deepest tier earns "strong voice evidence"')
assert.ok(
  thin < 60,
  'THIN must stay under the reason threshold or "strong voice evidence" stops meaning anything',
)

// The later batch wins on a re-polished draft, and a duplicate draftId never
// inflates a speaker's sample count.
const deduped = buildVoiceEvidenceIndex([
  record(1, 500, 'The original polish of this draft.'),
  record(1, 500, 'The later re-polish of the same draft.'),
])
assert.equal(deduped.get('CHARACTER:500')?.samples.length, 1, 'draftId dedupes')
assert.match(deduped.get('CHARACTER:500')!.samples[0]!.text, /later re-polish/)

assert.equal(selectVoiceSamples(index.get('CHARACTER:500')).length, 4, 'at most four samples')
assert.equal(selectVoiceSamples(undefined).length, 0)

// ---------------------------------------------------------------- novelty

const context: CastingContext = { evidence: index, castCounts: new Map([['CHARACTER:500', 2]]) }
assert.ok(
  noveltyScore({ kind: 'CHARACTER', id: 600 }, context).score >
    noveltyScore({ kind: 'CHARACTER', id: 500 }, context).score,
  'an unused speaker is fresher than one already carrying two exchanges',
)

// ---------------------------------------------------------------- zero pairing weight

// Two speakers, identical in every documented input. One of them shares its
// entire archive history with the target's linked character; the other has never
// appeared beside anyone. They must score identically — co-occurrence is not an
// input to any signal, and there is nowhere to supply it.
const twinA: SignalSpeakerProfile = { kind: 'CHARACTER', id: 500, name: 'Twin A' }
const twinB: SignalSpeakerProfile = { kind: 'CHARACTER', id: 500, name: 'Twin B' }
const scoredA = scoreSpeaker(facet, twinA, { evidence: index })
const scoredB = scoreSpeaker(facet, twinB, { evidence: index })
assert.equal(scoredA.relationshipScore, scoredB.relationshipScore)
assert.equal(scoredA.targetAffinityScore, scoredB.targetAffinityScore)
assert.equal(scoredA.voiceEvidenceScore, scoredB.voiceEvidenceScore)
assert.equal(scoredA.noveltyScore, scoredB.noveltyScore)

// Deep archive presence alone never manufactures a relationship to an object.
assert.equal(
  scoreSpeaker(reward, { kind: 'CHARACTER', id: 800, name: 'Deep archive' }, { evidence: index })
    .relationshipScore,
  0,
  'four archived samples do not relate a speaker to an object they are not linked to',
)

// ---------------------------------------------------------------- pool

const pool = scoreSpeakerPool(
  reward,
  [
    linkedCharacter,
    strangerBot,
    { kind: 'CHARACTER', id: 998, name: 'Silent', personality: null, voice: null },
  ],
  { evidence: index },
)
assert.ok(
  !pool.some((speaker) => speaker.id === 998),
  'a speaker with no archived samples and no live voice text is not a casting option',
)

// ---------------------------------------------------------------- ranking

const ranked = rankCommentSpeakers({ type: 'REWARD', id: 900, title: 'Lanternlight Deduction' }, [
  { kind: 'CHARACTER', id: 1, name: 'Linked and apt', relationshipScore: 100, targetAffinityScore: 60 },
  { kind: 'CHARACTER', id: 2, name: 'Novel and nothing else', noveltyScore: 100, voiceEvidenceScore: 100 },
])
assert.equal(ranked[0]?.id, 1, 'novelty alone cannot outrank relationship plus affinity')

assert.equal(rankCommentSpeakers(facet, pool).length, 2, 'the default cast is still two')
assert.equal(rankCommentSpeakers(facet, pool, 3).length, 2, 'a limit cannot invent candidates')

// ---------------------------------------------------------------- contrast

const baseCast = rankCommentSpeakers(reward, pool, 2).map((speaker) => ({
  ...speaker,
  reasons: [...speaker.reasons],
}))
const outsider = { kind: 'BOT' as const, id: 702, name: 'Outsider', score: 0, reasons: [] }
const withContrast = applyContrastDirectives(baseCast, [...baseCast, outsider], [
  { speakerKey: 'BOT:702', note: 'cast against type on purpose', slot: 2 },
])
assert.equal(speakerKey(withContrast[1]!), 'BOT:702', 'a directive places its speaker')
assert.equal(withContrast.length, baseCast.length, 'a directive replaces rather than appends')
assert.ok(
  withContrast[1]!.reasons.some((reason) => reason.startsWith('deliberate contrast:')),
  'a directive states itself in the reasons',
)
assert.throws(
  () => applyContrastDirectives(baseCast, baseCast, [{ speakerKey: 'BOT:702', note: '  ' }]),
  /needs a note/,
  'an unexplained override is not inspectable and must fail',
)

console.log('Comment casting signal contract passed.')
