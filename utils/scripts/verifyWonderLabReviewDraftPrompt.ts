// /utils/scripts/verifyWonderLabReviewDraftPrompt.ts
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  buildWonderLabReviewDraftPrompt,
  type WonderLabNarratorThreadExcerpt,
} from '@/utils/wonderlab/reviewDraftPrompt'
import type {
  WonderLabExhibitProfile,
  WonderLabReviewerCandidate,
} from '@/utils/wonderlab/reviewerAffinity'

const dotti: WonderLabReviewerCandidate = {
  id: 410,
  kind: 'BOT',
  name: 'DottiB0t',
  slug: 'dottib0t',
  subtitle: 'Bot Making Mad Scientist',
  description: 'Dotti builds robots because robots are future friends.',
  personality: 'wacky, playful, synergistic, technically curious',
  voice:
    'Rapid delighted mad-scientist patter, affectionate toward robots, concrete about construction details.',
  sampleResponse:
    'Oho! The friendship sockets align, the personality coils are humming, and this chassis is ready to meet somebody!',
  modules: 'Bot, Markdown',
  isActive: true,
  isPublic: true,
}

const botManager: WonderLabExhibitProfile = {
  id: 1121,
  componentName: 'bot-manager',
  folderName: 'bots',
  sourcePath: 'components/bots/bot-manager.vue',
  title: 'Bot Manager',
  description:
    'A manager surface for browsing, selecting, creating, and editing Bot records.',
  notes:
    'The museum preview uses an explicit context placard because the full manager depends on authenticated stores and live Bot data.',
  category: 'manager',
  tags: ['bot', 'builder', 'narrator'],
}

const threads: WonderLabNarratorThreadExcerpt[] = [
  {
    topicKey: 'purpose',
    title: 'What Dotti builds',
    openingText:
      'Every robot is a possible friend with one tiny assembly problem standing between us and destiny.',
    guidance: 'Celebrate construction details while noticing practical flaws.',
  },
  {
    topicKey: 'background',
    title: 'Workshop history',
    openingText:
      'The workshop has twelve labeled drawers and forty-seven unlabeled emergencies.',
    starterPrompts: ['What is on the workbench?', 'Which robot needs help?'],
  },
  {
    topicKey: 'the-world',
    title: 'Robot society',
    openingText: 'A good interface is a handshake between future friends.',
  },
  {
    topicKey: 'kind-robots',
    title: 'Kind Robots',
    openingText: 'Kindness needs reliable machinery and a readable control panel.',
  },
  {
    topicKey: 'zz-overflow-topic',
    title: 'This fifth thread should be excluded',
    openingText: 'Do not include this text.',
  },
]

const prompt = buildWonderLabReviewDraftPrompt(dotti, botManager, {
  affinityReasons: [
    'Dotti bot-building affinity: bot, builder, manager, narrator',
    'shared expertise: bot, builder',
  ],
  narratorThreads: threads,
  minimumWords: 50,
  maximumWords: 100,
})

assert.match(prompt.system, /Write as DottiB0t/)
assert.match(prompt.system, /between 50 and 100 words/)
assert.match(prompt.system, /Never claim that it has been published, tested live/)
assert.match(prompt.system, /Return JSON/)

assert.match(prompt.user, /Canonical voice: Rapid delighted mad-scientist patter/)
assert.match(prompt.user, /Sample dialogue: Oho!/)
assert.match(prompt.user, /Exhibit: Bot Manager/)
assert.match(prompt.user, /components\/bots\/bot-manager\.vue/)
assert.match(prompt.user, /Dotti bot-building affinity/)
assert.match(prompt.user, /NARRATOR THREAD VOICE REFERENCES/)
assert.match(prompt.user, /Do not quote or continue the threads/)
assert.doesNotMatch(prompt.user, /zz-overflow-topic/)
assert.doesNotMatch(prompt.user, /Do not include this text/)

const backgroundIndex = prompt.user.indexOf('Topic: background')
const kindRobotsIndex = prompt.user.indexOf('Topic: kind-robots')
const purposeIndex = prompt.user.indexOf('Topic: purpose')
const worldIndex = prompt.user.indexOf('Topic: the-world')
assert.ok(backgroundIndex >= 0)
assert.ok(backgroundIndex < kindRobotsIndex)
assert.ok(kindRobotsIndex < purposeIndex)
assert.ok(purposeIndex < worldIndex)

assert.deepEqual(prompt.provenance.voiceSources, [
  'voice',
  'sampleResponse',
  'narratorThreads',
])
assert.deepEqual(prompt.provenance.narratorThreadTopics, [
  'background',
  'kind-robots',
  'purpose',
  'the-world',
])
assert.equal(prompt.provenance.reviewerKind, 'BOT')
assert.equal(prompt.provenance.reviewerId, 410)
assert.equal(prompt.provenance.exhibitId, 1121)
assert.equal(
  prompt.provenance.exhibitSourcePath,
  'components/bots/bot-manager.vue',
)
assert.match(
  prompt.provenance.draftKey,
  /^bot:dottib0t:410\|component:1121\|components\/bots\/bot-manager\.vue$/,
)

assert.deepEqual(prompt.responseSchema.required, [
  'comment',
  'rating',
  'confidence',
  'observations',
])
assert.equal(prompt.responseSchema.properties.rating.minimum, 1)
assert.equal(prompt.responseSchema.properties.rating.maximum, 5)
assert.equal(prompt.responseSchema.additionalProperties, false)

const repeated = buildWonderLabReviewDraftPrompt(dotti, botManager, {
  affinityReasons: [
    'Dotti bot-building affinity: bot, builder, manager, narrator',
    'shared expertise: bot, builder',
  ],
  narratorThreads: [...threads].reverse(),
  minimumWords: 50,
  maximumWords: 100,
})
assert.deepEqual(
  prompt.provenance,
  repeated.provenance,
  'draft provenance must remain deterministic when thread input order changes',
)
assert.equal(prompt.system, repeated.system)
assert.equal(prompt.user, repeated.user)

assert.throws(
  () =>
    buildWonderLabReviewDraftPrompt(
      {
        id: 99,
        kind: 'CHARACTER',
        name: 'Unvoiced Reviewer',
      },
      botManager,
    ),
  /has no canonical voice or sample dialogue/,
)

const incomplete = buildWonderLabReviewDraftPrompt(
  {
    id: 99,
    kind: 'CHARACTER',
    name: 'Unvoiced Reviewer',
  },
  botManager,
  { allowIncompleteVoice: true },
)
assert.deepEqual(incomplete.provenance.voiceSources, [])
assert.match(incomplete.user, /Canonical voice: Not provided/)
assert.match(incomplete.user, /Sample dialogue: Not provided/)

const veryLong = 'z'.repeat(5_000)
const boundedPrompt = buildWonderLabReviewDraftPrompt(
  {
    ...dotti,
    voice: veryLong,
    sampleResponse: veryLong,
  },
  {
    ...botManager,
    description: veryLong,
    notes: veryLong,
  },
  {
    affinityReasons: Array.from(
      { length: 20 },
      (_, index) => `${index}-${veryLong}`,
    ),
    narratorThreads: [
      {
        topicKey: 'long-thread',
        openingText: veryLong,
        guidance: veryLong,
      },
    ],
    minimumWords: 1,
    maximumWords: 999,
  },
)
assert.match(boundedPrompt.system, /between 20 and 300 words/)
assert.ok(boundedPrompt.provenance.affinityReasons.length <= 8)
assert.ok(boundedPrompt.provenance.affinityReasons.every((reason) => reason.length <= 240))
assert.ok(boundedPrompt.user.length < 10_000)
assert.match(boundedPrompt.user, /…/)

const source = await readFile('utils/wonderlab/reviewDraftPrompt.ts', 'utf8')
assert.doesNotMatch(source, /Math\.random|\$fetch|prisma\.|fetch\(|openai|anthropic/i)
assert.match(source, /draft is for human approval/i)
assert.match(source, /Do not invent component behavior/)
assert.match(source, /Do not quote or continue the threads/)
assert.match(source, /additionalProperties: false/)

console.log('WonderLab review draft prompt contract passed.')
