// /utils/scripts/verifyChallengeCenter.ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildChallengeLeaderboard,
  buildFacetLeaderboard,
  scoreChallengeReactions,
} from '../../server/utils/challengeCenter'

const readSource = (path: string) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')

const challengeCreateRoute = readSource('server/api/challenges/index.post.ts')
const challengeDeleteRoute = readSource(
  'server/api/challenges/[slug].delete.ts',
)
const challengeResource = readSource('server/utils/challengeResource.ts')

assert.match(challengeCreateRoute, /const challengeCreateFields = new Set/)
assert.match(challengeCreateRoute, /Object\.values\(ChallengeType\)/)
assert.match(challengeCreateRoute, /Object\.values\(ChallengeStatus\)/)
assert.match(challengeCreateRoute, /userId:\s*auth\.user\.id/)
assert.doesNotMatch(challengeCreateRoute, /body\.userId/)
assert.match(challengeCreateRoute, /select:\s*challengeMutationSelect/)
assert.match(challengeCreateRoute, /error\.code === 'P2002'/)
assert.match(challengeDeleteRoute, /userIsAdmin\(auth\.user\)/)
assert.match(challengeDeleteRoute, /prisma\.challenge\.delete/)
assert.match(challengeDeleteRoute, /select:\s*challengeMutationSelect/)
assert.match(challengeDeleteRoute, /error\.code === 'P2003'/)
assert.match(challengeResource, /satisfies Prisma\.ChallengeSelect/)
assert.doesNotMatch(challengeResource, /\bUser\b|\bSubmissions\b/)

// scoreChallengeReactions
assert.deepEqual(
  scoreChallengeReactions([
    { reactionType: 'LOVED' },
    { reactionType: 'LOVED' },
    { reactionType: 'CLAPPED' },
    { reactionType: 'BOOED' },
    { reactionType: 'HATED' },
  ]),
  { loved: 2, clapped: 1, booed: 1, hated: 1, votes: 5, netScore: 1 },
)

// buildChallengeLeaderboard — single-variant contenders rank by netScore
const claude = {
  id: 1,
  slug: 'conductor-claude',
  name: 'Conductor (Claude)',
  avatarImageId: null,
}
const gpt = {
  id: 2,
  slug: 'openai-gpt',
  name: 'OpenAI GPT',
  avatarImageId: null,
}

const singleVariantBoard = buildChallengeLeaderboard([
  {
    id: 101,
    contenderId: 1,
    variantKey: 'default',
    Contender: claude,
    Reactions: [{ reactionType: 'LOVED' }, { reactionType: 'CLAPPED' }],
  },
  {
    id: 102,
    contenderId: 2,
    variantKey: 'default',
    Contender: gpt,
    Reactions: [{ reactionType: 'BOOED' }],
  },
])

assert.equal(singleVariantBoard.length, 2)
assert.equal(singleVariantBoard[0]!.contenderId, 1)
assert.equal(singleVariantBoard[0]!.score.netScore, 2)
assert.equal(
  singleVariantBoard[0]!.bestVariantKey,
  null,
  'a single variant has no "best" to call out',
)
assert.equal(singleVariantBoard[0]!.variants[0]!.rank, 1)

// buildChallengeLeaderboard — multi-variant contender surfaces the winning
// variant plus its promptUsed/randomSelections for the comparison to teach something
const multiVariantBoard = buildChallengeLeaderboard([
  {
    id: 201,
    contenderId: 1,
    variantKey: 'random-1',
    promptUsed: 'A fierce fox guards a tower.',
    randomSelections: { adjective: 'fierce', animal: 'fox' },
    Contender: claude,
    Reactions: [{ reactionType: 'HATED' }],
  },
  {
    id: 202,
    contenderId: 1,
    variantKey: 'random-2',
    promptUsed: 'A gentle owl guards a tower.',
    randomSelections: { adjective: 'gentle', animal: 'owl' },
    Contender: claude,
    Reactions: [
      { reactionType: 'LOVED' },
      { reactionType: 'LOVED' },
      { reactionType: 'CLAPPED' },
    ],
  },
])

assert.equal(multiVariantBoard.length, 1)
const entry = multiVariantBoard[0]!
assert.equal(entry.bestVariantKey, 'random-2')
assert.equal(entry.variants[0]!.variantKey, 'random-2')
assert.equal(entry.variants[0]!.rank, 1)
assert.equal(entry.variants[0]!.promptUsed, 'A gentle owl guards a tower.')
assert.deepEqual(entry.variants[0]!.randomSelections, {
  adjective: 'gentle',
  animal: 'owl',
})
assert.equal(entry.variants[1]!.variantKey, 'random-1')
assert.equal(entry.variants[1]!.rank, 2)
assert.equal(
  entry.score.netScore,
  2,
  'contender score aggregates across both variants',
)

// buildFacetLeaderboard — groups across contenders sharing a facet value
const claudeFable = {
  slug: 'claude-fable',
  kind: 'LLM_MODEL',
  provider: 'anthropic',
  model: 'claude-fable-5',
  generator: null,
}
const claudeOpus = {
  slug: 'claude-opus',
  kind: 'LLM_MODEL',
  provider: 'anthropic',
  model: 'claude-opus-4-8',
  generator: null,
}
const openaiGpt = {
  slug: 'openai-gpt',
  kind: 'LLM_MODEL',
  provider: 'openai',
  model: 'gpt-5',
  generator: null,
}

const byProvider = buildFacetLeaderboard(
  [
    {
      contenderId: 10,
      Contender: claudeFable,
      Reactions: [{ reactionType: 'LOVED' }],
    },
    {
      contenderId: 11,
      Contender: claudeOpus,
      Reactions: [{ reactionType: 'LOVED' }, { reactionType: 'CLAPPED' }],
    },
    {
      contenderId: 12,
      Contender: openaiGpt,
      Reactions: [{ reactionType: 'BOOED' }],
    },
  ],
  'provider',
)

assert.equal(byProvider.length, 2)
assert.equal(byProvider[0]!.value, 'anthropic')
assert.equal(
  byProvider[0]!.score.netScore,
  3,
  'anthropic aggregates fable + opus',
)
assert.deepEqual(byProvider[0]!.contenderSlugs, ['claude-fable', 'claude-opus'])
assert.equal(byProvider[0]!.rank, 1)
assert.equal(byProvider[1]!.value, 'openai')
assert.equal(byProvider[1]!.score.netScore, -1)

// A contender missing the requested facet (null generator) is excluded, not
// silently grouped under "null" — nothing meaningful to show for that weight class.
const byGenerator = buildFacetLeaderboard(
  [
    {
      contenderId: 10,
      Contender: claudeFable,
      Reactions: [{ reactionType: 'LOVED' }],
    },
  ],
  'generator',
)
assert.equal(byGenerator.length, 0)

console.log('Challenge Center logic and mutation contracts verified.')
