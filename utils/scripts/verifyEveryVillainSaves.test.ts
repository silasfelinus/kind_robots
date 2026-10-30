import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { reactive } from 'vue'
import {
  applyChoice,
  createStory,
  enqueueBeat,
} from '../everyVillainTactics/firstBellStory'
import {
  EVT_SAVE_VERSION,
  checksumV1,
  clearSlot,
  createSave,
  evtSaveKey,
  latestSave,
  loadSave,
  readSlot,
  saveChecksum,
  serializeSave,
  summarizeSave,
  writeSlot,
  type EvtSave,
  type SaveStorage,
} from '../everyVillainTactics/saves'
import { clonePreset } from '../everyVillainTactics/studio'
import {
  endTurn,
  fireSelected,
  moveSelected,
  trainingState,
  useSelectedPower,
  selectedPowerTargets,
  type TrainingState,
} from '../everyVillainTactics/training'

function memoryStorage(): SaveStorage & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, String(value)),
    removeItem: (key) => void data.delete(key),
  }
}
const failing: SaveStorage = {
  getItem: () => {
    throw new Error('blocked')
  },
  setItem: () => {
    throw new Error('quota')
  },
  removeItem: () => {
    throw new Error('blocked')
  },
}

// Play into the middle of a story battle: approach choice, a move, a shot,
// a signature power and two rival phases, so RNG, cooldowns and beats move.
function playOpening() {
  const state = trainingState(0x53a1b7, undefined, { lead: 'accident-fire' })
  const story = createStory()
  assert.ok(applyChoice(story, state, 'hero', 'service'))
  moveSelected(state, { x: 2, y: 4 })
  fireSelected(
    state,
    state.units.find((u) => u.id === 'remy')!,
  )
  state.selected = 'hattie'
  useSelectedPower(state, selectedPowerTargets(state)[0]!)
  endTurn(state)
  enqueueBeat(story, state)
  if (story.current === 'alarm') applyChoice(story, state, 'hero', 'rescue')
  endTurn(state)
  enqueueBeat(story, state)
  return { state, story }
}
function continueBattle(state: TrainingState) {
  state.selected = 'priya'
  const priya = state.units.find((u) => u.id === 'priya')!
  if (priya.hp > 0) {
    const target = state.units.find((u) => u.team === 'rival' && u.hp > 0)
    if (target) fireSelected(state, target)
  }
  for (let turn = 0; turn < 3 && state.phase === 'active'; turn++)
    endTurn(state)
  return state
}

const { state, story } = playOpening()
assert.ok(state.turn >= 3)
assert.ok(state.fired!.includes('fire-alarm'), 'turn-three alarm is recorded')
assert.ok(state.fired!.includes('story:arrival'))
const hattie = state.units.find((u) => u.id === 'hattie')!
assert.ok(hattie.power && (hattie.powerCooldown ?? 0) >= 0)

const store = memoryStorage()
const save = createSave({
  slot: 'slot-1',
  perspective: 'hero',
  leadSignature: 'accident-fire',
  stage: null,
  state,
  story,
  savedAt: '2026-10-30T12:00:00.000Z',
})
assert.equal(save.version, EVT_SAVE_VERSION)
assert.equal(save.mode, 'story')
assert.ok(writeSlot(store, save))
assert.ok(store.data.has('kr-every-villain-tactics:save:slot-1'))
assert.ok(
  [...store.data.keys()].every((key) => !key.startsWith('comet-city-academy')),
  'Prom of Doom save keys are never touched',
)
const loaded = readSlot(store, 'slot-1')
assert.ok(loaded?.ok, loaded && !loaded.ok ? loaded.reason : 'empty')
assert.equal(loaded.migrated, false)
assert.deepEqual(loaded.save.state, state, 'exact battle round-trips')
assert.deepEqual(loaded.save.story, story)
assert.equal(loaded.save.state.seed, state.seed, 'RNG state is preserved')

// The reloaded fight continues exactly like the uninterrupted one.
const live = continueBattle(structuredClone(state))
const resumed = continueBattle(structuredClone(loaded.save.state))
assert.deepEqual(resumed.units, live.units)
assert.equal(resumed.seed, live.seed)
assert.deepEqual(resumed.fired, live.fired)
assert.equal(
  resumed.events.filter((e) => e.includes('fire alarm')).length,
  live.events.filter((e) => e.includes('fire alarm')).length,
)

// Slots: empty, latest, copy protection, clearing and blocked storage.
assert.equal(readSlot(store, 'slot-2'), null)
const later = createSave({
  ...save,
  slot: 'auto',
  savedAt: '2026-10-30T12:05:00.000Z',
})
writeSlot(store, later)
assert.equal(latestSave([save, later])?.slot, 'auto')
assert.equal(summarizeSave(later).lead, 'Backdraft')
assert.equal(summarizeSave(later).title, 'First Bell')
store.setItem(evtSaveKey('slot-3'), serializeSave(save))
const copied = readSlot(store, 'slot-3')
assert.ok(copied && !copied.ok && /another slot/.test(copied.reason))
clearSlot(store, 'slot-3')
assert.equal(readSlot(store, 'slot-3'), null)
assert.equal(writeSlot(failing, save), false)
assert.equal(readSlot(failing, 'slot-1')?.ok, false)
clearSlot(failing, 'slot-1')
assert.equal(readSlot(null, 'slot-1'), null)

// Tampering: a raw edit breaks the checksum.
const edited = JSON.parse(serializeSave(save)) as EvtSave
edited.state.units[0]!.hp = 4
const tampered = loadSave(JSON.stringify(edited))
assert.ok(!tampered.ok && /Checksum/.test(tampered.reason))
// Forgery: a recomputed checksum still cannot bend the rules.
function forge(mutate: (save: EvtSave) => void): string {
  const copy = structuredClone(save)
  mutate(copy)
  const { checksum: _drop, ...payload } = copy
  copy.checksum = saveChecksum(payload)
  const result = loadSave(serializeSave(copy))
  assert.equal(result.ok, false, 'forgery accepted')
  return result.ok ? '' : result.reason
}
assert.match(
  forge((s) => (s.state.units[0]!.maxHp = 99)),
  /forged maxHp/,
)
assert.match(
  forge((s) => (s.state.units[0]!.hp = 99)),
  /HP is invalid/,
)
assert.match(
  forge((s) => (s.state.units[1]!.aim = 120)),
  /forged aim/,
)
assert.match(
  forge((s) => (s.state.units[2]!.power = 'alien-fire')),
  /forged power/,
)
assert.match(
  forge((s) => (s.state.units[0]!.identity = 'psychic-genius')),
  /forged identity/,
)
assert.match(
  forge((s) => Object.assign(s.state.units[0]!, { godMode: true })),
  /Unexpected unit field/,
)
assert.match(
  forge((s) => Object.assign(s.state.units[0]!, { x: 3, y: 1 })),
  /in a wall/,
)
assert.match(
  forge((s) => (s.state.seed = 0)),
  /RNG/,
)
assert.match(
  forge((s) => (s.state.units[0]!.ap = 7)),
  /AP/,
)
assert.match(
  forge(
    (s) => (s.state.units.find((u) => u.id === 'hattie')!.powerCooldown = 9),
  ),
  /recharge/,
)
assert.match(
  forge(
    (s) => (s.state.units.find((u) => u.id === 'hattie')!.powerSpent = true),
  ),
  /power use/,
)
assert.match(
  forge((s) => (s.state.map.tiles = {})),
  /terrain/,
)
assert.match(
  forge((s) => s.state.units.pop()),
  /roster/,
)
assert.match(
  forge((s) => {
    s.story.seen.push('victory')
    s.story.decisions.push('finish')
  }),
  /trigger history/,
)
assert.match(
  forge((s) => (s.story.completed = true)),
  /ending/,
)
assert.match(
  forge((s) => (s.state.fired = ['dragon'])),
  /Trigger history/,
)
assert.match(
  forge((s) => (s.mode = 'oneshot')),
  /mode/,
)
assert.match(
  forge((s) => (s.leadSignature = 'nobody' as never)),
  /canonical/,
)
const units = save.state.units
const twin = forge((s) => {
  const [a, b] = s.state.units.filter((u) => u.hp > 0)
  b!.x = a!.x
  b!.y = a!.y
})
assert.match(twin, /share a tile/)
assert.ok(units.length === 6)
assert.match((loadSave('{nope') as { reason: string }).reason, /readable JSON/)
assert.match(
  (loadSave({ kind: 'comet-city-academy' }) as { reason: string }).reason,
  /not an Every Villain/,
)
assert.match(
  (loadSave({ ...save, version: 99 }) as { reason: string }).reason,
  /newer/,
)

// One-shot battles keep their own stage and never pose as story saves.
const picnic = clonePreset('picnic-plaza')
const oneShot = trainingState(9, picnic, { lead: 'mutant-earth' })
endTurn(oneShot)
const shotSave = createSave({
  slot: 'slot-2',
  perspective: 'villain',
  leadSignature: 'mutant-earth',
  stage: picnic,
  state: oneShot,
  story: { ...createStory(), current: null },
})
assert.equal(shotSave.mode, 'oneshot')
const shotLoad = loadSave(serializeSave(shotSave))
assert.ok(shotLoad.ok, shotLoad.ok ? '' : shotLoad.reason)
assert.deepEqual(shotLoad.save.state, oneShot)
assert.equal(summarizeSave(shotLoad.save).title, 'Picnic Panic')
const burrower = shotLoad.save.state.units.find((u) => u.henchmanType)!
assert.equal(burrower.maxHp, 1, 'one-hit henchmen stay one-hit')

// Migration: a version-1 pre-role battle loads onto the legacy profile.
const legacyState = trainingState(77, undefined, { roles: false })
delete legacyState.fired
legacyState.turn = 3
const legacyStory = createStory()
applyChoice(legacyStory, legacyState, 'sidekick', 'catwalk')
const v1Payload = {
  kind: 'every-villain-tactics',
  version: 1,
  slot: 'slot-3',
  savedAt: '2026-10-29T08:00:00.000Z',
  perspective: 'sidekick',
  leadSignature: 'accident-fire',
  state: legacyState,
  story: legacyStory,
}
const v1 = { ...v1Payload, checksum: checksumV1(v1Payload) }
const migrated = loadSave(JSON.stringify(v1))
assert.ok(migrated.ok, migrated.ok ? '' : migrated.reason)
assert.equal(migrated.migrated, true)
assert.equal(migrated.save.version, 2)
assert.equal(migrated.save.mode, 'story')
assert.deepEqual(migrated.save.state.fired, ['story:arrival', 'fire-alarm'])
assert.ok(migrated.save.state.units.every((u) => u.role === undefined))
const resaved = loadSave(serializeSave(createSave({ ...migrated.save })))
assert.ok(resaved.ok, 'a migrated battle can be saved again as version 2')
const badV1 = loadSave(
  JSON.stringify({ ...v1, savedAt: '2026-10-29T09:00:00Z' }),
)
assert.ok(!badV1.ok && /Version 1 checksum/.test(badV1.reason))

const page = readFileSync(
  new URL('../../pages/admin/every-villain-tactics.vue', import.meta.url),
  'utf8',
)
assert.match(page, /data-testid="tactics-continue"/)
assert.match(page, /data-testid="tactics-save-slot"/)
assert.match(page, /store\.continueLatest\(\)/)
// The store saves Vue reactive state; structuredClone rejects proxies, which
// silently broke browser saves until createSave copied through JSON.
const reactiveRun = reactive({
  state: trainingState(0x53a1b7, undefined, { lead: 'accident-fire' }),
  story: createStory(),
})
const fromProxy = createSave({
  slot: 'slot-3',
  perspective: 'hero',
  leadSignature: 'accident-fire',
  stage: null,
  state: reactiveRun.state,
  story: reactiveRun.story,
  savedAt: '2026-10-30T15:00:00.000Z',
})
assert.ok(loadSave(serializeSave(fromProxy)).ok, 'reactive state saves')

console.log(
  'Every Villain saves: versioned slots, exact RNG/trigger round-trip, tamper and forgery rejection, one-shot isolation and v1 migration verified.',
)
