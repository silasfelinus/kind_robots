import assert from 'node:assert/strict'
import {
  PEARL_WARDEN,
  pearlWardenAllowsWave,
  pearlWardenWindow,
} from '../arcade/games/rainbowPearlWarden'
import {
  CROWN_REEF_FORK,
  reefSpawns,
} from '../arcade/games/rainbowCrownReef'
import {
  createRainbowGuardian,
  rainbowGuardianGone,
  rainbowGuardianWarning,
  RAINBOW_GUARDIAN,
  stepRainbowGuardian,
} from '../arcade/games/rainbowGuardian'
import { emptyInput } from '../arcade/types'
import {
  readRainbowSave,
  type RainbowSave,
} from '../arcade/games/rainbowLoadouts'
import {
  createRainbowPrincessPreview,
  isRainbowCheckpoint,
} from '../arcade/games/rainbowPrincessPreview'

const warden = pearlWardenWindow(
  CROWN_REEF_FORK.decideAt,
  CROWN_REEF_FORK.rejoinAt,
)
assert.equal(warden.name, PEARL_WARDEN.name)
assert.equal(warden.kind, 'warden')
assert.ok(warden.from > CROWN_REEF_FORK.decideAt)
assert.equal(warden.to, CROWN_REEF_FORK.rejoinAt)
assert.ok(warden.to - warden.from > RAINBOW_GUARDIAN.escapeLead + 250)
assert.throws(() => pearlWardenWindow(50, 50))
assert.equal(pearlWardenAllowsWave(warden.from - 1, 'cache', warden), true)
assert.equal(pearlWardenAllowsWave(warden.from, 'cache', warden), false)
assert.equal(pearlWardenAllowsWave(warden.to - 1, 'cache', warden), false)
assert.equal(pearlWardenAllowsWave(warden.from, 'relay', warden), true)
assert.equal(pearlWardenAllowsWave(warden.from, null, warden), true)
assert.ok(
  reefSpawns(CROWN_REEF_FORK.decideAt + 240, 'cache').length > 0,
  'the cache patrol is genuinely flown before the keeper arrives',
)

for (const players of [1, 4]) {
  const guardian = createRainbowGuardian('warden', players)
  const volleys: number[] = []
  let warned = 0
  for (let frame = 0; frame < 720; frame++) {
    if (rainbowGuardianWarning(guardian)) warned++
    const shots = stepRainbowGuardian(
      guardian,
      [{ x: 86, y: 141, lives: 3 }],
      false,
    )
    if (!shots.length) continue
    assert.ok(warned >= RAINBOW_GUARDIAN.warningFrames)
    assert.ok(shots.every((shot) => !shot.ghost && !shot.fuse))
    volleys.push(shots.length)
    warned = 0
  }
  assert.ok(volleys.length >= 4)
  assert.notEqual(volleys[0], volleys[1], 'hoops and crescents alternate')
  const retreat = createRainbowGuardian('warden', players)
  for (let i = 0; i < 80 && !rainbowGuardianGone(retreat); i++)
    stepRainbowGuardian(retreat, [], true)
  assert.ok(rainbowGuardianGone(retreat))
}

const saved: RainbowSave = {
  v: 1,
  difficulty: 'easy',
  checkpoint: {
    act: 6,
    frame: CROWN_REEF_FORK.decideAt,
    score: 2200,
    rescuedStation: true,
    rescuedNemi: true,
    trenchRoute: 'safe',
    routeSettled: true,
    nurseryGuardianOutcome: 'escaped',
    rescuedCourier: true,
    wreckRoute: 'depot',
    armoryGuardianOutcome: 'escaped',
    wreckSettled: true,
    podsSaved: 5,
    reefRoute: 'cache',
    pearlWardenOutcome: 'waiting',
    reefSettled: false,
    pylonsDown: 0,
    rescuedNavigator: false,
    captivesFreed: 0,
    allegiance: 'rebel',
    schoolBonuses: 0,
  },
  guardians: {
    1: 'defeated',
    2: 'defeated',
    3: 'defeated',
    4: 'defeated',
    5: 'defeated',
    6: 'defeated',
  },
  medals: { 1: 'bronze', 2: 'silver', 3: 'gold', 4: 'silver', 5: 'bronze' },
}
assert.equal(
  isRainbowCheckpoint(6, CROWN_REEF_FORK.decideAt),
  true,
  'the route decision begins on a savable Act checkpoint',
)
const read = readRainbowSave(saved, isRainbowCheckpoint)
assert.equal(read?.checkpoint.pearlWardenOutcome, 'waiting')
assert.equal(
  readRainbowSave(
    {
      ...saved,
      checkpoint: { ...saved.checkpoint, pearlWardenOutcome: 'impossible' },
    },
    isRainbowCheckpoint,
  ),
  null,
  'corrupted guardian outcomes are rejected instead of silently repaired',
)
const legacy = structuredClone(saved) as RainbowSave
delete legacy.checkpoint.pearlWardenOutcome
assert.equal(
  readRainbowSave(legacy, isRainbowCheckpoint)?.checkpoint.pearlWardenOutcome,
  'waiting',
)
const later = {
  ...legacy,
  checkpoint: { ...legacy.checkpoint, act: 7 as const, frame: 0 },
}
assert.equal(
  readRainbowSave(later, isRainbowCheckpoint)?.checkpoint.pearlWardenOutcome,
  'escaped',
  'old later-Act saves must not invent a Warden defeat',
)
for (const seats of [1, 4]) {
  const flight = createRainbowPrincessPreview({
    players: seats,
    demo: false,
    rng: () => 0.5,
    sound: { play() {} },
    hiScore: 0,
    resume: read!,
  })
  for (let i = 0; i < 24; i++) flight.update(emptyInput())
  const confirm = emptyInput()
  confirm.pressed.a = true
  flight.update(confirm)
  assert.equal(flight.snapshot.act, 'S06')
  assert.equal(flight.snapshot.reefRoute, 'cache')
  let found = false
  for (let frame = 0; frame < 3000; frame++) {
    const input = emptyInput()
    input.held.a = true
    if (flight.snapshot.continueLeft > 0) input.pressed.a = true
    flight.update(input)
    const state = flight.snapshot
    if (state.guardian?.kind === 'warden') {
      assert.equal(state.pearlWardenOutcome, 'waiting')
      assert.ok(state.actSixFrame >= warden.from)
      found = true
      break
    }
    if (state.act !== 'S06' || state.actSixFrame >= warden.to) break
  }
  assert.ok(found, `the actual ${seats}-player cache route must spawn its keeper`)
}
console.log(
  'rainbow Pearl Warden: dual patterns, legacy saves and real 1/4-seat route passed',
)
