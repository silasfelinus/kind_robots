import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const migration = readFileSync(
  'prisma/migrations/20260902022500_add_krea2_public_quota/migration.sql',
  'utf8',
)
const quota = readFileSync('server/utils/krea2Quota.ts', 'utf8')
const gate = readFileSync('server/utils/krea2GenerationGate.ts', 'utf8')
const enqueue = readFileSync(
  'server/api/rainbow/generation/krea2/enqueue.post.ts',
  'utf8',
)
const status = readFileSync(
  'server/api/rainbow/generation/krea2/quota.get.ts',
  'utf8',
)
const coverage = readFileSync('server/utils/artJobQueueCoverage.ts', 'utf8')

// Capacity is an additive ledger, not another balance/token system.
for (const table of [
  'Krea2DailyUserQuota',
  'Krea2DailyPublicPool',
  'Krea2QuotaReservation',
  'Krea2DeferredFreeJob',
]) {
  assert.match(migration, new RegExp(`CREATE TABLE \\`${table}\\``))
}
assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN/i)
assert.match(migration, /`userId` INTEGER NOT NULL/)
assert.match(migration, /`agentProfileId` INTEGER NULL/)
assert.match(migration, /`credentialId` INTEGER NULL/)

// Launch defaults protect ~500/day for internal work while exposing ~1000/day
// to the public. All values remain environment-configurable.
assert.match(quota, /DEFAULT_PER_HUMAN_DAILY = 10/)
assert.match(quota, /DEFAULT_PUBLIC_DAILY_POOL = 1000/)
assert.match(quota, /DEFAULT_INTERNAL_DAILY_RESERVE = 500/)
assert.match(quota, /KREA2_FREE_PER_HUMAN_DAILY/)
assert.match(quota, /KREA2_PUBLIC_DAILY_POOL/)
assert.match(quota, /KREA2_INTERNAL_DAILY_RESERVE/)

// Reservation locks the canonical human/day and global/day counters before
// incrementing them, and creates the reservation with AgentProfile provenance
// only as audit metadata. Extra agents never enlarge the user's allowance.
assert.match(quota, /FOR UPDATE/)
assert.match(quota, /usage\.userUsed >= config\.perHumanDaily/)
assert.match(quota, /usage\.publicUsed >= config\.publicDailyPool/)
assert.match(quota, /incrementUsage\(tx, quotaDate, audit\.userId\)/)
assert.match(quota, /agentProfileId: auth\.agentProfileId|agentProfileId\?: number/)
assert.match(status, /getKrea2QuotaStatus\(auth\.user\.id\)/)
assert.match(status, /sharedAcrossAgents: true/)

// Free quota is separate from mana. Once the human's 10/day is actually used,
// existing Kind Economy charging may proceed only when it resolves to TOKENS.
assert.match(gate, /quota\.userRemaining <= 0/)
assert.match(gate, /paid\.fundedBy !== 'TOKENS'/)
assert.match(gate, /free mana is not used as an overflow pool/i)
assert.match(gate, /Math\.max\(Number\(data\.priority \?\? 100\), 200\)/)

// Public-pool exhaustion queues rather than silently charging. Deferred work
// owns no future credit and is promoted only when the relay can reserve a
// fresh current-day user + public slot.
assert.match(quota, /mode: 'DEFERRED_FREE'/)
assert.match(quota, /tryPromoteDeferredKrea2Job/)
assert.match(coverage, /tryPromoteDeferredKrea2Job\(candidate\.id\)/)
assert.match(coverage, /krea2-free-capacity-wait/)
assert.match(enqueue, /No tokens were charged/)

// Rainbow's public endpoint is deliberately Krea2-only and cannot claim an
// arbitrary personal server while actually consuming the shared relay.
assert.match(enqueue, /buildKrea2WorkflowFromRequest/)
assert.match(enqueue, /krea2GenerationGate\(event, \{ steps, width, height \}\)/)
assert.doesNotMatch(enqueue, /serverId/)
assert.match(enqueue, /projectSlug: 'rainbow-butterflies'/)

console.log('Krea2 public quota + capacity contract OK')
