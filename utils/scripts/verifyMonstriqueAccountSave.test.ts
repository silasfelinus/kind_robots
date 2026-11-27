// MONSTRIQUE account-backed saves (conductor monstress-convention/t-015).
// Main-game standard: signed-in players keep saves and unlocks across devices
// through the shared save service; browser storage is the offline fallback.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  ACCOUNT_SAVE_LIMIT,
  accountSaveSlot,
  chooseSync,
  generalSafeCase,
  mergeKitProgress,
  parseAccountSave,
  type MonstriqueAccountSave,
} from '../monstressConvention/accountSave'
import { newCase, type CaseState } from '../monstressConvention/prologue'
import { emptyKitProgress } from '../playbookKit/settings'

const read = (path: string) =>
  readFileSync(new URL('../../' + path, import.meta.url), 'utf8')

const fresh = newCase(4)
const progressed: CaseState = {
  ...newCase(4),
  room: 'front-office',
  evidence: ['motel-photo'],
  flags: ['billboard-shot'],
}
const matureCase: CaseState = {
  ...progressed,
  flags: ['ghost-kiss'],
  inventory: ['camera', 'garlic-protection'],
}
const envelope = (state: CaseState, savedAt = '2026-11-27T10:00:00.000Z') => ({
  version: 1,
  savedAt,
  case: state,
  kit: null,
})

assert.equal(accountSaveSlot('general'), 'monstrique-general')
assert.equal(accountSaveSlot('mature'), 'monstrique-mature')

const parsed = parseAccountSave(envelope(progressed), 'general')
assert.ok(parsed, 'a general save parses')
assert.equal(parsed.case.room, 'front-office')
assert.equal(
  parseAccountSave(envelope(matureCase), 'general'),
  null,
  'the general slot refuses mature-only flags and items',
)
assert.ok(parseAccountSave(envelope(matureCase), 'mature'))
assert.equal(generalSafeCase(progressed), true)
assert.equal(generalSafeCase(matureCase), false)
assert.equal(
  parseAccountSave({ ...envelope(progressed), version: 2 }, 'general'),
  null,
)
assert.equal(
  parseAccountSave(
    { ...envelope(progressed), savedAt: 'yesterday' },
    'general',
  ),
  null,
)
assert.equal(parseAccountSave([], 'general'), null)
assert.equal(parseAccountSave(null, 'general'), null)
assert.equal(
  parseAccountSave(
    envelope({ ...progressed, room: '__proto__' as CaseState['room'] }),
    'general',
  ),
  null,
)
const huge = {
  ...progressed,
  transcript: Array.from({ length: 4000 }, () => 'x'.repeat(200)),
}
assert.ok(JSON.stringify(huge).length > ACCOUNT_SAVE_LIMIT)
assert.equal(parseAccountSave(envelope(huge), 'general'), null)
const stranded = parseAccountSave(
  envelope({ ...progressed, room: 'odette-room' }),
  'general',
)
assert.equal(stranded?.case.room, 'balcony', 'reload repairs apply')
assert.equal(
  parseAccountSave({ ...envelope(progressed), kit: 'nope' }, 'general'),
  null,
)

const remote = parseAccountSave(
  envelope(progressed, '2026-11-27T12:00:00.000Z'),
  'general',
) as MonstriqueAccountSave
assert.equal(
  chooseSync({ case: progressed, savedAt: null, saved: true }, null),
  'upload',
)
assert.equal(
  chooseSync({ case: fresh, savedAt: null, saved: false }, null),
  'same',
)
assert.equal(
  chooseSync({ case: fresh, savedAt: null, saved: false }, remote),
  'adopt-remote',
  'a new device picks up the account case',
)
assert.equal(
  chooseSync(
    { case: progressed, savedAt: '2026-11-27T09:00:00.000Z', saved: true },
    remote,
  ),
  'same',
)
const localNewer: CaseState = { ...progressed, room: 'balcony' }
assert.equal(
  chooseSync(
    { case: localNewer, savedAt: '2026-11-27T13:00:00.000Z', saved: true },
    remote,
  ),
  'keep-local',
)
assert.equal(
  chooseSync(
    { case: localNewer, savedAt: '2026-11-27T11:00:00.000Z', saved: true },
    remote,
  ),
  'adopt-remote',
)

const merged = mergeKitProgress(
  {
    ...emptyKitProgress(),
    endings: { 'lead-earned': '2026-11-27T10:00:00.000Z' },
    moments: { 'dead-client': '2026-11-27T09:00:00.000Z' },
  },
  {
    ...emptyKitProgress(),
    endings: { reckless: '2026-11-26T10:00:00.000Z' },
    moments: { 'dead-client': '2026-11-26T09:00:00.000Z' },
    trailerSeen: true,
  },
)
assert.deepEqual(Object.keys(merged.endings).sort(), [
  'lead-earned',
  'reckless',
])
assert.equal(merged.moments['dead-client'], '2026-11-26T09:00:00.000Z')
assert.equal(merged.trailerSeen, true)

for (const route of [
  'server/api/monstrique/account-save.get.ts',
  'server/api/monstrique/account-save.put.ts',
]) {
  const source = read(route)
  assert.match(source, /await requireHumanApiUser\(event\)/, route)
  assert.match(source, /auth\.user\.isGuest \|\| auth\.user\.id === 10/, route)
  assert.match(source, /const edition = monstriqueAudienceFor\(auth\)/, route)
  assert.match(source, /accountSaveSlot\(edition\)/, route)
  assert.match(source, /parseAccountSave\(/, route)
  assert.match(source, /'Cache-Control', 'private, no-store'/, route)
  assert.match(source, /'Vary', 'Authorization'/, route)
  assert.doesNotMatch(source, /getQuery|getRouterParam|showMature/, route)
}
const put = read('server/api/monstrique/account-save.put.ts')
assert.match(put, /input\.edition !== edition/, 'edition mismatch is refused')
assert.match(
  put,
  /where: \{ userId: auth\.user\.id, gameSlug, revision: prior \}/,
)
assert.match(put, /P2002/)

const store = read('stores/monstriquePublicStore.ts')
assert.match(store, /void syncAccount\('general'\)/)
assert.match(
  store,
  /loadMode\('mature'\)\s+kit\.open\('monstrique-mature-' \+ accountId\.value\)\s+void syncAccount\('mature'\)/,
)
assert.match(store, /edition: mode,/)
assert.match(store, /result\.data\.edition !== mode/)
assert.match(store, /scheduleAccountSave\(mode\)/)
assert.match(
  read('components/monstrexx/monstrexx-front.vue'),
  /data-testid="monstrique-account-sync"/,
)

console.log(
  'Monstrique account saves: slots, validation, sync choice, merge: OK',
)
