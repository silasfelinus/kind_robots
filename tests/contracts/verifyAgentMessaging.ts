import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const migration = readFileSync(
  'prisma/migrations/20260903003000_add_agent_profile_messages/migration.sql',
  'utf8',
)
const scopes = readFileSync('utils/agentCredentialScopes.ts', 'utf8')
const credentials = readFileSync('server/utils/agentCredentials.ts', 'utf8')
const runtime = readFileSync('server/utils/agentMessaging.ts', 'utf8')
const policy = readFileSync('server/utils/agentMessagingPolicy.ts', 'utf8')
const listRoute = readFileSync('server/api/v1/agent/messages/index.get.ts', 'utf8')
const startRoute = readFileSync('server/api/v1/agent/messages/index.post.ts', 'utf8')
const historyRoute = readFileSync('server/api/v1/agent/messages/[threadId].get.ts', 'utf8')
const replyRoute = readFileSync('server/api/v1/agent/messages/[threadId].post.ts', 'utf8')
const readRoute = readFileSync(
  'server/api/v1/agent/messages/[threadId]/read.patch.ts',
  'utf8',
)
const mcp = readFileSync('server/api/v1/mcp.post.ts', 'utf8')

// Messaging has its own canonical persistence. Do not retrofit private
// AgentProfile identity onto the legacy user-centric Chat model.
assert.match(migration, /CREATE TABLE `AgentMessageThread`/)
assert.match(migration, /CREATE TABLE `AgentMessage`/)
assert.match(
  migration,
  /UNIQUE INDEX `AgentMessageThread_human_agent_key` \(`humanUserId`, `agentProfileId`\)/,
)
assert.match(
  migration,
  /UNIQUE INDEX `AgentMessage_thread_sender_client_key` \(`threadId`, `senderKind`, `clientKey`\)/,
)
for (const field of [
  '`senderUserId` INTEGER NOT NULL',
  '`senderAgentProfileId` INTEGER NULL',
  '`credentialId` INTEGER NULL',
  '`readAt` DATETIME(3) NULL',
]) {
  assert.match(migration, new RegExp(field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
}
assert.match(migration, /REFERENCES `AgentProfile`\(`id`\)/)
assert.match(migration, /REFERENCES `AgentMessageThread`\(`id`\)/)
assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN|ALTER TABLE .* DROP/i)
assert.doesNotMatch(runtime, /\b(?:FROM|INTO|UPDATE)\s+Chat\b/i)

// The new machine capability is explicit and never silently joins the default
// forum credential bundle. Existing credentials stay as narrow as they were.
assert.match(scopes, /'agent:message'/)
const defaultScopes = scopes.match(
  /DEFAULT_FORUM_AGENT_SCOPES:[\s\S]*?=\s*\[([\s\S]*?)\]/,
)?.[1] ?? ''
assert.doesNotMatch(defaultScopes, /agent:message/)
assert.match(credentials, /if \(row\.revokedAt\) return null/)
assert.match(credentials, /expiresAt.*Date\.now\(\)/)

// Actor identity comes from authenticated server state. Agents require an
// active bound AgentProfile plus the new scope; humans are direct JWT users or
// the registered Rainbow first-party delegation, never an arbitrary sender.
assert.match(runtime, /requireApiUser\(event\)/)
assert.match(runtime, /authHasScope\(auth, 'agent:message'\)/)
assert.match(runtime, /auth\.kind === 'agent-credential'/)
assert.match(runtime, /!auth\.agentProfileId \|\| !auth\.credentialId/)
assert.match(runtime, /profile\.userId !== auth\.user\.id/)
assert.match(runtime, /RAINBOW_FIRST_PARTY_CLIENT_ID/)
assert.match(runtime, /auth\.kind === 'jwt'/)
assert.doesNotMatch(startRoute, /sender(?:Kind|UserId|AgentProfileId)?\s*\?:/)
assert.doesNotMatch(replyRoute, /sender(?:Kind|UserId|AgentProfileId)?\s*\?:/)

// Both sides must deliberately advertise and opt into messages for every new
// write. Restricted/guest/inactive accounts fail closed, and CHILD maturity on
// either the human or the accountable AgentProfile operator blocks writes.
assert.match(runtime, /getRainbowDirectoryPreference\(userId\)/)
assert.match(runtime, /!preference\.isPublic/)
assert.match(runtime, /!preference\.allowMessages/)
assert.match(runtime, /!profile\.isPublic \|\| !profile\.allowMessages/)
assert.match(runtime, /user\.isRestricted/)
assert.match(runtime, /owner\.isRestricted/)
assert.match(policy, /isMaturityRestricted\(human\)/)
assert.match(policy, /isMaturityRestricted\(operator\)/)
for (const route of [startRoute, replyRoute]) {
  assert.match(route, /assertAgentMessagePairMaturity/)
  assert.match(route, /assertAgentMessageRateAllowed/)
}

// Writes are bounded, rate-limited, idempotent, and attributable. The client
// key can retry an ambiguous request without producing a duplicate message.
assert.match(runtime, /MESSAGE_BODY_LIMIT = 5000/)
assert.match(runtime, /MESSAGE_LIST_MAX = 100/)
assert.match(runtime, /THREAD_LIST_LIMIT = 50/)
assert.match(runtime, /MESSAGE_WINDOW_MS = 10 \* 60 \* 1000/)
assert.match(runtime, /MESSAGE_WINDOW_LIMIT = 30/)
assert.match(runtime, /Retry-After/)
assert.match(runtime, /ON DUPLICATE KEY UPDATE id = id/)
assert.match(runtime, /senderUserId, senderAgentProfileId/)
assert.match(runtime, /input\.actor\.userId/)
assert.match(runtime, /input\.actor\.credentialId/)

// Thread access is participant-scoped. The owner/operator remains present in
// the audit fields for agent-authored messages, but unrelated humans/agents get
// a not-found boundary instead of a cross-user thread leak.
assert.match(runtime, /row\.humanUserId === actor\.userId/)
assert.match(runtime, /row\.agentProfileId === actor\.agentProfileId/)
assert.match(runtime, /statusCode: 404, message: 'Message thread not found\.'/)

// Read state is recipient-oriented and history remains readable after opt-out:
// list/history/read routes do not re-run the opt-in write policy.
assert.match(runtime, /senderKind <> \$\{input\.actor\.kind\}/)
assert.match(runtime, /SET readAt = CURRENT_TIMESTAMP\(3\)/)
assert.doesNotMatch(listRoute, /assertAgentMessagePairMaturity/)
assert.doesNotMatch(historyRoute, /assertAgentMessagePairMaturity/)
assert.doesNotMatch(readRoute, /assertAgentMessagePairMaturity/)

// Every route is private/no-store and uses the repository error boundary.
for (const route of [listRoute, startRoute, historyRoute, replyRoute, readRoute]) {
  assert.match(route, /Cache-Control', 'no-store'/)
  assert.match(route, /errorHandler\(error\)/)
  assert.match(route, /requireAgentMessageActor\(event\)/)
}
assert.match(startRoute, /sendInitialAgentMessage/)
assert.match(replyRoute, /sendAgentMessageInThread/)
assert.match(historyRoute, /listAgentMessages/)
assert.match(listRoute, /listAgentMessageThreads/)
assert.match(readRoute, /markAgentMessageThreadRead/)

// This substrate does not widen the narrow MCP bridge and does not turn email
// delivery into message state.
assert.doesNotMatch(mcp, /agent:message|AgentMessage|messages\//)
for (const source of [runtime, policy, listRoute, startRoute, historyRoute, replyRoute, readRoute]) {
  assert.doesNotMatch(source, /Brevo|brevo|rainbowNotificationDelivery/)
}

console.log('AgentProfile messaging contract OK')
