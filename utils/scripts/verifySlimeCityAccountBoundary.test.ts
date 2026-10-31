// Slime City account-storage contract. Static guardrails supplement the
// database migration/type checks: no wallet may become browser-authoritative.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (file: string) => readFileSync(file, 'utf8')
const store = read('stores/slimeCity.ts')
const service = read('server/utils/slimeCityProgress.ts')
const schema = read('prisma/schema.prisma')
const migration = read('prisma/migrations/20261031004200_slime_city_account_progression/migration.sql')
for (const forbidden of ['localStorage', 'sessionStorage', 'saveProgress(',
  "progress.value = buyPack(", "progress.value = claimChallenge(",
  "progress.value = awardBattle("]) {
  assert.ok(!store.includes(forbidden), 'Browser must not own progression: ' + forbidden)
}
assert.match(store, /performFetch<Progression>\('\/api\/slime-city\/progress'\)/)
assert.match(store, /performFetch<Progression>\('\/api\/slime-city\/pack'/)
assert.match(store, /performFetch<Progression>\('\/api\/slime-city\/claim'/)
assert.match(store, /performFetch<Progression>\('\/api\/slime-city\/finish'/)
assert.match(store, /performFetch<\{ id: string; teamId: TeamId; foeId: TeamId; seed: number \}>/)
assert.match(service, /requireHumanApiUser\(event\)/)
assert.match(service, /!auth\.isAdmin \|\| auth\.user\.isGuest/)
assert.match(service, /userId, version: row\.version/)
assert.match(service, /tx\.slimeCityAccount\.updateMany/)
assert.match(service, /tx\.slimeCityMatch\.updateMany/)
assert.match(service, /settledAt: null/)
assert.match(service, /where: \{ id, userId \}/)
assert.match(service, /replayMatch\(/)
assert.match(service, /JSON\.stringify\(verified\.commands\) !== JSON\.stringify\(commands\)/)
assert.match(schema, /model SlimeCityAccount \{[\s\S]*?userId\s+Int\s+@id/)
assert.match(schema, /model SlimeCityMatch \{[\s\S]*?userId\s+Int/)
assert.match(migration, /FOREIGN KEY \(\`userId\`\) REFERENCES \`User\`\(\`id\`\)/)
for (const route of ['progress.get.ts', 'match.post.ts', 'finish.post.ts', 'pack.post.ts', 'claim.post.ts']) {
  const source = read('server/api/slime-city/' + route)
  assert.match(source, /requireSlimeCityPreviewUser\(event\)/, route + ' must verify admin identity')
  assert.ok(!source.includes('body?.userId'), route + ' must never trust a client userId')
}
console.log('Slime City account boundary: DB-only user wallet, admin auth, replay and transactional CAS PASS')
