import assert from 'node:assert/strict'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { readRainbowSave } from '../arcade/games/rainbowLoadouts'
import { CROWN_REEF_PYLONS } from '../arcade/games/rainbowCrownReef'
import {
  LIGHTHOUSE,
  LIGHTHOUSE_GUARDIAN,
  LIGHTHOUSE_LAMPS,
  LIGHTHOUSE_SECTIONS,
  LIGHTHOUSE_TALKS,
  LIGHTHOUSE_WAVES,
  LIGHTHOUSE_WAVE_SIZES,
  lighthouseCheckpointValid,
  lighthouseCollectibleLamp,
  lighthouseDetourFor,
  lighthouseGuardianActive,
  lighthouseMedalEarned,
  lighthouseRouteUnlocked,
  lighthouseSpawns,
  lighthouseStage,
  lightLighthouseLamp,
} from '../arcade/games/rainbowSunkenLighthouse'
import {
  RAINBOW_GUARDIAN,
  createRainbowGuardian,
  rainbowGuardianWarning,
  stepRainbowGuardian,
} from '../arcade/games/rainbowGuardian'

assert.equal(LIGHTHOUSE.id, 'X3')
assert.equal(LIGHTHOUSE_WAVES.length, 30)
assert.equal(LIGHTHOUSE_SECTIONS.length, 6)
assert.equal(LIGHTHOUSE_LAMPS.length, 6)
assert.equal(LIGHTHOUSE_WAVE_SIZES.length, LIGHTHOUSE_WAVES.length)
assert.ok(LIGHTHOUSE_WAVE_SIZES.every((size) => size >= 1 && size <= 4))
assert.equal(lighthouseRouteUnlocked('relay', true, CROWN_REEF_PYLONS), true)
assert.equal(lighthouseRouteUnlocked('cache', true, CROWN_REEF_PYLONS), false)
assert.equal(lighthouseRouteUnlocked('relay', false, CROWN_REEF_PYLONS), false)
assert.equal(
  lighthouseRouteUnlocked('relay', true, CROWN_REEF_PYLONS - 1),
  false,
)
assert.equal(lighthouseDetourFor([80], true), true)
assert.equal(lighthouseDetourFor([185], true), false)
assert.equal(lighthouseDetourFor([80, 85, 180, 200], true), true)
assert.equal(lighthouseDetourFor([180, 85, 80, 200], true), false)
assert.equal(lighthouseDetourFor([80, 85], false), false)
assert.equal(lighthouseDetourFor([], true), false)
assert.equal(lighthouseStage(0), 'opening')
assert.equal(lighthouseStage(240), 'waves')
assert.equal(lighthouseStage(7320), 'turn')
assert.equal(lighthouseStage(7680), 'boss')
assert.equal(
  lighthouseGuardianActive(6690, 'relay', true, CROWN_REEF_PYLONS),
  true,
)
assert.equal(
  lighthouseGuardianActive(7320, 'relay', true, CROWN_REEF_PYLONS),
  false,
)
assert.equal(
  lighthouseGuardianActive(6700, 'cache', true, CROWN_REEF_PYLONS),
  false,
)
assert.equal(lighthouseCollectibleLamp(719, 0), null)
assert.equal(lighthouseCollectibleLamp(720, 0)?.id, 'lamp-1')
assert.equal(lighthouseCollectibleLamp(809, 0)?.id, 'lamp-1')
assert.equal(lighthouseCollectibleLamp(810, 0), null)
assert.equal(lighthouseCollectibleLamp(721, 1), null)
assert.equal(lighthouseCollectibleLamp(1740, 0)?.id, 'lamp-2')
assert.equal(lighthouseCollectibleLamp(1741, 2), null)
assert.equal(lighthouseCollectibleLamp(Number.NaN, 0), null)
assert.equal(lighthouseCollectibleLamp(720, 64), null)
assert.equal(lighthouseMedalEarned(0), false)
assert.equal(lighthouseMedalEarned(63), true)
assert.equal(lightLighthouseLamp(0, 1), 1)
assert.equal(lightLighthouseLamp(1, 1), 1)
assert.equal(lightLighthouseLamp(1, 6), 33)
assert.throws(() => lightLighthouseLamp(64, 2))
assert.deepEqual(Object.keys(LIGHTHOUSE_TALKS), [
  'opening',
  'turn',
  'aftermath',
])
assert.ok(Object.values(LIGHTHOUSE_TALKS).every((lines) => lines.length === 3))

const waveIds = new Set<number>()
for (let frame = 0; frame <= LIGHTHOUSE.guardianFrom; frame++) {
  for (const entry of lighthouseSpawns(frame)) {
    waveIds.add(entry.wave)
    assert.ok(entry.y >= 52 && entry.y <= 218)
  }
  if (frame >= LIGHTHOUSE.guardianFrom)
    assert.equal(lighthouseSpawns(frame).length, 0)
}
assert.equal(waveIds.size, LIGHTHOUSE_WAVES.length)

const checkpoint = {
  act: 6 as const,
  frame: 15240,
  score: 400,
  rescuedStation: false,
  rescuedNemi: false,
  trenchRoute: null,
  routeSettled: false,
  nurseryGuardianOutcome: 'waiting',
  rescuedCourier: false,
  wreckRoute: null,
  armoryGuardianOutcome: 'waiting',
  pearlWardenOutcome: 'waiting',
  wreckSettled: false,
  podsSaved: 0,
  reefRoute: 'relay' as const,
  reefSettled: true,
  pylonsDown: CROWN_REEF_PYLONS,
  lighthouseStartedAt: 15000,
  lighthouseFrame: 240,
  lighthouseLamps: 0,
  lighthouseGuardianOutcome: 'waiting',
  lighthouseHits: 0,
  rescuedNavigator: false,
  captivesFreed: 0,
  schoolBonuses: 0,
}
const load = (
  c: Omit<typeof checkpoint, 'reefRoute'> & {
    reefRoute: 'relay' | 'cache' | null
  },
) =>
  readRainbowSave(
    { v: 1, difficulty: 'normal', checkpoint: c, guardians: {}, medals: {} },
    (act, frame, saved) => lighthouseCheckpointValid(act, frame, saved ?? {}),
  )
assert.equal(load(checkpoint)?.checkpoint.lighthouseFrame, 240)
assert.equal(
  load({ ...checkpoint, lighthouseLamps: 63 })?.checkpoint.lighthouseLamps,
  63,
)
assert.equal(load({ ...checkpoint, lighthouseLamps: 64 }), null)
assert.equal(load({ ...checkpoint, lighthouseHits: -1 }), null)
assert.equal(load({ ...checkpoint, reefRoute: 'cache' }), null)
assert.equal(load({ ...checkpoint, reefSettled: false }), null)
assert.equal(load({ ...checkpoint, lighthouseFrame: 241 }), null)
assert.equal(load({ ...checkpoint, lighthouseStartedAt: 14999 }), null)
assert.equal(load({ ...checkpoint, lighthouseGuardianOutcome: 'bad' }), null)

const input = {
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
    demo: false,
    players: seats,
    rainbowReplay: load(checkpoint),
  })
  assert.equal(game.snapshot.activePlayers, seats)
  assert.equal(game.snapshot.act, 'X3')
  assert.equal(game.snapshot.lighthouseFrame, 239)
  game.update(
    input,
    Array.from({ length: seats }, () => input),
  )
  assert.equal(game.snapshot.lighthouseFrame, 240)
  assert.equal(game.snapshot.stage, 'waves')
  for (let frame = 0; frame < 100; frame++)
    game.update(
      input,
      Array.from({ length: seats }, () => input),
    )
  assert.equal(game.snapshot.act, 'X3')
  assert.ok(
    game.snapshot.enemies.some((enemy) => enemy.kind === 'mirror'),
    'authored X3 waves must spawn inside the actual cabinet',
  )
}
for (const seats of [1, 4]) {
  const guardianSave = load({
    ...checkpoint,
    frame: 15000 + LIGHTHOUSE.guardianFrom,
    lighthouseFrame: LIGHTHOUSE.guardianFrom,
    lighthouseLamps: 63,
  })
  assert.ok(guardianSave)
  const game = createRainbowPrincessPreview({
    rng: () => 0.5,
    sound: { play: () => {} },
    hiScore: 0,
    demo: false,
    players: seats,
    rainbowReplay: guardianSave,
  })
  assert.equal(game.snapshot.act, 'X3')
  assert.equal(game.snapshot.lighthouseLamps, 63)
  game.update(
    input,
    Array.from({ length: seats }, () => input),
  )
  assert.equal(game.snapshot.guardian?.kind, 'lampkeeper')
  assert.equal(game.snapshot.lighthouseGuardianOutcome, 'waiting')
  assert.ok(game.snapshot.guardian!.maxHp > 0)
}

// Completing the authored X3 exit must survive the Act VII boundary.
// This is not the same as merely discovering its upper relay entrance.
for (const seats of [1, 2, 3, 4]) {
  const nearExit = load({
    ...checkpoint,
    frame: 15000 + LIGHTHOUSE.guardianFrom,
    lighthouseFrame: LIGHTHOUSE.guardianFrom,
    lighthouseLamps: 63,
    lighthouseGuardianOutcome: 'escaped',
  })
  assert.ok(nearExit)
  const game = createRainbowPrincessPreview({
    rng: () => 0.5,
    sound: { play: () => {} },
    hiScore: 0,
    demo: false,
    players: seats,
    rainbowReplay: nearExit,
  })
  const crew = Array.from({ length: seats }, () => input)
  for (let frame = 0; frame < LIGHTHOUSE.end - LIGHTHOUSE.guardianFrom + 4; frame++)
    game.update(input, crew)
  assert.equal(game.snapshot.act, 'S07')
  assert.equal(
    (game.snapshot.checkpoint.alternateRoutesCleared ?? 0) & 4,
    4,
    `a ${seats}-pilot Lighthouse exit must persist X3 completion`,
  )
}

for (const seats of [1, 4]) {
  const guardian = createRainbowGuardian('lampkeeper', seats)
  const targets = [70, 120, 170, 210]
    .slice(0, seats)
    .map((y) => ({ x: 82, y, lives: 3 }))
  let warnings = 0
  let fired = [] as ReturnType<typeof stepRainbowGuardian>
  for (let i = 1; i <= RAINBOW_GUARDIAN.firstVolley; i++) {
    fired = stepRainbowGuardian(guardian, targets, false)
    if (rainbowGuardianWarning(guardian)) warnings++
    if (i < RAINBOW_GUARDIAN.firstVolley) assert.equal(fired.length, 0)
  }
  assert.equal(warnings, RAINBOW_GUARDIAN.warningFrames)
  assert.ok(fired.length >= 4)
  assert.ok(fired.every((shot) => Number.isFinite(shot.vx)))
}
assert.ok(
  createRainbowGuardian('lampkeeper', 4).maxHp >
    createRainbowGuardian('lampkeeper', 1).maxHp,
)
assert.equal(LIGHTHOUSE_GUARDIAN.name, 'Drowned Bellkeeper')
console.log(
  'X3 lighthouse flight, route votes, save validation and 1-4 seats passed',
)
