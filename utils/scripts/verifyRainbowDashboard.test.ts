import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const endpoint = readFileSync('server/api/v1/rainbow/dashboard.get.ts', 'utf8')
const workspace = readFileSync('server/utils/rainbowDashboard.ts', 'utf8')

// The dashboard is private human workspace data. Rainbow may call it through
// first-party delegation, but an arbitrary agent credential is not enough.
assert.match(endpoint, /requireHumanOrDelegatedApiUser/)
assert.match(endpoint, /effectiveShowMature\(auth\.user\)/)
assert.match(endpoint, /Cache-Control', 'no-store'/)
assert.match(endpoint, /userId: auth\.user\.id/)

// Conversation context is intentionally "recent direct replies", not a fake
// unread/mention inbox. A direct reply must target a post accountable to this
// human and must come from somebody outside the same human/agent account.
assert.match(workspace, /RECENT_REPLY_LIMIT = 12/)
assert.match(workspace, /parent\.userId = \$\{input\.userId\}/)
assert.match(workspace, /reply\.userId IS NULL OR reply\.userId <> \$\{input\.userId\}/)
assert.match(workspace, /reply\.isPublic = true/)
assert.match(workspace, /reply\.isActive = true/)
assert.match(workspace, /reply\.isMature = false/)
assert.match(workspace, /repliesAreUnread: false/)
assert.match(workspace, /mentionsAvailable: false/)

// Canonical objects stay in Kind Robots. All three useful starter kinds are
// scoped to the accountable userId, active state, and the operator's maturity
// setting, then merged into one bounded recent-work feed.
assert.match(workspace, /RECENT_OBJECT_LIMIT_PER_KIND = 8/)
assert.match(workspace, /RECENT_OBJECT_LIMIT = 16/)
assert.match(workspace, /prisma\.artImage\.findMany/)
assert.match(workspace, /prisma\.character\.findMany/)
assert.match(workspace, /prisma\.project\.findMany/)
assert.equal(
  [...workspace.matchAll(/userId: input\.userId/g)].length >= 3,
  true,
  'all canonical object queries must be user-scoped',
)
assert.equal(
  [...workspace.matchAll(/isActive: true/g)].length >= 3,
  true,
  'all canonical object queries must require active records',
)
assert.match(workspace, /kind: 'ART_IMAGE'/)
assert.match(workspace, /kind: 'CHARACTER'/)
assert.match(workspace, /kind: 'PROJECT'/)
assert.match(workspace, /objects\.slice\(0, RECENT_OBJECT_LIMIT\)/)

// No Rainbow shadow database, no private Conductor projection, and no claim
// that a missing read-state system exists.
assert.doesNotMatch(workspace, /ConductorProjection|readConductorProjection|buildConductorData/)
assert.match(workspace, /Canonical Kind Robots userId ownership/)

console.log('Rainbow dashboard workspace contract OK')
