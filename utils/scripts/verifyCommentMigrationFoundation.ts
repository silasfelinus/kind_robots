import assert from 'node:assert/strict'
import { rankCommentSpeakers } from '@/utils/comments/commentCasting'
import { buildCommentDraftPrompt } from '@/utils/comments/commentDraftPrompt'

const target = {
  type: 'FACET' as const,
  id: 42,
  title: 'Clockwork',
  description: 'Brass gears, wound springs, mechanisms, and precise moving parts.',
  tags: ['mechanical', 'brass'],
}

const ranked = rankCommentSpeakers(target, [
  {
    kind: 'CHARACTER',
    id: 2,
    name: 'Target-fit voice',
    targetAffinityScore: 90,
    voiceEvidenceScore: 80,
  },
  {
    kind: 'BOT',
    id: 1,
    name: 'Relationship voice',
    relationshipScore: 100,
    voiceEvidenceScore: 40,
  },
  {
    kind: 'BOT',
    id: 3,
    name: 'Museum nostalgia should not matter',
    noveltyScore: 100,
    voiceEvidenceScore: 20,
  },
])

assert.equal(ranked.length, 2)
assert.equal(ranked[0]?.id, 1)
assert.equal(ranked[1]?.id, 2)
assert.ok(ranked[0]?.reasons.includes('direct object relationship'))

const prompt = buildCommentDraftPrompt(target, [
  {
    kind: 'BOT',
    id: 1,
    name: 'Copper Finch',
    personality: 'Precise, dry, easily fascinated by mechanisms.',
    canonicalVoice: 'Short declarative sentences with occasional technical metaphors.',
    archivedVoiceSamples: ['A museum-era line used only to learn this voice.'],
  },
  {
    kind: 'CHARACTER',
    id: 2,
    name: 'Mira',
    personality: 'Impulsive and tactile.',
    canonicalVoice: 'Talks with her hands and interrupts herself.',
  },
])

assert.match(prompt.system, /COMMENTS, not product reviews/)
assert.match(prompt.system, /characterization evidence only/)
assert.match(prompt.system, /Never paraphrase an archived line/)
assert.match(prompt.system, /object is the reason this moment exists/)
assert.doesNotMatch(prompt.system, /preserve.*pair/i)
assert.match(prompt.user, /TARGET OBJECT/)
assert.match(prompt.user, /Clockwork/)
assert.match(prompt.user, /Copper Finch/)
assert.match(prompt.user, /Mira/)

assert.throws(
  () => buildCommentDraftPrompt({ ...target, type: 'DREAM' as never }, []),
  /Transition comments do not support DREAM/,
)
assert.throws(
  () => buildCommentDraftPrompt(target, []),
  /one or two speakers/,
)
assert.throws(
  () =>
    buildCommentDraftPrompt(target, [
      { kind: 'BOT', id: 1, name: 'Same' },
      { kind: 'BOT', id: 1, name: 'Same again' },
    ]),
  /only once/,
)

// Exchange shapes. Two speakers stays the default everywhere; three is opt-in,
// because a crowd around one object should be a decision, not a drift.
const three = [
  { kind: 'BOT' as const, id: 1, name: 'One' },
  { kind: 'CHARACTER' as const, id: 2, name: 'Two' },
  { kind: 'CHARACTER' as const, id: 3, name: 'Three' },
]

assert.equal(rankCommentSpeakers(target, three, 3).length, 3)
assert.equal(rankCommentSpeakers(target, three, 9).length, 3, 'three is the hard cap')
assert.equal(rankCommentSpeakers(target, three, 0).length, 1, 'one is the floor')

assert.throws(
  () => buildCommentDraftPrompt(target, three),
  /one or two speakers/,
  'a third speaker is refused unless the caller asks for the room',
)
assert.doesNotThrow(() => buildCommentDraftPrompt(target, three, { maxSpeakers: 3 }))
assert.throws(
  () => buildCommentDraftPrompt(target, three, { maxSpeakers: 3, shape: 'DUET' }),
  /duet exchange takes exactly two speakers/,
)
assert.throws(
  () => buildCommentDraftPrompt(target, [three[0]!], { shape: 'DUET_REPLY' }),
  /duet exchange takes exactly two speakers/,
)

const solo = buildCommentDraftPrompt(target, [three[0]!], { shape: 'SOLO' })
assert.match(solo.user, /standalone observation/)
assert.equal((solo.responseSchema as { properties: { comments: { maxItems: number } } }).properties.comments.maxItems, 1)

const reply = buildCommentDraftPrompt(target, three.slice(0, 2), { shape: 'DUET_REPLY' })
assert.match(reply.user, /answering the first directly/)
assert.notEqual(reply.user, buildCommentDraftPrompt(target, three.slice(0, 2), { shape: 'DUET' }).user)

const trio = buildCommentDraftPrompt(target, three, { maxSpeakers: 3, shape: 'TRIO' })
assert.match(trio.user, /Three voices on one object/)
assert.equal((trio.responseSchema as { properties: { comments: { minItems: number } } }).properties.comments.minItems, 3)

console.log('Comment migration foundation contract passed.')
