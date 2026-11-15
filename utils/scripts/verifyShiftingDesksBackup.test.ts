import assert from 'node:assert/strict'
import { isShiftingDesksBackupEnvelope } from '../shiftingDesks/backupValidation'

const valid = {
  game: 'shifting-desks',
  version: 1,
  run: null,
  settings: { textSize: 'normal' },
  discovered: ['orientation'],
  endingsFound: [],
  rewardArchive: { version: 1, runs: [], milestones: {} },
  envelopeOpened: false,
}
assert.equal(isShiftingDesksBackupEnvelope(valid), true)
for (const corrupted of [
  null,
  [],
  {},
  { ...valid, game: 'another-game' },
  { ...valid, version: 2 },
  { ...valid, run: undefined, envelopeOpened: undefined },
  Object.fromEntries(Object.entries(valid).filter(([key]) => key !== 'run')),
  { ...valid, settings: [] },
  { ...valid, rewardArchive: [] },
  { ...valid, rewardArchive: null },
  { ...valid, discovered: [42] },
  { ...valid, endingsFound: [null] },
  { ...valid, envelopeOpened: 'true' },
]) {
  assert.equal(
    isShiftingDesksBackupEnvelope(corrupted),
    false,
    JSON.stringify(corrupted),
  )
}
console.log('Shifting Desks backup envelope contract passed')

import { registerHooks } from 'node:module'
const stub = (source: string) =>
  `data:text/javascript,${encodeURIComponent(source)}`
const storeStubs: Record<string, string> = {
  '~/stores/playbookRunReviewStore': stub(
    'export const usePlaybookRunReviewStore = () => ({ begin: () => {} })',
  ),
  './achievementStore': stub(
    'export const useAchievementStore = () => ({ rewardAchievementByCode: async () => true })',
  ),
  './utils/playbookLiveText': stub(
    'export const loadPlaybookLiveText = async () => false',
  ),
}
registerHooks({
  resolve(specifier, context, nextResolve) {
    const parent = context.parentURL?.split('?')[0] ?? ''
    const url = parent.endsWith('/stores/shiftingDesksStore.ts')
      ? storeStubs[specifier]
      : undefined
    return url ? { url, shortCircuit: true } : nextResolve(specifier, context)
  },
})

const { createPinia, setActivePinia } = await import('pinia')
const { useShiftingDesksStore } =
  await import('../../stores/shiftingDesksStore')
const { newRun } = await import('../shiftingDesks/rules')
const { SETTINGS_KEY, DEFAULT_DESK_SETTINGS } =
  await import('../shiftingDesks/preferences')

const SAVE_KEY = 'shifting-desks-run-v1'
const ENVELOPE_KEY = 'shifting-desks-envelope-opened-v1'
const OUTCOMES_KEY = 'shifting-desks-outcomes-v1'
const ENDINGS_KEY = 'shifting-desks-endings-v1'
const REWARDS_KEY = 'shifting-desks-rewards-v1'
const savedRun = newRun('valid-employee-progress', 'intern')
const values = new Map<string, string>([
  [SAVE_KEY, JSON.stringify(savedRun)],
  [SETTINGS_KEY, JSON.stringify(DEFAULT_DESK_SETTINGS)],
  [OUTCOMES_KEY, JSON.stringify(['orientation'])],
  [ENDINGS_KEY, JSON.stringify([])],
  [REWARDS_KEY, JSON.stringify({ version: 1, runs: [], milestones: {} })],
])
let unreadableKey: string | null = null
let refuseNextWrite: string | null = null
let writes = 0
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem(key: string) {
      if (key === unreadableKey) throw new Error('Storage access denied')
      return values.get(key) ?? null
    },
    setItem(key: string, value: string) {
      if (key === refuseNextWrite) {
        refuseNextWrite = null
        throw new Error('Storage quota exceeded')
      }
      writes++
      values.set(key, value)
    },
    removeItem(key: string) {
      writes++
      values.delete(key)
    },
  },
})

for (const key of [
  SETTINGS_KEY,
  OUTCOMES_KEY,
  ENDINGS_KEY,
  REWARDS_KEY,
  ENVELOPE_KEY,
]) {
  unreadableKey = key
  const before = [...values]
  const writeCount = writes
  setActivePinia(createPinia())
  const game = useShiftingDesksStore()
  assert.doesNotThrow(() => game.load(), `Unreadable ${key} must not abort load`)
  assert.equal(game.run?.seed, savedRun.seed)
  assert.equal(game.loaded, true)
  assert.equal(writes, writeCount, 'A partial load must not rewrite storage')
  assert.deepEqual([...values], before, 'Existing records must remain intact')
}

// An unreadable run slot must still preserve all independent collectible slots.
unreadableKey = SAVE_KEY
setActivePinia(createPinia())
const withoutRun = useShiftingDesksStore()
const writesBefore = writes
withoutRun.load()
assert.equal(withoutRun.run, null)
assert.deepEqual(withoutRun.discovered, ['orientation'])
assert.equal(writes, writesBefore)

unreadableKey = null
setActivePinia(createPinia())
const original = useShiftingDesksStore()
original.load()
const backupText = original.exportBackup()
assert.equal(isShiftingDesksBackupEnvelope(JSON.parse(backupText)), true)
const beforeInvalid = [...values]
assert.equal(original.importBackup('{"game":"unrelated"}'), false)
assert.deepEqual([...values], beforeInvalid)

refuseNextWrite = ENDINGS_KEY
assert.equal(original.importBackup(backupText), false)
assert.equal(original.run?.seed, savedRun.seed)
assert.deepEqual([...values], beforeInvalid, 'Failed import must roll back all slots')

// A portable backup restores a current run after local browser data is cleared.
values.clear()
setActivePinia(createPinia())
const imported = useShiftingDesksStore()
assert.equal(imported.importBackup(backupText), true)
assert.equal(imported.run?.seed, savedRun.seed)
assert.equal(JSON.parse(values.get(SAVE_KEY) ?? 'null').seed, savedRun.seed)
assert.deepEqual(imported.discovered, ['orientation'])
console.log('Shifting Desks live-store backup recovery and rollback passed')
