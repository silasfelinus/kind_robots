// /utils/scripts/verifyWonderLabReviewerAffinity.ts
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  isWonderLabReviewerVoiceReady,
  rankWonderLabReviewers,
  wonderLabReviewerKey,
  type WonderLabReviewerCandidate,
} from '@/utils/wonderlab/reviewerAffinity'

const candidates: WonderLabReviewerCandidate[] = [
  {
    id: 10,
    kind: 'BOT',
    name: 'DottiB0t',
    slug: 'dottib0t',
    description: 'Bot Making Mad Scientist who builds robot friends.',
    personality: 'wacky, playful, synergistic',
    voice: 'Rapid, delighted, technically precise mad-scientist patter.',
    sampleResponse: 'Oho! This bot chassis has excellent friendship sockets!',
    modules: 'Bot, Markdown',
    isActive: true,
    isPublic: true,
  },
  {
    id: 11,
    kind: 'CHARACTER',
    name: 'Catbot',
    slug: 'catbot',
    description: 'A cat-shaped critic with broad museum privileges.',
    voice: 'Communicates through concise cat behavior and selective judgment.',
    sampleResponse: '*purrs, then pushes the confusing control off the table*',
    isActive: true,
    isPublic: true,
  },
  {
    id: 12,
    kind: 'BOT',
    name: 'Interface Cartographer',
    slug: 'interface-cartographer',
    description: 'Maps navigation, route state, panels, and component layouts.',
    voice: 'Calm, spatial, and exact.',
    sampleResponse: 'The route is sound, but the panel hierarchy needs a clearer landmark.',
    tags: ['navigation', 'layout', 'route'],
    isActive: true,
    isPublic: true,
  },
  {
    id: 13,
    kind: 'CHARACTER',
    name: 'Silent Specialist',
    description: 'Knows bot managers but has no established voice data.',
    tags: ['bot', 'manager'],
    isActive: true,
    isPublic: true,
  },
  {
    id: 14,
    kind: 'BOT',
    name: 'Private Builder',
    description: 'A private bot builder.',
    voice: 'Private voice.',
    tags: ['bot', 'builder'],
    isActive: true,
    isPublic: false,
  },
  {
    id: 15,
    kind: 'CHARACTER',
    name: 'Retired Engineer',
    description: 'A retired bot engineer.',
    voice: 'Tired but exact.',
    tags: ['bot', 'engineer'],
    isActive: false,
    isPublic: true,
  },
]

const botManager = {
  id: 1121,
  componentName: 'bot-manager',
  folderName: 'bots',
  sourcePath: 'components/bots/bot-manager.vue',
  title: 'Bot Manager',
  description: 'Build, edit, and organize robot personalities and narrator bots.',
  tags: ['bot', 'builder', 'narrator'],
}

const ranking = rankWonderLabReviewers(botManager, candidates, { limit: 6 })

assert.equal(ranking[0]?.reviewer.name, 'DottiB0t')
assert.ok((ranking[0]?.score || 0) >= 30)
assert.ok(
  ranking[0]?.reasons.some((reason) =>
    reason.startsWith('Dotti bot-building affinity:'),
  ),
)
assert.ok(ranking.some((entry) => entry.reviewer.name === 'Catbot'))
assert.equal(
  ranking.some((entry) => entry.reviewer.name === 'Private Builder'),
  false,
  'private reviewers should be excluded by default',
)
assert.equal(
  ranking.some((entry) => entry.reviewer.name === 'Retired Engineer'),
  false,
  'inactive reviewers should be excluded by default',
)

const silent = ranking.find(
  (entry) => entry.reviewer.name === 'Silent Specialist',
)
assert.equal(silent?.voiceReady, false)
assert.ok(silent?.reasons.includes('voice data incomplete'))
assert.equal(isWonderLabReviewerVoiceReady(candidates[0]!), true)
assert.equal(isWonderLabReviewerVoiceReady(candidates[3]!), false)

const unrelatedExhibit = {
  id: 200,
  componentName: 'rain-effect',
  folderName: 'screenfx',
  sourcePath: 'components/screenfx/rain-effect.vue',
  title: 'Rain Effect',
}

const ambient = rankWonderLabReviewers(unrelatedExhibit, candidates, {
  limit: 6,
})
assert.equal(ambient[0]?.reviewer.name, 'Catbot')
assert.deepEqual(ambient[0]?.reasons, ['Catbot broad museum eligibility'])

const dottiKey = wonderLabReviewerKey(candidates[0]!)
const overridden = rankWonderLabReviewers(botManager, candidates, {
  limit: 6,
  overrides: [
    {
      reviewerKey: dottiKey,
      excluded: true,
      reason: 'Curator reserved Dotti for a later pass.',
    },
    {
      reviewerKey: 'interface-cartographer',
      boost: 50,
      reason: 'Curator selected a navigation specialist.',
    },
  ],
})

assert.equal(
  overridden.some((entry) => entry.reviewer.name === 'DottiB0t'),
  false,
)
assert.equal(overridden[0]?.reviewer.name, 'Interface Cartographer')
assert.ok(
  overridden[0]?.reasons.includes(
    'Curator selected a navigation specialist.',
  ),
)

const repeated = rankWonderLabReviewers(botManager, candidates, { limit: 6 })
assert.deepEqual(
  ranking.map((entry) => [entry.reviewerKey, entry.score, entry.reasons]),
  repeated.map((entry) => [entry.reviewerKey, entry.score, entry.reasons]),
  'reviewer ranking must be deterministic across reruns',
)

const source = await readFile('utils/wonderlab/reviewerAffinity.ts', 'utf8')
assert.doesNotMatch(source, /Math\.random|\$fetch|prisma\.|fetch\(/)
assert.match(source, /Dotti bot-building affinity/)
assert.match(source, /Catbot broad museum eligibility/)
assert.match(source, /voice data incomplete/)
assert.match(source, /curator affinity adjustment/)

console.log('WonderLab reviewer affinity contract passed.')
