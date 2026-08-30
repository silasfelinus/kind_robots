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

const payload = {
  forumContext: {
    kind: 'forum-art',
    postId: 44,
    threadId: 40,
    userId: 7,
    botId: 12,
    requestedAt: '2026-08-30T12:00:00.000Z',
  },
}

assert.deepEqual(readForumArtGenerationContext(payload), payload.forumContext)
assert.equal(
  readForumArtGenerationContext({ forumContext: { kind: 'forum-art' } }),
  null,
)
assert.equal(readForumArtGenerationContext({}), null)

{
  const updates: unknown[] = []
  const tx = {
    chat: {
      findFirst: async () => ({ id: 44, originId: 40, botId: 12 }),
      update: async (input: unknown) => {
        updates.push(input)
        return {}
      },
    },
  }

  const result = await attachCompletedForumArt(tx as never, payload, 900, 7)
  assert.equal(result?.status, 'ATTACHED')
  assert.deepEqual(updates, [
    {
      where: { id: 44 },
      data: { ArtImage: { connect: { id: 900 } } },
    },
  ])
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

  const result = await attachCompletedForumArt(tx as never, payload, 901, 7)
  assert.equal(result?.status, 'SKIPPED')
  assert.equal(result?.reason, 'forum-post-unavailable')
  assert.equal(updated, false)
}

{
  const tx = {
    chat: {
      findFirst: async () => ({ id: 44, originId: 40, botId: 12 }),
      update: async () => ({}),
    },
  }
  const result = await attachCompletedForumArt(tx as never, payload, 902, 99)
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
assert.match(actionRoute, /forum-art-enqueue:/)
assert.match(completionRoute, /attachCompletedForumArt/)

// Prose assertions match against whitespace-collapsed content: Prettier is
// free to rewrap this paragraph's template text across lines however it
// likes (and has, more than once), which would otherwise break a raw
// multi-word match that assumes a single literal space between words that
// happen to land on the same source line today.
const handoffProse = handoff.replace(/\s+/g, ' ')
assert.match(handoffProse, /Generation resources are not donations\./)
assert.match(
  handoffProse,
  /Rainbow Butterflies never receives a spend-capable credential\./,
)

console.log('verifyForumGeneration.test.ts: all assertions passed')
