import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { checkArtPromptContract } from '../../server/utils/artPromptContract'
import {
  HOUSE_ROOMS,
  houseExits,
  houseRoom,
  houseWitnessEvidence,
  newHouseProgress,
  restoreHouseProgress,
  type HouseEnding,
  type HouseProgress,
  type HouseRoomId,
} from '../memoryDungeon/house'
import {
  HOUSE_EPILOGUES,
  HOUSE_EPILOGUE_LENSES,
  HOUSE_EPILOGUE_SIGNALS,
  houseEpilogue,
  houseEpilogueLens,
  validateHouseEpilogues,
} from '../memoryDungeon/houseEpilogues'
import { BRIAR_SCENES } from '../memoryDungeon/scenes'
import { newBriarSave, restoreBriarSave } from '../memoryDungeonWorld'
import { buildMemoryDungeonPlaybook } from '../playbook/memoryDungeon'

// Prototype-named object properties must never become authored chambers.
for (const key of ['constructor', 'toString', '__proto__']) {
  const forged = {
    current: key,
    visited: [key],
    decisions: Object.fromEntries([[key, 'release']]),
  }
  assert.equal(houseRoom(key), null)
  const restored = restoreHouseProgress(forged)!
  assert.equal(restored.current, 'HD-01')
  assert.deepEqual(restored.visited, ['HD-01'])
  assert.deepEqual(restored.decisions, {})
  assert.deepEqual(houseExits(restored.current, restored), ['HD-02', 'HD-07'])
}

// A valid room ID alone cannot prove travel. A forged distant Hearth and
// Bramble Chime must not survive when the intervening passages were never used.
const disconnectedHouse = restoreHouseProgress({
  current: 'HD-35',
  visited: ['HD-02', 'HD-35', 'HD-36'],
  decisions: { 'HD-02': 'weather', 'HD-35': 'renew', 'HD-36': 'entrust' },
  ending: 'renew',
  chimeClaimed: true,
})!
assert.equal(disconnectedHouse.current, 'HD-01')
assert.deepEqual(disconnectedHouse.visited, ['HD-01', 'HD-02'])
assert.deepEqual(disconnectedHouse.decisions, { 'HD-02': 'weather' })
assert.equal(disconnectedHouse.ending, null)
assert.equal(disconnectedHouse.chimeClaimed, false)

const adjacentLegacyHouse = restoreHouseProgress({
  current: 'HD-03',
  visited: ['HD-02'],
  decisions: { 'HD-03': 'route' },
})!
assert.equal(adjacentLegacyHouse.current, 'HD-03')
assert.deepEqual(adjacentLegacyHouse.visited, ['HD-01', 'HD-02', 'HD-03'])
assert.equal(adjacentLegacyHouse.decisions['HD-03'], 'route')

// Scylla's recorded manifest legitimately opens HD-10 → HD-25 without
// visiting the intervening numbered chambers.
const paths = new Map<HouseRoomId, HouseRoomId[]>([['HD-01', ['HD-01']]])
const routeQueue: HouseRoomId[] = ['HD-01']
for (let i = 0; i < routeQueue.length; i++) {
  const room = routeQueue[i]!
  for (const next of HOUSE_ROOMS[room]!.exits) {
    if (paths.has(next)) continue
    paths.set(next, [...paths.get(room)!, next])
    routeQueue.push(next)
  }
}
const connectedRooms = (...rooms: HouseRoomId[]): HouseRoomId[] => {
  const visited = new Set<HouseRoomId>(['HD-01'])
  for (const room of rooms) {
    const path = paths.get(room)
    assert.ok(path, `Authored route to ${room} exists`)
    for (const step of path) visited.add(step)
  }
  return [...visited]
}
// Reaching a legitimate room ID through the graph is insufficient when the
// final doorway is still locked by an unanswered Hearth.
const forgedHouseExit = restoreHouseProgress({
  current: 'HD-36',
  visited: connectedRooms('HD-36'),
  decisions: { 'HD-36': 'carry' },
  ending: null,
  chimeClaimed: true,
})!
assert.equal(forgedHouseExit.current, 'HD-01')
assert.ok(!forgedHouseExit.visited.includes('HD-36'))
assert.equal(forgedHouseExit.decisions['HD-36'], undefined)
assert.equal(forgedHouseExit.chimeClaimed, false)
const contradictoryExit = restoreHouseProgress({
  current: 'HD-36',
  visited: connectedRooms('HD-36'),
  decisions: { 'HD-35': 'renew', 'HD-36': 'carry' },
  ending: 'release',
})!
assert.ok(!contradictoryExit.visited.includes('HD-36'))

const routeToInventory = paths.get('HD-10')!
assert.ok(routeToInventory.length > 1)
const shortcutHouse = restoreHouseProgress({
  current: 'HD-25',
  visited: routeToInventory,
  decisions: { 'HD-10': 'manifest', 'HD-25': 'recount' },
})!
assert.equal(shortcutHouse.current, 'HD-25')
assert.equal(shortcutHouse.decisions['HD-25'], 'recount')
assert.equal(
  restoreHouseProgress({
    current: 'HD-25',
    visited: routeToInventory,
  })!.current,
  'HD-01',
  'The distant room is not reachable without the recorded shortcut',
)

// The House's twelve earned epilogues (kind_robots #4136 §9: three Hearth
// resolutions × four epilogue lenses). They are read from decisions the save
// already holds, so the contract here is: every one is reachable by real
// choices, none appears before the Hearth, and old saves acquire a stable lens.

const briarChoices = Object.fromEntries(
  Object.entries(BRIAR_SCENES).map(([key, scene]) => [
    key,
    scene.choices.map((choice) => choice.id),
  ]),
)
assert.deepEqual(validateHouseEpilogues(briarChoices), [])

const epilogues = Object.values(HOUSE_EPILOGUES)
assert.equal(epilogues.length, 12)
assert.equal(new Set(epilogues.map((e) => e.title)).size, 12)
assert.equal(new Set(epilogues.map((e) => e.artPath)).size, 12)
for (const epilogue of epilogues) {
  assert.ok(epilogue.artPath.startsWith('/images/memory-dungeon/house/'))
  assert.deepEqual(
    checkArtPromptContract({ prompt: epilogue.artPrompt, engine: 'krea2' }),
    [],
    `${epilogue.id} art prompt passes the enqueue contract`,
  )
  assert.ok(
    !/\b(?:no|not|without|story|symbol\w*|readable|composition)\b/i.test(
      epilogue.artPrompt,
    ),
    `${epilogue.id} art prompt is literal`,
  )
}

const resolutions: HouseEnding[] = ['release', 'renew', 'break']
const atHearth = (
  decisions: Record<string, string>,
  ending: HouseEnding | null,
): HouseProgress => ({
  ...newHouseProgress(),
  current: 'HD-35',
  decisions,
  ending,
})

// Nothing is decided before the Hearth resolution.
assert.equal(houseEpilogue(atHearth({}, null), {}), null)
assert.equal(houseEpilogue(null, {}), null)

// Each lens is reachable from House choices alone and from Briar choices
// alone, for every resolution.
for (const lens of HOUSE_EPILOGUE_LENSES) {
  const signals = HOUSE_EPILOGUE_SIGNALS[lens]
  const house = Object.fromEntries(
    signals.filter(([scope]) => scope === 'house').map(([, k, c]) => [k, c]),
  )
  const briar = Object.fromEntries(
    signals.filter(([scope]) => scope === 'briar').map(([, k, c]) => [k, c]),
  )
  for (const resolution of resolutions) {
    assert.equal(
      houseEpilogue(atHearth(house, resolution), {})?.id,
      `${resolution}-${lens}`,
      `${resolution}-${lens} is reachable inside the House`,
    )
    assert.equal(
      houseEpilogue(atHearth({}, resolution), briar)?.id,
      `${resolution}-${lens}`,
      `${resolution}-${lens} is reachable from the Briar road`,
    )
  }
}

// Ties resolve the same way every time: an undecided road is community.
assert.equal(houseEpilogueLens({ decisions: {} }, {}), 'community')

// Seeded House journeys: walk the real door graph, make real choices, take
// the Warden's petition only with witness evidence, and resolve at the Hearth.
function rng(seed: number) {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}
const pick = <T>(random: () => number, items: readonly T[]): T =>
  items[Math.floor(random() * items.length)]!

const reached = new Set<string>()
for (let seed = 1; seed <= 1500; seed++) {
  const random = rng(seed)
  const lean = pick(random, HOUSE_EPILOGUE_LENSES)
  const leaning = new Set(
    HOUSE_EPILOGUE_SIGNALS[lean].map(([, key, choice]) => `${key}:${choice}`),
  )
  const choose = (key: string, ids: readonly string[]) => {
    const preferred = ids.filter((id) => leaning.has(`${key}:${id}`))
    return preferred.length && random() < 0.7
      ? pick(random, preferred)
      : pick(random, ids)
  }
  const briar: Record<string, string> = {}
  for (const [key, ids] of Object.entries(briarChoices))
    if (random() < 0.6) briar[key] = choose(key, ids)

  let progress = newHouseProgress()
  for (let step = 0; step < 400 && progress.current !== 'HD-36'; step++) {
    const room = HOUSE_ROOMS[progress.current]!
    if (!progress.decisions[room.id] && room.id !== 'HD-35') {
      let ids = room.choices.map((choice) => choice.id)
      if (room.id === 'HD-32' && !houseWitnessEvidence(progress, briar))
        ids = ids.filter((id) => id !== 'petition')
      const id = choose(room.id, ids)
      progress = {
        ...progress,
        decisions: { ...progress.decisions, [room.id]: id },
        wardenPassed:
          progress.wardenPassed ||
          (room.id === 'HD-32' && (id === 'petition' || id === 'fight')),
      }
    }
    if (room.id === 'HD-35' && !progress.ending) {
      assert.equal(houseEpilogue(progress, briar), null)
      const ending = pick(random, resolutions)
      progress = {
        ...progress,
        ending,
        endingLens: houseEpilogueLens(progress, briar),
        decisions: { ...progress.decisions, 'HD-35': ending },
      }
    }
    const doors = houseExits(progress.current, progress)
    const fresh = doors.filter((door) => !progress.visited.includes(door))
    const next: HouseRoomId = doors.includes('HD-36')
      ? 'HD-36'
      : fresh.includes('HD-35') || fresh.includes('HD-33')
        ? fresh.includes('HD-35')
          ? 'HD-35'
          : 'HD-33'
        : pick(random, fresh.length ? fresh : doors)
    progress = {
      ...progress,
      current: next,
      visited: [...new Set([...progress.visited, next])],
    }
  }
  assert.equal(progress.current, 'HD-36', `seed ${seed} reaches the exit`)
  const epilogue = houseEpilogue(progress, briar)
  assert.ok(epilogue, `seed ${seed} earns an epilogue`)
  assert.equal(epilogue.resolution, progress.ending)
  reached.add(epilogue.id)

  // Saves keep only what they kept before; the epilogue survives a reload.
  const saved = JSON.parse(JSON.stringify(progress))
  const restored = restoreHouseProgress(saved)!
  assert.deepEqual(Object.keys(restored).sort(), Object.keys(progress).sort())
  assert.equal(houseEpilogue(restored, briar)?.id, epilogue.id)
}
assert.equal(reached.size, 12, `seeded journeys reach all twelve epilogues`)

// A save from before the epilogues, with a Hearth resolution and no other
// decisions, still resolves.
const legacy = restoreHouseProgress({
  current: 'HD-36',
  visited: connectedRooms('HD-35', 'HD-36'),
  decisions: { 'HD-35': 'renew' },
  ending: 'renew',
  wardenPassed: true,
  combatOrigin: null,
  chimeClaimed: false,
})
assert.equal(houseEpilogue(legacy, {})?.id, 'renew-community')

// The earned lens is frozen when the Hearth is resolved. Revisiting unfinished
// rooms can reveal new evidence, but cannot silently rewrite an earned ending.
const locked = {
  ...atHearth({ 'HD-04': 'share', 'HD-05': 'open' }, 'renew'),
  wardenPassed: true,
  visited: connectedRooms(
    'HD-04',
    'HD-05',
    'HD-15',
    'HD-17',
    'HD-20',
    'HD-21',
    'HD-25',
    'HD-33',
    'HD-35',
  ),
}
locked.endingLens = houseEpilogueLens(locked, {})
assert.equal(locked.endingLens, 'community')
const laterChoices = {
  ...locked,
  decisions: {
    ...locked.decisions,
    'HD-15': 'question',
    'HD-17': 'read',
    'HD-20': 'testify',
    'HD-21': 'archive',
    'HD-25': 'recount',
    'HD-33': 'reveal',
  },
}
assert.equal(houseEpilogueLens(laterChoices, {}), 'honesty')
assert.equal(houseEpilogue(laterChoices, {})?.id, 'renew-community')
const savedAfterBacktracking = restoreBriarSave({
  ...newBriarSave(),
  house: laterChoices,
})
assert.equal(savedAfterBacktracking.house?.endingLens, 'community')
assert.equal(
  houseEpilogue(savedAfterBacktracking.house, {})?.id,
  'renew-community',
)

// Pre-existing saves have no snapshot. Hydration derives it once from valid
// recorded choices, so subsequent scene discoveries cannot change that result.
const oldSave = restoreBriarSave({
  ...newBriarSave(),
  revealed: ['1,5'],
  visited: ['1,5'],
  sceneChoices: { '1,5': 'wake' },
  house: { ...legacy, endingLens: undefined },
})
assert.equal(oldSave.house?.endingLens, 'honesty')
const continued = restoreBriarSave({
  ...oldSave,
  revealed: ['1,5', '1,2', '1,8'],
  visited: ['1,5', '1,2', '1,8'],
  sceneChoices: { ...oldSave.sceneChoices, '1,2': 'warn', '1,8': 'plant' },
})
assert.equal(
  houseEpilogue(continued.house, continued.sceneChoices)?.id,
  'renew-honesty',
)
assert.equal(
  restoreHouseProgress({ ...laterChoices, endingLens: 'forged' })?.endingLens,
  null,
  'Invalid saved epilogue lenses cannot be accepted',
)

// The Forge sees twelve illustrated epilogue beats and keeps the Hearth
// resolutions as the choice that leads to them.
const book = buildMemoryDungeonPlaybook()
const beats = Object.values(book.nodes).filter((node) =>
  node.key.startsWith('house-epilogue:'),
)
assert.equal(beats.length, 12)
assert.ok(beats.every((node) => node.kind === 'ending' && node.needsArt))
assert.ok(
  ['release', 'renew', 'break'].every(
    (id) => book.nodes[`house-ending:${id}`]?.kind === 'crossroads',
  ),
)
assert.equal(
  Object.values(book.nodes).filter((node) => node.kind === 'ending').length,
  14,
)

// The House screen shows the earned epilogue at the exit.
const stage = readFileSync('components/memory-dungeon/house-stage.vue', 'utf8')
assert.match(stage, /data-testid="memory-house-epilogue"/)
assert.match(stage, /world\.houseEpilogue/)
const store = readFileSync('stores/memoryWorldStore.ts', 'utf8')
assert.match(store, /earnedHouseEpilogue\(state\.value\.house/)
assert.match(
  store,
  /house\.endingLens = houseEpilogueLens\(house, state\.value\.sceneChoices\)/,
)

console.log(
  `Memory House epilogues: 12 earned endings (3 Hearth resolutions × 4 lenses), ${reached.size}/12 reached by 1500 seeded journeys, Hearth lens locked and legacy saves migrated`,
)
