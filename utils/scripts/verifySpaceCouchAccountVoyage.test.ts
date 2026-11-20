import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  createVoyageBackup,
  parseVoyageBackup,
  persistRestoredVoyage,
  VOYAGE_BACKUP_KIND,
  VOYAGE_BACKUP_MAX_BYTES,
} from '../gameOfCaptains/voyageBackup'
import { startVoyage } from '../gameOfCaptains/rules'

const run = startVoyage('vale', ['rue', 'vela', 'mox'], 20261120)
const remote = parseVoyageBackup(createVoyageBackup(run, []))
assert.equal(remote.kind, VOYAGE_BACKUP_KIND)
assert.equal(remote.voyage?.seed, run.seed)
assert.deepEqual(remote.completedVoyages, [])
assert.throws(
  () => parseVoyageBackup(' '.repeat(VOYAGE_BACKUP_MAX_BYTES + 1)),
  /too large/,
)
assert.throws(
  () =>
    parseVoyageBackup('🙂'.repeat(Math.floor(VOYAGE_BACKUP_MAX_BYTES / 4) + 1)),
  /too large/,
  'UTF-16 character length must not defeat the UTF-8 byte limit',
)
assert.throws(
  () => parseVoyageBackup(JSON.stringify({ ...remote, kind: 'other-game' })),
  /Unsupported Space Couch backup format/,
)
assert.throws(
  () => parseVoyageBackup(JSON.stringify({ ...remote, voyage: {} })),
  /invalid or incompatible/,
)


const archiveKey = 'finished'
const activeKey = 'voyage'
const originals = new Map([
  [archiveKey, 'old archive'],
  [activeKey, 'old active voyage'],
])
let failActiveOnce = true
const storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = {
  getItem: (key) => originals.get(key) ?? null,
  setItem: (key, value) => {
    originals.set(key, value)
    if (key === activeKey && failActiveOnce) {
      failActiveOnce = false
      throw new Error('Simulated write failure after active save changed')
    }
  },
  removeItem: (key) => {
    originals.delete(key)
  },
}
assert.deepEqual(
  persistRestoredVoyage(
    storage,
    { archive: archiveKey, active: activeKey },
    [],
    run,
  ),
  { ok: false, rollbackFailed: false },
)
assert.equal(originals.get(archiveKey), 'old archive')
assert.equal(originals.get(activeKey), 'old active voyage')
assert.deepEqual(
  persistRestoredVoyage(
    storage,
    { archive: archiveKey, active: activeKey },
    [],
    run,
  ),
  { ok: true, rollbackFailed: false },
)
assert.equal(originals.get(archiveKey), '[]')
assert.equal(JSON.parse(originals.get(activeKey)!).seed, run.seed)
originals.clear()
failActiveOnce = true
assert.equal(
  persistRestoredVoyage(
    storage,
    { archive: archiveKey, active: activeKey },
    [],
    run,
  ).ok,
  false,
)
assert.equal(originals.has(archiveKey), false)
assert.equal(originals.has(activeKey), false)

const read = (path: string): string =>
  readFileSync(new URL(path, import.meta.url), 'utf8')
const getRoute = read('../../server/api/game-of-captains/voyage-save.get.ts')
const putRoute = read('../../server/api/game-of-captains/voyage-save.put.ts')
const store = read('../../stores/gameOfCaptainsStore.ts')
const page = read('../../pages/play/game-of-captains.vue')
const schema = read('../../prisma/schema.prisma')
const migration = read(
  '../../prisma/migrations/20261120114600_space_couch_voyage_account_saves/migration.sql',
)

for (const route of [getRoute, putRoute]) {
  assert.match(route, /requireHumanApiUser\(event\)/)
  assert.match(route, /user\.isGuest \|\| user\.id === 10/)
  assert.match(route, /userId: user\.id/)
  assert.match(route, /parseVoyageBackup/)
  assert.doesNotMatch(route, /userId:\s*(?:input|body)\./)
}
assert.match(getRoute, /spaceCouchVoyageSave\.findUnique/)
assert.match(getRoute, /revision: row\.revision/)
assert.match(putRoute, /spaceCouchVoyageSave\.create/)
assert.match(putRoute, /spaceCouchVoyageSave\.updateMany/)
assert.match(putRoute, /revision: input\.expectedRevision as number/)
assert.match(putRoute, /revision: \{ increment: 1 \}/)
assert.match(putRoute, /updated\.count !== 1/)
assert.match(putRoute, /P2002/)
assert.match(putRoute, /statusCode: 409/)
assert.match(putRoute, /readBody\(event\)/)

assert.match(schema, /model SpaceCouchVoyageSave \{/)
assert.match(schema, /SpaceCouchVoyageSave\s+SpaceCouchVoyageSave\?/)
assert.match(schema, /payload\s+String\s+@db\.LongText/)
assert.match(schema, /revision\s+Int\s+@default\(0\)/)
assert.match(migration, /CREATE TABLE `SpaceCouchVoyageSave`/)
assert.match(migration, /REFERENCES `User`\(`id`\) ON DELETE CASCADE/)

for (const action of [
  'checkAccountVoyageBackup',
  'saveVoyageBackupToAccount',
  'stageAccountVoyageBackup',
  'resetAccountVoyageBackup',
]) {
  assert.ok(store.includes(action), action)
}
assert.match(store, /accountBackupOwner\.value !== owner/)
assert.match(store, /persistRestoredVoyage\(/)
assert.match(store, /written\.rollbackFailed/)
assert.match(store, /epoch !== accountBackupEpoch/)
assert.match(store, /expectedRevision: accountBackupRevision\.value/)
assert.match(
  store,
  /stagedAccountBackupOwner !== userStore\.authenticatedUserId/,
)
assert.match(store, /mergeVoyageHistory\(/)
assert.match(store, /const SAVE_KEY = 'game-of-captains-voyage-v1'/)
assert.match(
  store,
  /if \(restoring\) deedFacts = voyageDeedFacts\(run\.value\)/,
)
for (const id of [
  'space-couch-check-account-backup',
  'space-couch-save-account-backup',
  'space-couch-restore-account-backup',
  'space-couch-backup-confirm',
]) {
  assert.ok(page.includes(id), id)
}
assert.match(page, /@click="store\.stageAccountVoyageBackup\(\)"/)
assert.match(page, /@click="confirmVoyageBackup"/)
assert.match(page, /if \(store\.applyVoyageBackup\(\)\)/)
assert.ok(
  page.indexOf('data-testid="space-couch-restore-account-backup"') <
    page.indexOf('data-testid="space-couch-backup-confirm"'),
  'account copy is staged, then confirmed by the existing import flow',
)
console.log(
  'Space Couch: strict private account backups, revision conflicts, explicit restores and v1 browser saves OK',
)
