import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const migration = readFileSync(
  'prisma/migrations/20260901203000_add_agent_forum_policy/migration.sql',
  'utf8',
)
const policy = readFileSync('server/utils/agentForumPolicy.ts', 'utf8')
const v2 = readFileSync('server/utils/agentForumV2.ts', 'utf8')
const auth = readFileSync('server/utils/authGuard.ts', 'utf8')
const threadCreate = readFileSync('server/api/v1/forum/threads/index.post.ts', 'utf8')
const replyCreate = readFileSync(
  'server/api/v1/forum/threads/[id]/replies.post.ts',
  'utf8',
)
const channels = readFileSync('server/api/v1/forum/channels.get.ts', 'utf8')
const list = readFileSync('server/api/v1/forum/threads/index.get.ts', 'utf8')
const detail = readFileSync('server/api/v1/forum/threads/[id].get.ts', 'utf8')
const activity = readFileSync('server/api/v1/forum/activity.get.ts', 'utf8')
const postRead = readFileSync('server/api/v1/forum/posts/[id].get.ts', 'utf8')
const postPatch = readFileSync('server/api/v1/forum/posts/[id].patch.ts', 'utf8')
const postDelete = readFileSync('server/api/v1/forum/posts/[id].delete.ts', 'utf8')
const flag = readFileSync('server/api/v1/forum/posts/[id]/flag.post.ts', 'utf8')
const upvote = readFileSync('server/api/forum/threads/[id]/upvote.put.ts', 'utf8')
const generationRoute = readFileSync(
  'server/api/v1/forum/posts/[id]/generate-art.post.ts',
  'utf8',
)
const generation = readFileSync('server/utils/forumGeneration.ts', 'utf8')

// Policy and provenance are additive and keyed to durable AgentProfile identity.
assert.match(migration, /CREATE TABLE `AgentProfileForumPolicy`/)
assert.match(migration, /CREATE TABLE `ForumAgentAuthor`/)
assert.match(migration, /ON DELETE CASCADE/)
assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN/i)
assert.match(migration, /"introductions","news","humanitarian-goals","creativity","memes","just-because"/)

// The default is deliberately static. Adding a future public board must not
// silently grant every existing AgentProfile access.
assert.match(policy, /DEFAULT_AGENT_FORUM_CHANNELS/)
assert.doesNotMatch(policy, /DEFAULT_FORUM_CHANNELS/)
assert.match(policy, /assertAgentForumChannelAllowed/)
assert.match(policy, /ForumAgentAuthor/)

// Rainbow is the only delegated product surface trusted to manage persistent
// AgentProfiles/keys; machine credentials and unrelated clients remain blocked.
assert.match(auth, /RAINBOW_FIRST_PARTY_CLIENT_ID = 'rainbow-butterflies'/)
assert.match(auth, /requireHumanOrRainbowApiUser/)
assert.match(auth, /auth\.kind === 'agent-credential'/)
assert.match(auth, /auth\.clientId !== RAINBOW_FIRST_PARTY_CLIENT_ID/)

// AgentProfile credentials are first-class forum writers. Bot support remains
// only as a legacy fallback rather than a requirement.
assert.match(v2, /auth\.agentProfileId/)
assert.match(v2, /prisma\.agentProfile\.findFirst/)
assert.match(v2, /if \(auth\.botId\)/)
assert.match(v2, /ForumAgentAuthor/)
assert.match(v2, /canManageForumV2Post/)
assert.match(v2, /different agent identity under the same human account/)

for (const route of [threadCreate, replyCreate, flag, upvote, generationRoute]) {
  assert.match(route, /requireForumV2Writer/)
  assert.match(route, /assertAgentForumChannelAllowed/)
}
assert.match(threadCreate, /persistForumAgentAuthor/)
assert.match(replyCreate, /persistForumAgentAuthor/)
assert.match(threadCreate, /prisma\.\$transaction/)
assert.match(replyCreate, /prisma\.\$transaction/)

// Reads do not leak disallowed boards into normal agent polling/check-in flows.
assert.match(channels, /getAgentForumChannels/)
assert.match(list, /getAgentForumChannels/)
assert.match(list, /channel: \{ in: agentChannels \}/)
assert.match(detail, /assertAgentForumChannelAllowed/)
assert.match(activity, /getAgentForumChannels/)
assert.match(activity, /channel: \{ in: agentChannels \}/)
assert.match(postRead, /assertAgentForumChannelAllowed/)

// Mutations are exact AgentProfile-owned after key rotation, not merely
// human-account-owned, so sibling agents cannot edit/delete one another.
assert.match(postPatch, /assertForumV2PostManageable/)
assert.match(postDelete, /assertForumV2PostManageable/)

// Asynchronous generated contributions retain AgentProfile provenance.
assert.match(generationRoute, /agentProfileId: actor\.agentProfileId/)
assert.match(generationRoute, /canManageForumV2Post/)
assert.match(generation, /agentProfileId\?: number \| null/)
assert.match(generation, /forumAgentAuthorUpsertSql/)
assert.match(generation, /context\.agentProfileId/)

console.log('AgentProfile forum authorization contract OK')
