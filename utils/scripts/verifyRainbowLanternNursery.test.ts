import assert from 'node:assert/strict'
import { actCheckpoints } from '../arcade/games/rainbowCheckpoints'
import {
  RAINBOW_GUARDIAN,
  createRainbowGuardian,
  rainbowGuardianWarning,
  stepRainbowGuardian,
} from '../arcade/games/rainbowGuardian'
import {
  readRainbowSave,
  type RainbowSave,
} from '../arcade/games/rainbowLoadouts'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { emptyInput } from '../arcade/types'
import {
  NURSERY,
  NURSERY_GUARDIAN,
  NURSERY_SECTIONS,
  NURSERY_WAVES,
  nurseryGuardianWindow,
  nurseryRouteSpawns,
  nurserySpawns,
  nurseryStage,
} from '../arcade/games/rainbowLanternNursery'
import {
  TRENCH_FORK,
  TRENCH_SAFE_SECTIONS,
  trenchSections,
  trenchSpawns,
} from '../arcade/games/rainbowTrench'

assert.equal(NURSERY_SECTIONS.length, 5)
assert.equal(NURSERY_GUARDIAN.kind, 'kelpwarden')
assert.equal(NURSERY_GUARDIAN.from, 3600)
assert.equal(NURSERY_WAVES.length, 20)
assert.equal(nurseryStage(0), 'opening')
assert.equal(nurseryStage(240), 'waves')
assert.equal(nurseryStage(4380), 'turn')
assert.equal(nurseryStage(4680), 'boss')
assert.deepEqual(nurserySpawns(0), [])
assert.deepEqual(nurserySpawns(4680), [])
assert.ok(nurserySpawns(300).length > 0)
assert.ok(NURSERY_WAVES.every((wave) => wave.at < NURSERY_GUARDIAN.from))
assert.ok(nurserySpawns(300).every((spawn) => spawn.wave >= NURSERY.waveBase))

assert.ok(
  TRENCH_SAFE_SECTIONS.length >= 2,
  'the safe route keeps its nursery stretch',
)
const originalSections = trenchSections('safe')
const nurserySections = trenchSections('safe', true)
assert.deepEqual(
  nurserySections.map((section) => [section.from, section.to]),
  originalSections.map((section) => [section.from, section.to]),
  'earning the Nursery does not invalidate existing checkpoints',
)
assert.deepEqual(
  nurserySections
    .filter(
      (section) =>
        section.from >= TRENCH_FORK.decideAt &&
        section.from < TRENCH_FORK.rejoinAt,
    )
    .map((section) => section.name),
  // The recut safe route has as many sections as the nursery names that fit it, in order.
  ['Luminous eggs', 'Sleeping shoal', 'Broken lanterns', 'Nursery heart'].slice(
    0,
    TRENCH_SAFE_SECTIONS.length,
  ),
)
assert.notDeepEqual(
  originalSections.map((section) => section.name),
  nurserySections.map((section) => section.name),
  'the original safe-passage names remain intact for ordinary flights',
)

const seen = new Map<number, number>()
let total = 0
for (let frame = TRENCH_FORK.decideAt; frame < TRENCH_FORK.rejoinAt; frame++) {
  const live = trenchSpawns(frame, 'safe', true)
  const directed = nurseryRouteSpawns(
    frame,
    TRENCH_FORK.decideAt,
    TRENCH_FORK.rejoinAt,
  )
  assert.deepEqual(live, directed, 'the low flight path uses the Nursery score')
  assert.deepEqual(
    live,
    trenchSpawns(frame, 'safe', true),
    'the earned fork replays deterministically',
  )
  const ordinary = trenchSpawns(frame, 'safe', false)
  assert.deepEqual(
    ordinary,
    trenchSpawns(frame, 'safe'),
    'missing the rescue preserves the original safe passage',
  )
  assert.ok(
    ordinary.every((spawn) => spawn.wave < NURSERY.waveBase),
    'Nursery requires the in-flight Nemi rescue',
  )
  for (const spawn of live) {
    assert.ok(spawn.wave >= NURSERY.waveBase)
    assert.ok(spawn.wave < NURSERY.waveBase + NURSERY_WAVES.length)
    assert.ok(['angler', 'pistol', 'skate', 'clawstrike'].includes(spawn.kind))
    assert.ok(
      !trenchSpawns(frame, 'vault', true).some(
        (other) => other.wave === spawn.wave,
      ),
      'a Nursery craft cannot leak into the high salvage route',
    )
    seen.set(spawn.wave, (seen.get(spawn.wave) ?? 0) + 1)
    total++
  }
}
assert.equal(seen.size, NURSERY_WAVES.length, 'all 20 waves fly in-game')
assert.ok(total > 20, 'formations spawn multiple visible craft')
assert.deepEqual(
  nurseryRouteSpawns(
    TRENCH_FORK.rejoinAt,
    TRENCH_FORK.decideAt,
    TRENCH_FORK.rejoinAt,
  ),
  [],
  'no alternate wave leaks past the route join',
)
assert.deepEqual(
  nurseryRouteSpawns(
    TRENCH_FORK.decideAt - 1,
    TRENCH_FORK.decideAt,
    TRENCH_FORK.rejoinAt,
  ),
  [],
)
assert.deepEqual(nurseryRouteSpawns(12, 10, 10), [])
console.log(
  `Lantern Nursery runtime: ${total} craft in ${seen.size} live low-route waves`,
)

const window = nurseryGuardianWindow(TRENCH_FORK.decideAt, TRENCH_FORK.rejoinAt)
assert.ok(window.from > TRENCH_FORK.decideAt)
assert.equal(window.to, TRENCH_FORK.rejoinAt)
assert.ok(window.to - window.from > 240)
assert.ok(
  NURSERY_WAVES.every((wave) => {
    const translated =
      TRENCH_FORK.decideAt +
      Math.ceil(
        ((wave.at - NURSERY.openingEnds) *
          (TRENCH_FORK.rejoinAt - TRENCH_FORK.decideAt)) /
          (NURSERY.turnStarts - NURSERY.openingEnds),
      )
    return translated < window.from
  }),
  'all Nursery waves precede the guardian safely',
)

console.log('Rainbow Lantern Nursery alternate Act score contracts passed')

const target = { x: 90, y: 140, lives: 3 }
for (const players of [1, 4]) {
  const matriarch = createRainbowGuardian('matriarch', players)
  const patterns: number[] = []
  let warningFrames = 0
  for (let frame = 0; frame < 750; frame++) {
    if (rainbowGuardianWarning(matriarch)) warningFrames++
    const shots = stepRainbowGuardian(matriarch, [target], false)
    if (shots.length) {
      assert.ok(warningFrames >= RAINBOW_GUARDIAN.warningFrames)
      assert.ok(shots.every((shot) => shot.vx < 2))
      patterns.push(shots.length)
      warningFrames = 0
    }
  }
  assert.ok(patterns.length >= 4, 'Matriarch attacks repeatedly')
  assert.notEqual(patterns[0], patterns[1], 'rings alternate with split fans')
  assert.ok(matriarch.maxHp >= RAINBOW_GUARDIAN.baseHp)
}

const checkpointFrames = actCheckpoints(
  trenchSections('safe', true),
  TRENCH_FORK.rejoinAt,
)
const beforeGuardian = checkpointFrames
  .filter((frame) => frame <= window.from)
  .at(-1)!
const savedFlight: RainbowSave = {
  v: 1,
  difficulty: 'easy',
  checkpoint: {
    act: 3,
    frame: beforeGuardian,
    score: 1200,
    rescuedStation: false,
    rescuedNemi: true,
    trenchRoute: 'safe',
    routeSettled: false,
    nurseryGuardianOutcome: 'waiting',
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
  },
  guardians: { 1: 'escaped', 2: 'escaped', 3: 'escaped' },
  medals: {},
}
const accepted = readRainbowSave(
  savedFlight,
  (act, frame) => act === 3 && checkpointFrames.includes(frame),
)
assert.equal(accepted?.checkpoint.nurseryGuardianOutcome, 'waiting')
assert.equal(
  readRainbowSave(
    {
      ...savedFlight,
      checkpoint: {
        ...savedFlight.checkpoint,
        nurseryGuardianOutcome: 'impossible',
      },
    },
    () => true,
  ),
  null,
  'untrusted saves cannot invent a guardian verdict',
)
const old = {
  ...savedFlight,
  checkpoint: { ...savedFlight.checkpoint },
}
delete old.checkpoint.nurseryGuardianOutcome
assert.equal(
  readRainbowSave(old, () => true)?.checkpoint.nurseryGuardianOutcome,
  'waiting',
  'older saves keep their valid checkpoint and default pending guardian',
)

const flight = createRainbowPrincessPreview({
  players: 4,
  demo: false,
  rng: () => 0.5,
  sound: { play() {} },
  hiScore: 0,
  resume: accepted!,
})
for (let i = 0; i < 24; i++) flight.update(emptyInput())
const confirm = emptyInput()
confirm.pressed.a = true
flight.update(confirm)
assert.equal(flight.snapshot.act, 'S03')
assert.equal(flight.snapshot.trenchRoute, 'safe')
assert.equal(flight.snapshot.rescuedNemi, true)
// #5578 retired the in-Act III Lantern Matriarch: the Nursery is now the standalone X1 Kelp Nebula, flown after
// Act III, whose Kelp Warden is met in the engine in verifyRainbowNurseryFlight. A saved Act III safe-route flight
// with Nemi rescued must fly the old nursery window without the retired guardian ever spawning.
let flownWindow = 0
for (let frame = 0; frame < 2000; frame++) {
  const input = emptyInput()
  input.held.a = true
  if (flight.snapshot.continueLeft > 0) input.pressed.a = true
  flight.update(input)
  const state = flight.snapshot
  assert.notEqual(
    state.guardian?.kind,
    'matriarch',
    'the retired Act III Matriarch never spawns',
  )
  if (state.act !== 'S03' || state.actThreeFrame >= window.to) break
  if (state.actThreeFrame >= window.from) flownWindow++
}
assert.ok(
  flownWindow > 0,
  'four-player saved flight flies the old nursery window in the actual engine',
)

console.log('Rainbow Lantern Nursery guardian integration contracts passed')
