import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const schema = readFileSync('prisma/agent-profile.prisma', 'utf8')
const migration = readFileSync(
  'prisma/migrations/20260901063000_add_agent_profile/migration.sql',
  'utf8',
)
const credentials = readFileSync('server/utils/agentCredentials.ts', 'utf8')
const authGuard = readFileSync('server/utils/authGuard.ts', 'utf8')
const credentialCreate = readFileSync(
  'server/api/agent-credentials/index.post.ts',
  'utf8',
)
const profileList = readFileSync('server/api/agent-profiles/index.get.ts', 'utf8')
const profileCreate = readFileSync('server/api/agent-profiles/index.post.ts', 'utf8')
const profileGet = readFileSync('server/api/agent-profiles/[id].get.ts', 'utf8')
const profilePatch = readFileSync('server/api/agent-profiles/[id].patch.ts', 'utf8')
const profileDelete = readFileSync('server/api/agent-profiles/[id].delete.ts', 'utf8')

assert.match(schema, /model AgentProfile \{/)
assert.match(schema, /userId\s+Int/)
assert.match(schema, /name\s+String/)
assert.match(schema, /avatarImage\s+String\?/)
assert.match(schema, /description\s+String\?/)
assert.match(schema, /isPublic\s+Boolean/)
assert.match(schema, /allowMessages\s+Boolean/)
assert.match(schema, /isActive\s+Boolean/)
assert.doesNotMatch(schema, /Bot\s+Bot/)

assert.match(schema, /model AgentProfileCredential \{/)
assert.match(schema, /credentialId\s+Int\s+@unique/)
assert.match(schema, /agentProfileId\s+Int/)
assert.match(migration, /CREATE TABLE `AgentProfile`/)
assert.match(migration, /CREATE TABLE `AgentProfileCredential`/)
assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN/i)

assert.match(credentials, /agentProfileId\?: number \| null/)
assert.match(credentials, /a credential cannot bind both botId and agentProfileId/)
assert.match(credentials, /tx\.agentProfileCredential\.create/)
assert.match(credentials, /agentProfileId: profileLink\?\.agentProfileId \?\? null/)
assert.match(authGuard, /agentProfileId\?: number \| null/)
assert.match(authGuard, /agentProfileId: result\.agentProfileId/)

assert.match(credentialCreate, /agentProfileId must reference an active profile you own/)
assert.match(credentialCreate, /A credential cannot bind both botId and agentProfileId/)
assert.match(credentialCreate, /botId must reference a Bot you own/)

for (const route of [profileList, profileCreate, profileGet, profilePatch, profileDelete]) {
  assert.match(route, /requireHumanApiUser/)
}

assert.match(profileDelete, /isActive: false/)
assert.match(profileDelete, /tx\.agentCredential\.updateMany/)
assert.match(profileDelete, /revokedAt/)
assert.match(profilePatch, /allowMessages/)
assert.match(profilePatch, /isPublic/)

console.log('Kind Robots AgentProfile contract: OK')
