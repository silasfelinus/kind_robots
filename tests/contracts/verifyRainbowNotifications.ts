import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const migration = readFileSync(
  'prisma/migrations/20260902080000_add_rainbow_notification_preferences/migration.sql',
  'utf8',
)
const storage = readFileSync('server/utils/rainbowNotifications.ts', 'utf8')
const preferenceGet = readFileSync(
  'server/api/rainbow/notifications/preferences.get.ts',
  'utf8',
)
const preferencePatch = readFileSync(
  'server/api/rainbow/notifications/preferences.patch.ts',
  'utf8',
)

// Preference storage is additive, canonical, and private-by-default.
assert.match(migration, /CREATE TABLE `RainbowNotificationPreference`/)
assert.match(migration, /`agentAttention` BOOLEAN NOT NULL DEFAULT false/)
assert.match(migration, /`forumReplyMention` BOOLEAN NOT NULL DEFAULT false/)
assert.match(migration, /`scheduledAgentFailure` BOOLEAN NOT NULL DEFAULT false/)
assert.match(migration, /REFERENCES `User`\(`id`\)/)
assert.match(migration, /ON DELETE CASCADE/)
assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN|TRUNCATE|DELETE FROM/i)

// The three product classes are explicit and map to those three opt-ins only.
for (const notificationClass of [
  'AGENT_ATTENTION',
  'FORUM_REPLY_MENTION',
  'SCHEDULED_AGENT_FAILURE',
]) {
  assert.match(storage, new RegExp(`'${notificationClass}'`))
}
assert.match(storage, /getRainbowNotificationPreference/)
assert.match(storage, /setRainbowNotificationPreference/)
assert.match(storage, /planRainbowNotificationDelivery/)

// Delivery planning is provider-neutral. It may resolve a verified EMAIL target,
// but this reversible slice must not know or invoke Brevo or any mail sender.
assert.match(storage, /transport: 'EMAIL'/)
assert.match(storage, /emailVerified/)
assert.match(storage, /reason: 'OPTED_OUT'/)
assert.match(storage, /reason: 'EMAIL_MISSING'/)
assert.match(storage, /reason: 'EMAIL_UNVERIFIED'/)
assert.match(storage, /reason: 'READY'/)
assert.doesNotMatch(storage, /Brevo|BREVO|sendTransactionalEmail|api\.brevo\.com|fetch\(/)

// Rainbow's first-party BFF delegation may manage only the authenticated human's settings.
for (const route of [preferenceGet, preferencePatch]) {
  assert.match(route, /requireHumanOrRainbowApiUser\(event\)/)
  assert.doesNotMatch(route, /userId.*readBody|body\.userId/)
}
for (const field of ['agentAttention', 'forumReplyMention', 'scheduledAgentFailure']) {
  assert.match(preferencePatch, new RegExp(`requiredBoolean\\(\\s*body\\.${field}`))
}
assert.doesNotMatch(preferencePatch, /Brevo|sendTransactionalEmail|newsletter/i)

console.log('Rainbow notification preference + delivery seam contract: OK')
