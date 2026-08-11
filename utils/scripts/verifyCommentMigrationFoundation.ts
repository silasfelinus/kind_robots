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

console.log('Comment migration foundation contract passed.')
