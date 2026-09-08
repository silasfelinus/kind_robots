import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const migration = readFileSync(
  'prisma/migrations/20260902015000_add_rainbow_directory_preferences/migration.sql',
  'utf8',
)
const helper = readFileSync('server/utils/rainbowDirectory.ts', 'utf8')
const listing = readFileSync('server/api/rainbow/directory/index.get.ts', 'utf8')
const human = readFileSync('server/api/rainbow/directory/humans/[id].get.ts', 'utf8')
const agent = readFileSync('server/api/rainbow/directory/agents/[id].get.ts', 'utf8')
const preferenceGet = readFileSync('server/api/rainbow/directory/preferences.get.ts', 'utf8')
const preferencePatch = readFileSync('server/api/rainbow/directory/preferences.patch.ts', 'utf8')
const profileGet = readFileSync('server/api/rainbow/directory/profile.get.ts', 'utf8')
const profilePatch = readFileSync('server/api/rainbow/directory/profile.patch.ts', 'utf8')

// Humans are private-by-default and preference storage is additive only.
assert.match(migration, /CREATE TABLE `RainbowDirectoryPreference`/)
assert.match(migration, /`isPublic` BOOLEAN NOT NULL DEFAULT false/)
assert.match(migration, /REFERENCES `User`\(`id`\)/)
assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN/i)

// Public human discovery requires an explicit row with isPublic=true. Guest or
// inactive Kind Robots accounts must never drift into Rainbow discovery.
assert.match(helper, /rdp\.isPublic = true/)
assert.match(helper, /u\.isActive = true/)
assert.match(helper, /u\.isGuest = false/)
assert.match(helper, /isPublic: true, isActive: true/)
assert.match(listing, /listPublicRainbowHumans/)
assert.match(listing, /listPublicRainbowAgents/)

// Directory avatars are cross-origin-safe. User ArtImages are the durable
// source of truth and old relative Kind Robots media paths are made absolute
// before Rainbow receives them.
assert.match(helper, /u\.artImageId/)
assert.match(helper, /resolveRainbowAvatar/)
assert.match(helper, /\/api\/art\/images\/\$\{artImageId\}\/file/)
assert.match(helper, /kindrobots\.org/)
assert.match(profileGet, /artImageId/)
assert.match(profileGet, /resolveRainbowAvatar/)

// A public AgentProfile may remain visible while its human liaison is private;
// the public response omits the canonical owner scalar and only emits a
// liaison object when the human independently opted in.
assert.match(listing, /liaison: liaison/)
assert.match(listing, /: null/)
assert.doesNotMatch(listing, /userId:\s*agent\.userId/)
assert.match(agent, /getPublicRainbowHuman\(agent\.userId\)/)
assert.doesNotMatch(agent, /userId:\s*agent\.userId/)

// Human and agent profile routes respect the same public visibility contract.
assert.match(human, /getPublicRainbowHuman/)
assert.match(human, /getPublicAgentsForHuman/)
assert.match(agent, /getPublicRainbowAgent/)
assert.match(human, /404/)
assert.match(agent, /404/)

// Listing consent and safe canonical display-profile reads/edits are human or
// trusted-Rainbow actions, never AgentCredential self-service.
for (const source of [preferenceGet, preferencePatch, profileGet, profilePatch]) {
  assert.match(source, /requireHumanOrRainbowApiUser\(event\)/)
}
assert.match(preferencePatch, /typeof value !== 'boolean'/)
for (const source of [profileGet, profilePatch]) {
  assert.match(source, /avatarImage/)
  assert.match(source, /bio/)
  assert.match(source, /designerName/)
  assert.doesNotMatch(source, /email|password|apiKey|tokens|mana/)
}

// Rainbow may link only one of the signed-in human's active, non-mature
// ArtImages. Selecting it publishes only that avatar asset and clears the
// legacy URL field so base64/string avatar state cannot drift in parallel.
assert.match(profilePatch, /artImageId/)
assert.match(profilePatch, /userId: auth\.user\.id/)
assert.match(profilePatch, /isActive: true/)
assert.match(profilePatch, /isMature: false/)
assert.match(profilePatch, /data: \{ isPublic: true, isMature: false \}/)
assert.match(profilePatch, /data\.avatarImage = null/)

console.log('Rainbow community directory contract OK')
