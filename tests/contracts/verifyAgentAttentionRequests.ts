import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const migration = readFileSync(
  'prisma/migrations/20260901235500_add_agent_attention_requests/migration.sql',
  'utf8',
)
const storage = readFileSync('server/utils/agentAttentionRequests.ts', 'utf8')
const createRoute = readFileSync(
  'server/api/v1/agent/attention/index.post.ts',
  'utf8',
)
const humanList = readFileSync(
  'server/api/agent-profiles/[id]/attention/index.get.ts',
  'utf8',
)
const humanResolve = readFileSync(
  'server/api/agent-profiles/[id]/attention/[requestId].patch.ts',
  'utf8',
)
const checkIn = readFileSync('server/api/v1/agent/check-in.post.ts', 'utf8')

// The request lifecycle is durable and separate from immutable heartbeat rows.
assert.match(migration, /CREATE TABLE `AgentAttentionRequest`/)
assert.match(migration, /`clientKey` VARCHAR\(120\) NOT NULL/)
assert.match(
  migration,
  /UNIQUE INDEX `AgentAttentionRequest_profile_clientKey_key` \(`agentProfileId`, `clientKey`\)/,
)
assert.match(migration, /`resolvedAt` DATETIME\(3\) NULL/)
assert.match(migration, /`deliveredAt` DATETIME\(3\) NULL/)
assert.match(migration, /`deliveredCheckInId` INTEGER NULL/)
assert.match(migration, /REFERENCES `AgentProfile`\(`id`\)/)
assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN/i)

// Agents can ask for a small, explicit set of human-attention modes. A stable
// clientKey makes retrying after network ambiguity idempotent.
for (const kind of ['help', 'approval', 'decision', 'review']) {
  assert.match(storage, new RegExp(`'${kind}'`))
}
for (const status of ['APPROVED', 'DECLINED', 'RESOLVED']) {
  assert.match(storage, new RegExp(`'${status}'`))
}
assert.match(storage, /requiredText\(input\.clientKey, 'clientKey', 120\)/)
assert.match(storage, /ON DUPLICATE KEY UPDATE id = id/)
assert.match(storage, /findByProfileClientKey/)

// Submission uses the already-basic check-in scope and must be bound to an
// active AgentProfile owned by the same canonical human user.
assert.match(createRoute, /requireScopedApiUser\(event, 'agent:checkin'\)/)
assert.match(createRoute, /auth\.kind !== 'agent-credential'/)
assert.match(createRoute, /!auth\.agentProfileId/)
assert.match(createRoute, /profile\.userId !== auth\.user\.id/)
assert.match(createRoute, /parseAgentAttentionRequestInput/)
assert.match(createRoute, /createOrGetAgentAttentionRequest/)

// Human reads/resolutions use the human/delegated BFF boundary and owner check.
for (const route of [humanList, humanResolve]) {
  assert.match(route, /requireHumanOrDelegatedApiUser\(event\)/)
  assert.match(route, /profile\.userId !== auth\.user\.id/)
}
assert.match(humanList, /listAgentAttentionRequests/)
assert.match(humanList, /openCount/)
assert.match(humanResolve, /parseAgentAttentionResolutionInput/)
assert.match(humanResolve, /resolveAgentAttentionRequest/)
assert.match(humanResolve, /next check-in/)

// Resolutions are claimed under a row lock and attached to one check-in before
// being returned, preventing two simultaneous provider timers from receiving
// the same human decision.
assert.match(storage, /FOR UPDATE/)
assert.match(storage, /deliveredCheckInId = \$\{input\.checkInId\}/)
assert.match(storage, /WHERE deliveredCheckInId = \$\{input\.checkInId\}/)
assert.match(checkIn, /claimResolvedAgentAttentionRequests/)
assert.match(checkIn, /attention:\s*result\.attention\.map/)
assert.match(checkIn, /resolved attention request/)
assert.match(checkIn, /No new human notes or attention resolutions/)

console.log('Agent human-attention request contract OK')
