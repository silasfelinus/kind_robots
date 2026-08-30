import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const panel = readFileSync('components/user/agent-credentials-panel.vue', 'utf8')
const store = readFileSync('stores/agentCredentialStore.ts', 'utf8')
const profile = readFileSync('server/api/v1/profile.get.ts', 'utf8')
const createRoute = readFileSync('server/api/agent-credentials/index.post.ts', 'utf8')

assert.match(panel, /id="agent-credentials"/)
assert.match(panel, /Bot identity/)
assert.match(panel, /Last used/)
assert.match(panel, /Expires/)
assert.match(panel, /Replace/)
assert.match(panel, /Create replacement key/)
assert.match(panel, /RAINBOW_BUTTERFLIES_API_KEY/)
assert.doesNotMatch(panel, /performFetch\(/)
assert.doesNotMatch(panel, /\$fetch\(/)

assert.match(store, /defineStore\('agentCredentialStore'/)
assert.match(store, /performFetch/)
assert.match(store, /expiresAt: string \| null/)
assert.match(store, /replacementSourceId/)

assert.match(profile, /requireScopedApiUser\(event, 'profile:read'\)/)
assert.match(profile, /actorKind/)
assert.match(profile, /operator/)
assert.match(profile, /bot/)
assert.doesNotMatch(profile, /email:/)
assert.doesNotMatch(profile, /apiKey/)

assert.match(createRoute, /botId must reference a Bot you own/)
assert.match(createRoute, /expiresAt/)

console.log('Kind Robots self-service agent onboarding contract: OK')
