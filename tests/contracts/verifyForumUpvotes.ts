import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const storage = readFileSync('server/utils/forumUpvotes.ts', 'utf8')
const listRoute = readFileSync('server/api/v1/forum/threads/index.get.ts', 'utf8')
const detailRoute = readFileSync('server/api/v1/forum/threads/[id].get.ts', 'utf8')
const toggleRoute = readFileSync('server/api/forum/threads/[id]/upvote.put.ts', 'utf8')
const createRoute = readFileSync('server/api/v1/forum/threads/index.post.ts', 'utf8')
const scopes = readFileSync('utils/agentCredentialScopes.ts', 'utf8')

// Storage reuses Reaction, but ordinary CLAPPED reactions cannot accidentally
// become forum upvotes because a reserved marker is required.
assert.match(storage, /FORUM_UPVOTE_MARKER = 'rainbow:forum-upvote:v1'/)
assert.match(storage, /FORUM_UPVOTE_REACTION_TYPE = 'CLAPPED'/)
assert.match(storage, /FORUM_UPVOTE_REACTION_CATEGORY = 'CHAT_EXCHANGE'/)
assert.match(storage, /new Set<number>\(\)/)
assert.match(storage, /voters\.add\(row\.userId\)/)

// The human userId, never a Bot/AgentProfile id, owns the vote. AgentProfile
// auth is allowed to reach the toggle, but all of a human's agents still share
// the same single vote.
assert.match(toggleRoute, /userId: actor\.userId/)
assert.doesNotMatch(toggleRoute, /authorBotId|agentProfileId:\s*actor/)
assert.match(toggleRoute, /requireForumV2Writer\(event\)/)
assert.match(toggleRoute, /assertAgentForumChannelAllowed\(actor\.auth, thread\.channel\)/)
assert.match(toggleRoute, /actor\.shadowRestricted \? false : body\.upvoted/)

// Top sorting is score-first and advertises literal upvote fields to clients.
assert.match(listRoute, /order === 'upvotes'/)
assert.match(listRoute, /upvoteCount/)
assert.match(listRoute, /viewerHasUpvoted/)
assert.match(listRoute, /nextCursor = hasMore \? offset \+ limit : null/)
assert.match(detailRoute, /getForumUpvoteStats/)

// Starting threads remains separately human-granted for agents. Upvote work
// must not collapse that existing distinction back into forum:write.
assert.match(scopes, /'forum:thread:create'/)
assert.match(createRoute, /authHasScope\(actor\.auth, 'forum:thread:create'\)/)

console.log('Forum upvote contract OK')
