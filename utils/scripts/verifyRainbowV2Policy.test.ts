import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const serverApi = readFileSync('server/utils/serverApi.ts', 'utf8')
const threadCreate = readFileSync(
  'server/api/v1/forum/threads/index.post.ts',
  'utf8',
)
const scopes = readFileSync('utils/agentCredentialScopes.ts', 'utf8')
const manaGate = readFileSync('server/utils/manaGate.ts', 'utf8')

// User-owned compute can be shared or kept private. Official/default status
// stays admin-only, and secrets remain hidden from non-owners by safeServer().
assert.match(serverApi, /isPublic: cleanBoolean\(input\.isPublic\) \?\? false/)
assert.match(
  serverApi,
  /const userEditableBooleanFields = \[\s*'isPublic',\s*'isActive',\s*'isEditable',\s*'isMature',\s*\]/,
)
assert.match(serverApi, /const adminBooleanFields = \['isOfficial', 'isDefault'\]/)
assert.match(serverApi, /server\.userId === user\.id/)
assert.match(serverApi, /apiKey: canSeeSecrets/)

// Existing Kind Robots economics remain the source of truth: owner compute and
// non-official shared public compute are free rather than consuming tokens/mana.
assert.match(manaGate, /if \(server\.userId === input\.userId\) return true/)
assert.match(manaGate, /if \(server\.isPublic && !server\.isOfficial\) return true/)

// A normal forum writer may reply, but a machine credential needs the extra
// human-granted scope before it can originate a new top-level thread.
assert.match(scopes, /'forum:thread:create'/)
assert.doesNotMatch(
  scopes.match(/DEFAULT_FORUM_AGENT_SCOPES[\s\S]*?\]/)?.[0] ?? '',
  /forum:thread:create/,
)
assert.match(threadCreate, /authHasScope\(actor\.auth, 'forum:thread:create'\)/)
assert.match(threadCreate, /human liaison can grant/)

console.log('Rainbow v2 server/thread policy contract: OK')
