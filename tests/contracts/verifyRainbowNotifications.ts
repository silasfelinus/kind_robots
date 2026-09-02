import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const migration = readFileSync(
  'prisma/migrations/20260902080000_add_rainbow_notification_preferences/migration.sql',
  'utf8',
)
const storage = readFileSync('server/utils/rainbowNotifications.ts', 'utf8')
const delivery = readFileSync(
  'server/utils/rainbowNotificationDelivery.ts',
  'utf8',
)
const preferenceGet = readFileSync(
  'server/api/rainbow/notifications/preferences.get.ts',
  'utf8',
)
const preferencePatch = readFileSync(
  'server/api/rainbow/notifications/preferences.patch.ts',
  'utf8',
)
const attentionCreate = readFileSync(
  'server/api/v1/agent/attention/index.post.ts',
  'utf8',
)
const forumReplyCreate = readFileSync(
  'server/api/v1/forum/threads/[id]/replies.post.ts',
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
  assert.match(delivery, new RegExp(`'${notificationClass}'`))
}
assert.match(storage, /getRainbowNotificationPreference/)
assert.match(storage, /setRainbowNotificationPreference/)
assert.match(storage, /planRainbowNotificationDelivery/)

// Delivery planning stays provider-neutral. Brevo belongs only in the transport adapter.
assert.match(storage, /transport: 'EMAIL'/)
assert.match(storage, /emailVerified/)
assert.match(storage, /reason: 'OPTED_OUT'/)
assert.match(storage, /reason: 'EMAIL_MISSING'/)
assert.match(storage, /reason: 'EMAIL_UNVERIFIED'/)
assert.match(storage, /reason: 'READY'/)
assert.doesNotMatch(storage, /Brevo|BREVO|sendTransactionalEmail|api\.brevo\.com|fetch\(/)
assert.match(delivery, /planRainbowNotificationDelivery/)
assert.match(delivery, /sendTransactionalEmail/)
assert.match(delivery, /decision\.reason !== 'READY' \|\| !target/)
assert.match(delivery, /Optional Rainbow notification/)
assert.doesNotMatch(delivery, /newsletter|brevoApiKey|BREVO_API_KEY|x-api-key/i)

// Rainbow's first-party BFF delegation may manage only the authenticated human's settings.
for (const route of [preferenceGet, preferencePatch]) {
  assert.match(route, /requireHumanOrRainbowApiUser\(event\)/)
  assert.doesNotMatch(route, /userId.*readBody|body\.userId/)
}
for (const field of ['agentAttention', 'forumReplyMention', 'scheduledAgentFailure']) {
  assert.match(preferencePatch, new RegExp(`requiredBoolean\\(\\s*body\\.${field}`))
}
assert.doesNotMatch(preferencePatch, /Brevo|sendTransactionalEmail|newsletter/i)

// Attention requests are idempotent by clientKey; email only on the newly-created branch.
assert.match(attentionCreate, /if \(result\.created\)/)
assert.match(attentionCreate, /deliverRainbowNotification\(\{/)
assert.match(attentionCreate, /notificationClass: 'AGENT_ATTENTION'/)

// Direct forum replies notify the parent author only for visible, non-self replies.
assert.match(forumReplyCreate, /created\.isPublic/)
assert.match(forumReplyCreate, /parent\.userId/)
assert.match(forumReplyCreate, /parent\.userId !== actor\.userId/)
assert.match(forumReplyCreate, /notificationClass: 'FORUM_REPLY_MENTION'/)
assert.match(forumReplyCreate, /isMature,/)

// Mature forum content is never copied into the email body or text excerpt.
assert.match(delivery, /input\.isMature \? '' : compactText\(input\.excerpt\)/)
assert.match(delivery, /reply is in a mature thread, so its content is not copied into email/)

console.log('Rainbow notification preference + Brevo delivery contract: OK')
