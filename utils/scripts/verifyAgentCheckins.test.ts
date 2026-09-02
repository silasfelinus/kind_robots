import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const schema = readFileSync('prisma/agent-profile.prisma', 'utf8')
const migration = readFileSync(
  'prisma/migrations/20260901083000_add_agent_checkins_notes/migration.sql',
  'utf8',
)
const scopes = readFileSync('utils/agentCredentialScopes.ts', 'utf8')
const authGuard = readFileSync('server/utils/authGuard.ts', 'utf8')
const runtime = readFileSync('server/utils/agentProfileRuntime.ts', 'utf8')
const checkIn = readFileSync('server/api/v1/agent/check-in.post.ts', 'utf8')
const notes = readFileSync(
  'server/api/agent-profiles/[id]/notes.post.ts',
  'utf8',
)
const activity = readFileSync(
  'server/api/agent-profiles/[id]/activity.get.ts',
  'utf8',
)

assert.match(schema, /model AgentCheckIn \{/)
assert.match(schema, /model AgentNote \{/)
assert.match(schema, /deliveredCheckInId\s+Int\?/)
assert.match(schema, /@@index\(\[agentProfileId, deliveredAt, createdAt\]\)/)
assert.match(migration, /CREATE TABLE `AgentCheckIn`/)
assert.match(migration, /CREATE TABLE `AgentNote`/)
assert.match(migration, /`deliveredCheckInId` INTEGER NULL/)
assert.match(migration, /ON DELETE CASCADE/)

assert.match(scopes, /'agent:checkin'/)
assert.doesNotMatch(
  scopes.match(/DEFAULT_FORUM_AGENT_SCOPES[\s\S]*?\n\]/)?.[0] ?? '',
  /agent:checkin/,
)

// Both REST and MCP share the same credential/profile validation, input cleaning,
// rate limit, durable check-in write, and note/attention delivery transaction.
assert.match(runtime, /requireScopedApiUser\(event, scope\)/)
assert.match(runtime, /auth\.kind !== 'agent-credential'/)
assert.match(runtime, /!auth\.agentProfileId/)
assert.match(runtime, /profile\.userId !== auth\.user\.id/)
assert.match(runtime, /AGENT_CHECKIN_STATUSES/)
assert.match(runtime, /trimmed\.length > 5000/)
assert.match(runtime, /CHECKIN_WINDOW_LIMIT = 30/)
assert.match(runtime, /CHECKIN_WINDOW_MS = 10 \* 60 \* 1000/)
assert.match(runtime, /setHeader\(event, 'Retry-After', retryAfter\)/)
assert.match(runtime, /tx\.agentCheckIn\.create/)
assert.match(runtime, /deliveredAt:\s*null/)
assert.match(runtime, /deliveredCheckInId:\s*checkIn\.id/)
assert.match(runtime, /where:\s*\{ deliveredCheckInId: checkIn\.id \}/)
assert.match(runtime, /take:\s*20/)
assert.match(runtime, /claimResolvedAgentAttentionRequests/)

assert.match(checkIn, /requireBoundAgentProfile\(event, 'agent:checkin'\)/)
assert.match(checkIn, /parseAgentCheckInInput\(body\)/)
assert.match(checkIn, /assertAgentCheckInRateAllowed\(event, context\.auth\.credentialId\)/)
assert.match(checkIn, /recordAgentCheckIn\(\{ context, \.\.\.input \}\)/)
assert.doesNotMatch(checkIn, /prisma\.|agentCheckIn\.create|agentNote\.updateMany/)

for (const source of [notes, activity]) {
  assert.match(source, /requireHumanOrDelegatedApiUser\(event\)/)
  assert.match(source, /profile\.userId !== auth\.user\.id/)
}
assert.match(notes, /Note queued for the agent’s next check-in/)
assert.match(activity, /pendingNotes/)
assert.match(activity, /lastCheckInAt/)

// requireHumanApiUser stays strict: it guards AgentCredential administration
// and AgentProfile create/patch/delete, so it must keep rejecting BOTH
// machine AgentCredentials and first-party delegation tokens.
const humanGuard = authGuard.match(
  /export async function requireHumanApiUser[\s\S]*?\n}\n\n\/\*\*/,
)?.[0]
assert.ok(humanGuard, 'requireHumanApiUser contract was not found')
assert.match(
  humanGuard,
  /auth\.kind === 'agent-credential' \|\| auth\.kind === 'first-party-delegation'/,
)

// requireHumanOrDelegatedApiUser is the narrow allowance: it rejects machine
// AgentCredentials but lets a first-party delegation token through, for use
// only on the non-credential, non-admin routes above.
const delegatedGuard = authGuard.match(
  /export async function requireHumanOrDelegatedApiUser[\s\S]*?\n}/,
)?.[0]
assert.ok(
  delegatedGuard,
  'requireHumanOrDelegatedApiUser contract was not found',
)
assert.match(delegatedGuard, /auth\.kind === 'agent-credential'/)
assert.doesNotMatch(delegatedGuard, /auth\.kind === 'first-party-delegation'/)

console.log('Agent check-in + human notes contract OK')
