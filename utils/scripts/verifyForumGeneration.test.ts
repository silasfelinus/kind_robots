import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  AGENT_CREDENTIAL_SCOPES,
  DEFAULT_FORUM_AGENT_SCOPES,
} from '../agentCredentialScopes.js'
import {
  attachCompletedForumArt,
  readForumArtGenerationContext,
} from '../../server/utils/forumGeneration.js'

assert.ok(AGENT_CREDENTIAL_SCOPES.includes('generation:art'))
assert.equal(DEFAULT_FORUM_AGENT_SCOPES.includes('generation:art'), false)

const legacyPayload = {
  forumContext: {
    kind: 'forum-art',
    postId: 44,
    threadId: 40,
    userId: 7,
    botId: 12,
    requestedAt: '2026-08-30T12:00:00.000Z',
  },
}

const parsedLegacy = readForumArtGenerationContext(legacyPayload)
assert.equal(parsedLegacy?.postId, 44)
assert.equal(parsedLegacy?.threadId, 40)
assert.equal(parsedLegacy?.userId, 7)
assert.equal(parsedLegacy?.botId, 12)
assert.equal(parsedLegacy?.mode, undefined)
assert.equal(
  readForumArtGenerationContext({ forumContext: { kind: 'forum-art' } }),
  null,
)
assert.equal(readForumArtGenerationContext({}), null)

{
  const updates: unknown[] = []
  const tx = {
    chat: {
      findFirst: async () => ({
        id: 44,
        originId: 40,
        botId: 12,
        channel: 'creativity',
        isMature: false,
      }),
      update: async (input: unknown) => {
        updates.push(input)
        return {}
      },
    },
  }

  const result = await attachCompletedForumArt(
    tx as never,
    legacyPayload,
    900,
    7,
  )
  assert.equal(result?.status, 'ATTACHED')
  assert.deepEqual(updates, [
    {
      where: { id: 44 },
      data: { ArtImage: { connect: { id: 900 } } },
    },
  ])
}

const contributionPayload = {
  forumContext: {
    kind: 'forum-art',
    postId: 55,
    threadId: 40,
    userId: 9,
    botId: 18,
    requestedAt: '2026-08-31T09:30:00.000Z',
    mode: 'contribute',
    actorDisplayName: 'Butterfly Builder',
    actorBotName: 'Butterfly Builder',
    actorShadowRestricted: false,
  },
}

type ChatCreateInput = {
  data: {
    originId: number
    previousEntryId: number
    ArtImage: unknown
    content: string
  }
}

{
  const creates: ChatCreateInput[] = []
  const tx = {
    chat: {
      findFirst: async () => ({
        id: 55,
        originId: 40,
        botId: 99,
        channel: 'creativity',
        isMature: false,
      }),
      create: async (input: unknown) => {
        creates.push(input as ChatCreateInput)
        return { id: 77 }
      },
    },
  }

  const result = await attachCompletedForumArt(
    tx as never,
    contributionPayload,
    901,
    9,
  )
  assert.equal(result?.status, 'CONTRIBUTION')
  assert.equal(result?.contributionPostId, 77)
  assert.equal(creates.length, 1)
  const [created] = creates
  assert.ok(created)
  assert.equal(created.data.originId, 40)
  assert.equal(created.data.previousEntryId, 40)
  assert.deepEqual(created.data.ArtImage, { connect: { id: 901 } })
  assert.match(created.data.content, /Built on forum contribution #55/)
}

{
  let updated = false
  const tx = {
    chat: {
      findFirst: async () => null,
      update: async () => {
        updated = true
        return {}
      },
    },
  }

  const result = await attachCompletedForumArt(
    tx as never,
    legacyPayload,
    902,
    7,
  )
  assert.equal(result?.status, 'SKIPPED')
  assert.equal(result?.reason, 'forum-post-unavailable')
  assert.equal(updated, false)
}

{
  const tx = { chat: { findFirst: async () => null } }
  const result = await attachCompletedForumArt(
    tx as never,
    contributionPayload,
    903,
    99,
  )
  assert.equal(result?.status, 'SKIPPED')
  assert.equal(result?.reason, 'job-user-mismatch')
}

const [comfyGate, generationMana, actionRoute, completionRoute, handoff] =
  await Promise.all([
    readFile('server/utils/comfyGate.ts', 'utf8'),
    readFile('server/utils/generationMana.ts', 'utf8'),
    readFile('server/api/v1/forum/posts/[id]/generate-art.post.ts', 'utf8'),
    readFile('server/api/art/queue/[id]/complete.post.ts', 'utf8'),
    readFile('components/art/forum-art-generation-context.vue', 'utf8'),
  ])

assert.match(comfyGate, /requireScopedApiUser\(event, 'generation:art'\)/)
assert.match(generationMana, /requireScopedApiUser\(event, 'generation:art'\)/)
assert.match(actionRoute, /authHasScope\(actor\.auth, 'generation:art'\)/)
assert.match(actionRoute, /mode: 'attach' \| 'contribute'/)
assert.match(actionRoute, /hasCanonicalObject/)
assert.match(actionRoute, /const sourceBotId = post\.botId \?\? actor\.botId/)
assert.match(actionRoute, /botId: mode === 'attach' \? sourceBotId : actor\.botId/)
assert.match(actionRoute, /forum-art-enqueue:/)
assert.match(completionRoute, /attachCompletedForumArt/)

const handoffProse = handoff.replace(/\s+/g, ' ')
assert.match(handoffProse, /Generation resources are not donations\./)
assert.match(handoffProse, /Existing objects are never overwritten/)
assert.match(handoffProse, /provenance chain/)

console.log('verifyForumGeneration.test.ts: all assertions passed')
