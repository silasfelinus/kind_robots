// Emperor of Dust persistence through the real Pinia store (conductor
// emperor-of-dust t-018, t-032). Pure codecs are covered in
// verifyEmperorFortress.test.ts; this drives useEmperorFortressStore in Node
// against a fake localStorage that can be full, blocked or throw on access,
// and reloads by building a fresh Pinia, as a page refresh does.
// SYSTEMS-V03 "Saves, load and rewind": unreadable data is never written
// over, blocked or full storage is reported, and the relic vault and Codex
// outlive new runs, rewinds and reloads.
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'

// The store's achievement and Playbook live-text imports need the Nuxt app;
// swap them for inert stand-ins so the store itself runs unchanged. The hook
// runs in-thread ahead of tsx's own resolver and ignores any query string tsx
// adds to the importing file's URL.
const stub = (src: string) => `data:text/javascript,${encodeURIComponent(src)}`
const STUBS: Record<string, string> = {
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
    const url = parent.endsWith('/stores/emperorFortressStore.ts')
      ? STUBS[specifier]
      : undefined
    return url ? { url, shortCircuit: true } : nextResolve(specifier, context)
  },
})

const { createPinia, setActivePinia } = await import('pinia')
const { useEmperorFortressStore } =
  await import('../../stores/emperorFortressStore')
const { createRun, earnFlag, finishDay } =
  await import('../emperorOfDust/fortress/engine')
const { decodeBook, encodeBook, newBook, recordDawn } =
  await import('../emperorOfDust/fortress/saves')
const { decodeRelicVault, encodeRelicVault } =
  await import('../emperorOfDust/fortress/relics')

const AUTO = 'kr-emperor-of-dust-fortress-auto-v3'
const CODEX = 'kr-emperor-of-dust-codex-v1'
const RELICS = 'kr-emperor-of-dust-relic-vault-v1'
const slotKey = (slot: number) => `kr-emperor-of-dust-fortress-slot-${slot}-v3`

/** A Web Storage stand-in that keeps the old value when a write is refused. */
class FakeStorage {
  data = new Map<string, string>()
  quota = Infinity
  failGet = false
  failSet = false
  writes = 0
  used(): number {
    let total = 0
    for (const [key, value] of this.data) total += key.length + value.length
    return total
  }
  get length() {
    return this.data.size
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null
  }
  getItem(key: string): string | null {
    if (this.failGet)
      throw new DOMException('Access is denied', 'SecurityError')
    return this.data.get(key) ?? null
  }
  setItem(key: string, value: string) {
    if (this.failSet)
      throw new DOMException('Access is denied', 'SecurityError')
    const next =
      this.used() - (this.data.get(key)?.length ?? 0) + String(value).length
    if (next + (this.data.has(key) ? 0 : key.length) > this.quota)
      throw new DOMException(
        'The quota has been exceeded',
        'QuotaExceededError',
      )
    this.data.set(key, String(value))
    this.writes += 1
  }
  removeItem(key: string) {
    if (this.failSet)
      throw new DOMException('Access is denied', 'SecurityError')
    this.data.delete(key)
  }
  clear() {
    this.data.clear()
  }
}

let storage: FakeStorage = new FakeStorage()
let accessThrows = false
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  get() {
    // A sandboxed or cookie-blocked document throws on the property itself.
    if (accessThrows)
      throw new DOMException('The operation is insecure.', 'SecurityError')
    return storage
  },
})

/** A page load: a fresh Pinia, then the store's own load(). */
const reload = () => {
  setActivePinia(createPinia())
  const court = useEmperorFortressStore()
  court.load()
  return court
}
const fresh = () => {
  storage = new FakeStorage()
  accessThrows = false
  return storage
}

// --- a first visit saves a Day 1 run and reloads it --------------------------
{
  fresh()
  const court = reload()
  assert.equal(court.storageWarning, '')
  assert.equal(court.day, 1)
  const saved = decodeBook(storage.data.get(AUTO) ?? null)
  assert.ok(saved, 'the first dawn is autosaved')
  court.finish()
  const again = reload()
  assert.equal(again.day, 2, 'a reload resumes the saved day')
  assert.deepEqual(again.book, court.book)
  assert.deepEqual(again.rewindableDays, [1, 2])
}

// --- relic vault: ownership, next loadout, new runs and reloads -------------
{
  fresh()
  storage.data.set(
    RELICS,
    encodeRelicVault({
      version: 1,
      owned: ['eye-of-elder-crow'],
      nextLoadout: ['eye-of-elder-crow'],
      slots: 1,
    }),
  )
  const court = reload()
  assert.deepEqual(court.relicVault.owned, ['eye-of-elder-crow'])
  assert.deepEqual(
    court.run!.equippedRelics,
    ['eye-of-elder-crow'],
    'a first run carries the chosen relic',
  )
  court.setNextRelics([])
  assert.deepEqual(decodeRelicVault(storage.data.get(RELICS)!)?.nextLoadout, [])
  assert.deepEqual(
    court.run!.equippedRelics,
    ['eye-of-elder-crow'],
    'a loadout change waits for the next run',
  )
  court.newRun()
  assert.deepEqual(
    court.run!.equippedRelics,
    [],
    'the new run takes the change',
  )
  court.setNextRelics(['eye-of-elder-crow'])
  // Claiming through the story branch, then surviving a rewind and reload.
  court.learn('relic-hourglass-earned')
  assert.deepEqual(court.claimable, ['komodo-brass-hourglass'])
  court.claimRelic('komodo-brass-hourglass')
  court.finish()
  court.rewind(1)
  const after = reload()
  assert.deepEqual(
    after.relicVault.owned,
    ['eye-of-elder-crow', 'komodo-brass-hourglass'],
    'relics are never rolled back by a rewind or a reload',
  )
  assert.deepEqual(after.relicVault.nextLoadout, ['eye-of-elder-crow'])
  assert.throws(
    () => after.setNextRelics(['eye-of-elder-crow', 'komodo-brass-hourglass']),
    /slots/,
    'two relics need the second slot',
  )
  after.newRun()
  assert.deepEqual(after.run!.equippedRelics, ['eye-of-elder-crow'])
}

// --- the Codex survives rewinds and reloads ---------------------------------
{
  fresh()
  const court = reload()
  court.finish()
  court.learn('talk-saffron-insignia')
  const learned = [...court.codex.revealed]
  assert.ok(learned.length > 0, 'a story flag reveals an allegiance')
  court.rewind(1)
  assert.deepEqual(reload().codex.revealed, learned, 'the Codex is kept')
}

// --- a malformed relic vault is reported and never overwritten --------------
{
  fresh()
  storage.data.set(RELICS, '{"version":1,"owned":["nope"]}')
  const court = reload()
  assert.match(court.storageWarning, /relic vault could not be read/)
  court.finish()
  assert.match(
    court.storageWarning,
    /relic vault could not be read/,
    'a good autosave does not hide the unreadable vault',
  )
  assert.throws(() => court.setNextRelics([]), /unreadable/)
  court.learn('relic-eye-earned')
  assert.throws(() => court.claimRelic('eye-of-elder-crow'), /unreadable/)
  court.newRun()
  assert.equal(storage.data.get(RELICS), '{"version":1,"owned":["nope"]}')
}

// --- an unreadable autosave is never overwritten ----------------------------
{
  fresh()
  storage.data.set(AUTO, '{"version":3,"current":')
  const court = reload()
  assert.match(court.storageWarning, /autosave could not be read/)
  court.finish()
  court.learn('heard:anything')
  assert.equal(
    storage.data.get(AUTO),
    '{"version":3,"current":',
    'playing on does not write over the unreadable autosave',
  )
  assert.match(reload().storageWarning, /autosave could not be read/)
  // Starting a new run is the player's explicit choice to replace it.
  court.newRun()
  assert.doesNotMatch(court.storageWarning, /autosave/)
  assert.ok(decodeBook(storage.data.get(AUTO)!), 'the new run is saved')
}
{
  // Loading a slot is the other way out.
  fresh()
  const slotBook = newBook(createRun(5))
  storage.data.set(AUTO, 'garbage')
  const court = reload()
  court.newRun()
  court.saveToSlot(0, 'kept')
  storage.data.set(AUTO, 'garbage')
  const back = reload()
  assert.match(back.storageWarning, /autosave could not be read/)
  back.loadFromSlot(0)
  assert.equal(back.storageWarning, '')
  assert.deepEqual(decodeBook(storage.data.get(AUTO)!), back.book)
  assert.ok(slotBook)
}

// --- an unreadable Codex is never overwritten -------------------------------
{
  fresh()
  storage.data.set(CODEX, '{"version":1,"revealed":[7]}')
  const court = reload()
  assert.match(court.storageWarning, /Codex could not be read/)
  court.learn('talk-saffron-insignia')
  assert.ok(court.codex.revealed.length > 0, 'this visit still learns')
  assert.equal(storage.data.get(CODEX), '{"version":1,"revealed":[7]}')
}

// --- unreadable slots are shown and kept until cleared ----------------------
{
  fresh()
  storage.data.set(slotKey(1), '{"version":3,"label":"x"}')
  const court = reload()
  assert.deepEqual(court.slotUnreadable, [false, true, false])
  assert.equal(court.slots[1], null)
  assert.throws(() => court.saveToSlot(1, 'over it'), /not overwritten/)
  assert.equal(storage.data.get(slotKey(1)), '{"version":3,"label":"x"}')
  court.saveToSlot(0, 'fine')
  court.clearSlot(1)
  assert.equal(storage.data.has(slotKey(1)), false)
  assert.deepEqual(court.slotUnreadable, [false, false, false])
  court.saveToSlot(1, 'now')
  assert.equal(reload().slots[1]?.label, 'now')
}

// --- a full store: the warning shows and the last save stays good -----------
{
  fresh()
  const court = reload()
  court.finish()
  court.finish()
  const before = storage.data.get(AUTO)!
  storage.quota = storage.used() // not one more character fits
  court.finish()
  assert.match(court.storageWarning, /unavailable or full/)
  assert.equal(storage.data.get(AUTO), before, 'the previous autosave stands')
  assert.throws(() => court.saveToSlot(2, 'no room'), /could not be written/)
  assert.equal(court.slots[2], null)
  assert.throws(
    () => court.setNextRelics([]),
    /could not be saved/,
    'the vault reports a refused write',
  )
  assert.equal(reload().day, 3, 'a reload resumes from the last good save')
  // With room again, the next order saves and the warning clears.
  storage.quota = Infinity
  court.finish()
  assert.equal(court.storageWarning, '')
  assert.equal(reload().day, 5)
}
{
  // A Codex write that failed while full is written once there is room.
  fresh()
  const court = reload()
  storage.quota = storage.used()
  court.learn('talk-saffron-insignia')
  assert.equal(storage.data.has(CODEX), false)
  storage.quota = Infinity
  court.finish()
  assert.ok(storage.data.has(CODEX), 'the Codex catches up')
  assert.equal(court.storageWarning, '')
}

// --- localStorage that throws on access -------------------------------------
{
  fresh()
  storage.data.set(AUTO, encodeBook(newBook(createRun(9))))
  accessThrows = true
  const court = reload() // must not throw
  assert.equal(court.loaded, true)
  assert.match(court.storageWarning, /blocked/)
  court.finish()
  assert.equal(court.day, 2, 'the run plays on in memory')
  assert.throws(() => court.saveToSlot(0, 'x'), /could not be written/)
  assert.throws(() => court.setNextRelics([]), /could not be saved/)
  assert.deepEqual(court.relicVault.owned, [])
  accessThrows = false
  assert.equal(
    decodeBook(storage.data.get(AUTO)!)?.current.seed,
    9,
    'nothing reached the stored run',
  )
}
{
  // getItem itself throws while setItem would work: nothing is written over.
  fresh()
  storage.data.set(AUTO, encodeBook(newBook(createRun(11))))
  storage.data.set(
    RELICS,
    encodeRelicVault({
      version: 1,
      owned: ['eye-of-elder-crow'],
      nextLoadout: [],
      slots: 1,
    }),
  )
  storage.data.set(CODEX, '{"version":1,"revealed":["t-1"]}')
  const snapshot = new Map(storage.data)
  storage.failGet = true
  const court = reload()
  assert.match(court.storageWarning, /autosave could not be read/)
  assert.match(court.storageWarning, /relic vault could not be read/)
  assert.match(court.storageWarning, /Codex could not be read/)
  court.finish()
  court.learn('talk-saffron-insignia')
  assert.throws(() => court.setNextRelics([]), /unreadable/)
  assert.deepEqual(storage.data, snapshot, 'every unread key is left alone')
}

// --- an old (version 3, uncompacted) book migrates on read -------------------
{
  fresh()
  let book = newBook(createRun(21))
  for (let i = 0; i < 6; i += 1)
    book = recordDawn(book, finishDay(earnFlag(book.current, `x-${i}`)).run)
  const legacy = JSON.stringify(book)
  assert.equal(JSON.parse(legacy).version, 3)
  storage.data.set(AUTO, legacy)
  const court = reload()
  assert.equal(court.storageWarning, '')
  assert.deepEqual(court.book, book, 'a version 3 book loads as it was')
  court.finish()
  const written = JSON.parse(storage.data.get(AUTO)!)
  assert.equal(written.version, 4, 'it is written back packed')
  assert.ok(storage.data.get(AUTO)!.length < legacy.length + 2_000)
  const back = reload()
  assert.deepEqual(back.book, court.book)
  back.rewind(3)
  assert.deepEqual(
    { ...back.book!.dawns[1] },
    { ...book.dawns[1] },
    'earlier dawns survive the round trip exactly',
  )
}

console.log('Emperor of Dust store persistence: ok')
