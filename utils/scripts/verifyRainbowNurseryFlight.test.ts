import assert from 'node:assert/strict'
import { readRainbowSave } from '../arcade/games/rainbowLoadouts'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import {
  KELP_CHOIR,
  KELP_CHOIR_PODS,
  NURSERY,
  NURSERY_FLIGHT,
  NURSERY_FLIGHT_SECTIONS,
  NURSERY_WAVES,
  NURSERY_TALKS,
  choirFreed,
  choirMaskFitsFrame,
  choirPodAvailable,
  choirPodX,
  nurseryDetourFor,
  nurseryFlightCheckpointValid,
  nurseryFlightPhase,
  nurserySpawns,
  rescueChoirPod,
} from '../arcade/games/rainbowLanternNursery'

assert.equal(NURSERY_FLIGHT.id, 'X1')
assert.equal(NURSERY_FLIGHT.name, 'Kelp Nebula Bypass')
assert.equal(KELP_CHOIR_PODS.length, 5)
assert.equal(NURSERY_WAVES.length, 20)
assert.deepEqual(Object.keys(NURSERY_TALKS), ['opening', 'turn', 'aftermath'])
for (const lines of Object.values(NURSERY_TALKS)) {
  assert.equal(lines.length, 3)
  assert.ok(lines.some((line) => line.speaker === 'Lilt-7'))
}
assert.equal(NURSERY_FLIGHT_SECTIONS.length, 6)
assert.equal(NURSERY_FLIGHT_SECTIONS[0]!.from, NURSERY.openingEnds)
assert.equal(NURSERY_FLIGHT_SECTIONS.at(-1)!.to, NURSERY_FLIGHT.end)
for (let i = 1; i < NURSERY_FLIGHT_SECTIONS.length; i++)
  assert.equal(
    NURSERY_FLIGHT_SECTIONS[i]!.from,
    NURSERY_FLIGHT_SECTIONS[i - 1]!.to,
  )
for (const seats of [1, 2, 3, 4]) {
  const low = Array.from({ length: seats }, () => 170)
  assert.equal(nurseryDetourFor(low, true, true), true)
  assert.equal(nurseryDetourFor(low, false, true), false)
  assert.equal(nurseryDetourFor(low, true, false), false)
  assert.equal(
    nurseryDetourFor(
      Array.from({ length: seats }, () => 80),
      true,
      true,
    ),
    false,
  )
}
assert.equal(nurseryDetourFor([180, 70], true, true), true)
assert.equal(nurseryDetourFor([70, 180], true, true), false)
assert.equal(nurseryDetourFor([180, 70, 70, 180], true, true), true)
assert.equal(nurseryDetourFor([70, 180, 180, 70], true, true), false)
assert.equal(nurseryDetourFor([], true, true), false)
assert.equal(nurseryDetourFor([Number.NaN], true, true), false)

assert.equal(nurseryFlightPhase(0), 'opening')
assert.equal(nurseryFlightPhase(240), 'waves')
assert.equal(nurseryFlightPhase(3600), 'guardian')
assert.equal(nurseryFlightPhase(4380), 'exit')
assert.equal(nurseryFlightPhase(5100), 'done')
let mask = 0
for (const pod of KELP_CHOIR_PODS) {
  assert.equal(choirPodAvailable(pod.at, mask)?.id, pod.id)
  assert.equal(choirPodAvailable(pod.at - 1, mask), null)
  assert.equal(choirPodAvailable(pod.at + KELP_CHOIR.window, mask), null)
  const nearShipX = choirPodX(pod.at + 180, pod.at)
  assert.ok(nearShipX > 0 && nearShipX < 100)
  mask = rescueChoirPod(mask, pod.id)
  assert.equal(choirPodAvailable(pod.at, mask), null)
}
assert.equal(mask, 31)
assert.equal(choirFreed(mask), true)
assert.equal(choirFreed(mask - 1), false)
assert.equal(choirMaskFitsFrame(0, 0), true)
assert.equal(choirMaskFitsFrame(520, 1), true)
assert.equal(choirMaskFitsFrame(520, 2), false)
assert.equal(choirMaskFitsFrame(1960, 7), true)
assert.equal(choirMaskFitsFrame(1960, 31), false)
assert.equal(rescueChoirPod(mask, 5), mask)
assert.equal(rescueChoirPod(mask, 6), mask)
for (const entry of NURSERY_WAVES) assert.ok(nurserySpawns(entry.at).length > 0)

const checkpoint = {
  nurseryStartedAt: 200,
  nurseryFrame: 1920,
  rescuedNemi: true,
  trenchRoute: 'safe' as const,
  routeSettled: true,
}
assert.equal(nurseryFlightCheckpointValid(3, 2120, checkpoint), true)
for (const invalid of [
  { ...checkpoint, rescuedNemi: false },
  { ...checkpoint, routeSettled: false },
  { ...checkpoint, trenchRoute: null },
  { ...checkpoint, nurseryFrame: 1900 },
  { ...checkpoint, nurseryFrame: -1 },
  { ...checkpoint, nurseryStartedAt: 0 },
])
  assert.equal(nurseryFlightCheckpointValid(3, 2120, invalid), false)
assert.equal(nurseryFlightCheckpointValid(2, 2120, checkpoint), false)
assert.equal(nurseryFlightCheckpointValid(3, 2121, checkpoint), false)
assert.equal(
  nurseryFlightCheckpointValid(3, 200, { ...checkpoint, nurseryFrame: 0 }),
  true,
)
const checkpoint3 = {
  act: 3 as const,
  frame: 20240,
  score: 500,
  rescuedStation: false,
  rescuedNemi: true,
  trenchRoute: 'safe' as const,
  routeSettled: true,
  nurseryGuardianOutcome: 'waiting' as const,
  nurseryStartedAt: 20000,
  nurseryFrame: 240,
  nurseryHits: 0,
  nurseryChoirMask: 0,
  freedChoir: false,
  rescuedCourier: false,
  wreckRoute: null,
  wreckSettled: false,
  podsSaved: 0,
  reefRoute: null,
  reefSettled: false,
  pylonsDown: 0,
  rescuedNavigator: false,
  captivesFreed: 0,
  schoolBonuses: 0,
}
const read = (c: typeof checkpoint3) =>
  readRainbowSave(
    { v: 1, difficulty: 'normal', checkpoint: c, guardians: {}, medals: {} },
    (act, frame, saved) =>
      nurseryFlightCheckpointValid(act, frame, saved ?? {}),
  )
const saved = read(checkpoint3)
assert.equal(saved?.checkpoint.nurseryFrame, 240)
assert.equal(saved?.checkpoint.nurseryChoirMask, 0)
assert.equal(saved?.checkpoint.freedChoir, false)
const idle = {
  held: {
    up: false,
    down: false,
    left: false,
    right: false,
    a: false,
    b: false,
    start: false,
  },
  pressed: {
    up: false,
    down: false,
    left: false,
    right: false,
    a: false,
    b: false,
    start: false,
  },
}
for (const seats of [1, 2, 3, 4]) {
  const game = createRainbowPrincessPreview({
    rng: () => 0.5,
    sound: { play: () => {} },
    hiScore: 0,
    players: seats,
    demo: false,
    rainbowReplay: saved!,
  })
  assert.equal(game.snapshot.act, 'X1')
  assert.equal(game.snapshot.nurseryFrame, 239)
  assert.equal(game.snapshot.nurseryChoirMask, 0)
  assert.equal(game.snapshot.activePlayers, seats)
  const inputs = Array.from({ length: seats }, () => idle)
  game.update(idle, inputs)
  assert.equal(game.snapshot.stage, 'waves')
  assert.equal(game.snapshot.nurseryFrame, 240)
  for (let step = 0; step < 61; step++) game.update(idle, inputs)
  assert.equal(game.snapshot.act, 'X1')
  assert.ok(
    game.snapshot.enemies.some((enemy) => enemy.kind === 'angler'),
    'the authored Nursery score must spawn in the actual flight loop',
  )
}
const guardianSave = read({
  ...checkpoint3,
  frame: 23600,
  nurseryFrame: 3600,
})
assert.ok(guardianSave)
const guardianGame = createRainbowPrincessPreview({
  rng: () => 0.5,
  sound: { play: () => {} },
  hiScore: 0,
  players: 1,
  demo: false,
  rainbowReplay: guardianSave!,
})
guardianGame.update(idle, [idle])
assert.equal(guardianGame.snapshot.stage, 'guardian')
assert.equal(guardianGame.snapshot.guardian?.kind, 'kelpwarden')

const exitSave = read({
  ...checkpoint3,
  frame: 24380,
  nurseryFrame: 4380,
})
assert.ok(exitSave)
const exitGame = createRainbowPrincessPreview({
  rng: () => 0.5,
  sound: { play: () => {} },
  hiScore: 0,
  players: 1,
  demo: false,
  rainbowReplay: exitSave!,
})
for (let frame = 0; frame < NURSERY_FLIGHT.end - 4380 + 2; frame++)
  exitGame.update(idle, [idle])
assert.equal(exitGame.snapshot.act, 'S04')
assert.equal(exitGame.snapshot.actFourFrame >= 0, true)

assert.equal(
  read({ ...checkpoint3, frame: 20241 }),
  null,
  'the Act and flight clocks must agree',
)
assert.equal(read({ ...checkpoint3, nurseryFrame: 250 }), null)
assert.equal(read({ ...checkpoint3, rescuedNemi: false }), null)
assert.equal(read({ ...checkpoint3, nurseryHits: -1 }), null)
assert.equal(read({ ...checkpoint3, nurseryChoirMask: 32 }), null)
assert.equal(read({ ...checkpoint3, nurseryChoirMask: 1 }), null)
assert.equal(read({ ...checkpoint3, freedChoir: true }), null)
assert.equal(read({ ...checkpoint3, freedChoir: 'yes' as never }), null)
assert.equal(read({ ...checkpoint3, nurseryChoirMask: -1 }), null)
assert.equal(
  read({
    ...checkpoint3,
    nurseryFrame: undefined as never,
  }),
  null,
  'an orphaned flight origin must not bypass validation',
)
console.log(
  'X1 cabinet replay: one-to-four seats, 20 waves, Kelp Warden, Choir rescue masks, exit and corrupt saves passed',
)
console.log(
  'X1 Kelp Nebula: five timed Choir pods, co-op vote and exact checkpoint proof passed',
)
