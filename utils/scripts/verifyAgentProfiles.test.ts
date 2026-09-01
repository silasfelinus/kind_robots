import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const schema = readFileSync('prisma/agent-profile.prisma', 'utf8')
const migration = readFileSync(
  'prisma/migrations/20260901063000_add_agent_profile/migration.sql',
  'utf8',
)
const forumPolicyMigration = readFileSync(
  'prisma/migrations/20260901203000_add_agent_forum_policy/migration.sql',
  'utf8',
)
const credentials = readFileSync('server/utils/agentCredentials.ts', 'utf8')
const authGuard = readFileSync('server/utils/authGuard.ts', 'utf8')
const forumPolicy = readFileSync('server/utils/agentForumPolicy.ts', 'utf8')
const credentialCreate = readFileSync(
  'server/api/agent-credentials/index.post.ts',
  'utf8',
)
const credentialList = readFileSync(
  'server/api/agent-credentials/index.get.ts',
  'utf8',
)
const credentialDelete = readFileSync(
  'server/api/agent-credentials/[id].delete.ts',
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

// Rainbow is the one trusted delegated product surface allowed to manage the
// signed-in human's AgentProfiles/keys. AgentCredentials and unrelated
// first-party clients remain rejected.
assert.match(authGuard, /RAINBOW_FIRST_PARTY_CLIENT_ID = 'rainbow-butterflies'/)
assert.match(authGuard, /requireHumanOrRainbowApiUser/)
assert.match(authGuard, /auth\.kind === 'agent-credential'/)
assert.match(authGuard, /auth\.clientId !== RAINBOW_FIRST_PARTY_CLIENT_ID/)

assert.match(credentialCreate, /agentProfileId must reference an active profile you own/)
assert.match(credentialCreate, /A credential cannot bind both botId and agentProfileId/)
assert.match(credentialCreate, /botId must reference a Bot you own/)

for (const route of [
  profileList,
  profileCreate,
  profileGet,
  profilePatch,
  profileDelete,
  credentialCreate,
  credentialList,
  credentialDelete,
]) {
  assert.match(route, /requireHumanOrRainbowApiUser/)
}

// Forum permissions are durable AgentProfile policy, not credential scopes.
assert.match(forumPolicyMigration, /CREATE TABLE `AgentProfileForumPolicy`/)
assert.match(forumPolicyMigration, /CREATE TABLE `ForumAgentAuthor`/)
assert.match(forumPolicyMigration, /FOREIGN KEY \(`agentProfileId`\) REFERENCES `AgentProfile`/)
assert.doesNotMatch(forumPolicyMigration, /DROP TABLE|DROP COLUMN/i)
assert.match(forumPolicy, /DEFAULT_AGENT_FORUM_CHANNELS/)
assert.doesNotMatch(forumPolicy, /DEFAULT_FORUM_CHANNELS/)
assert.match(profileCreate, /forumChannels/)
assert.match(profilePatch, /forumChannels/)
assert.match(profileList, /getAgentForumChannels/)

assert.match(profileDelete, /isActive: false/)
assert.match(profileDelete, /tx\.agentCredential\.updateMany/)
assert.match(profileDelete, /revokedAt/)
assert.match(profilePatch, /allowMessages/)
assert.match(profilePatch, /isPublic/)

console.log('Kind Robots AgentProfile contract: OK')
