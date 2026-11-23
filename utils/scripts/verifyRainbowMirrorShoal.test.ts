import assert from 'node:assert/strict'
import { readRainbowSave } from '../arcade/games/rainbowLoadouts'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import {
  MIRROR_SHOAL,
  SHOAL_GUARDIAN,
  SHOAL_SECTIONS,
  SHOAL_WAVES,
  SHOAL_WAVE_SIZES,
  SHOAL_TALKS,
  mirrorShoalMedalEarned,
  mirrorShoalRouteUnlocked,
  mirrorShoalDetourFor,
  mirrorShoalCheckpointValid,
  mirrorShoalSpawns,
  mirrorShoalStage,
} from '../arcade/games/rainbowMirrorShoal'
import {
  RAINBOW_GUARDIAN,
  createRainbowGuardian,
  rainbowGuardianWarning,
  stepRainbowGuardian,
} from '../arcade/games/rainbowGuardian'

assert.equal(MIRROR_SHOAL.id, 'X4')
assert.equal(mirrorShoalRouteUnlocked(false, 0), true)
assert.equal(mirrorShoalDetourFor([70], true), true)
assert.equal(
  mirrorShoalCheckpointValid(7, 18100, {
    shoalStartedAt: 18100,
    shoalFrame: 0,
    actContinues: 0,
  }),
  true,
)
assert.equal(mirrorShoalDetourFor([190], true), false)
assert.equal(mirrorShoalDetourFor([70, 90, 185, 190], true), true)
assert.equal(mirrorShoalDetourFor([190, 70, 90, 185], true), false)
assert.equal(mirrorShoalDetourFor([70, 90, 185], false), false)
assert.equal(mirrorShoalDetourFor([], true), false)
assert.equal(
  mirrorShoalCheckpointValid(7, 18400, {
    shoalStartedAt: 18100,
    shoalFrame: 300,
    rescuedNavigator: true,
  }),
  true,
)
assert.equal(
  mirrorShoalCheckpointValid(7, 18401, {
    shoalStartedAt: 18100,
    shoalFrame: 300,
  }),
  false,
)
assert.equal(
  mirrorShoalCheckpointValid(6, 18400, {
    shoalStartedAt: 18100,
    shoalFrame: 300,
  }),
  false,
)
const checkpoint = {
  act: 7,
  frame: 18400,
  score: 500,
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
  reefRoute: null,
  reefSettled: false,
  pylonsDown: 0,
  rescuedNavigator: true,
  shoalStartedAt: 18100,
  shoalFrame: 300,
  shoalGuardianOutcome: 'waiting',
  shoalHits: 0,
  captivesFreed: 0,
  schoolBonuses: 0,
}
const resume = (c: typeof checkpoint & { actContinues?: number }) =>
  readRainbowSave(
    { v: 1, difficulty: 'normal', checkpoint: c, guardians: {}, medals: {} },
    (act, frame, saved) => mirrorShoalCheckpointValid(act, frame, saved ?? {}),
  )
assert.equal(resume(checkpoint)?.checkpoint.shoalFrame, 300)
assert.equal(
  resume({ ...checkpoint, rescuedNavigator: false, actContinues: 2 }),
  null,
  'an unrescued Navigator and continued Act VII cannot unlock X4 on reload',
)
assert.equal(
  resume({ ...checkpoint, rescuedNavigator: false, actContinues: 0 })
    ?.checkpoint.shoalFrame,
  300,
  'a genuine clean-flight X4 checkpoint remains replayable',
)
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
    rainbowReplay: resume(checkpoint),
  })
  assert.equal(game.snapshot.act, 'X4')
  assert.equal(game.snapshot.stage, 'opening')
  assert.equal(game.snapshot.shoalFrame, 299)
  assert.equal(game.snapshot.activePlayers, seats)
  game.update(
    input,
    Array.from({ length: seats }, () => input),
  )
  assert.equal(game.snapshot.stage, 'waves')
  assert.equal(game.snapshot.shoalFrame, 300)
  for (let tick = 0; tick <= 60; tick++)
    game.update(
      input,
      Array.from({ length: seats }, () => input),
    )
  assert.equal(game.snapshot.act, 'X4')
  assert.ok(
    game.snapshot.enemies.some((enemy) => enemy.kind === 'mirror'),
    'actual X4 wave must reach the live flight director',
  )
}
// Finishing the charted X4 flight, not merely inspecting its route node,
// must survive the Act VIII transition for both solo and local co-op.
for (const seats of [1, 2, 3, 4]) {
  const nearExit = resume({
    ...checkpoint,
    frame: 18100 + MIRROR_SHOAL.guardianFrom,
    shoalFrame: MIRROR_SHOAL.guardianFrom,
    shoalGuardianOutcome: 'escaped',
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
  for (let frame = 0; frame < MIRROR_SHOAL.end - MIRROR_SHOAL.guardianFrom + 4; frame++)
    game.update(input, crew)
  assert.equal(game.snapshot.act, 'S08')
  assert.equal(
    (game.snapshot.checkpoint.alternateRoutesCleared ?? 0) & 8,
    8,
    `a ${seats}-pilot Mirror Shoal exit must persist X4 completion`,
  )
}

assert.equal(resume({ ...checkpoint, shoalFrame: 600 }), null)
assert.equal(resume({ ...checkpoint, shoalHits: -1 }), null)
assert.equal(resume({ ...checkpoint, shoalGuardianOutcome: 'unknown' }), null)
assert.equal(mirrorShoalRouteUnlocked(false, 1), false)
assert.equal(mirrorShoalRouteUnlocked(true, 5), true)
assert.equal(mirrorShoalRouteUnlocked(true, -1), false)
assert.equal(mirrorShoalRouteUnlocked(false, Number.NaN), false)
assert.equal(mirrorShoalRouteUnlocked(false, 0.5), false)
assert.equal(mirrorShoalMedalEarned(0), true)
assert.equal(mirrorShoalMedalEarned(1), false)
assert.equal(mirrorShoalMedalEarned(-1), false)
assert.equal(SHOAL_SECTIONS.length, 11)
assert.equal(SHOAL_WAVES.length, 48)
assert.equal(SHOAL_WAVE_SIZES.length, SHOAL_WAVES.length)
assert.ok(SHOAL_WAVE_SIZES.every((size) => size >= 1 && size <= 4))
assert.deepEqual([...new Set(SHOAL_WAVES.map((entry) => entry.kind))].sort(), [
  'harbinger',
  'mirror',
  'skate',
  'squid',
])
assert.ok(
  SHOAL_WAVES.every(
    (entry, index) =>
      entry.at >= MIRROR_SHOAL.openingEnds &&
      entry.at < MIRROR_SHOAL.guardianFrom &&
      (index === 0 || entry.at > SHOAL_WAVES[index - 1]!.at),
  ),
)

let spawned = 0
const waveIds = new Set<number>()
for (let frame = 0; frame <= MIRROR_SHOAL.end; frame++) {
  const entries = mirrorShoalSpawns(frame)
  spawned += entries.length
  for (const entry of entries) {
    assert.ok(entry.y >= 52 && entry.y <= 218)
    assert.ok(
      entry.wave >= MIRROR_SHOAL.waveBase &&
        entry.wave < MIRROR_SHOAL.waveBase + SHOAL_WAVES.length,
    )
    waveIds.add(entry.wave)
  }
  if (frame >= MIRROR_SHOAL.guardianFrom)
    assert.equal(entries.length, 0, 'the koi fight has a clear arena')
}
assert.equal(waveIds.size, SHOAL_WAVES.length)
assert.equal(
  spawned,
  SHOAL_WAVE_SIZES.reduce((sum, size) => sum + size, 0),
)
assert.equal(mirrorShoalStage(0), 'opening')
assert.equal(mirrorShoalStage(300), 'waves')
assert.equal(mirrorShoalStage(15000), 'guardian')
assert.equal(mirrorShoalStage(17400), 'turn')
assert.equal(mirrorShoalStage(17700), 'aftermath')
assert.equal(mirrorShoalStage(18000), 'complete')
assert.deepEqual(SHOAL_GUARDIAN, {
  name: 'Shoal Koi',
  from: 15000,
  to: 17400,
  kind: 'shoalkoi',
})
assert.ok(
  SHOAL_GUARDIAN.to - SHOAL_GUARDIAN.from >
    RAINBOW_GUARDIAN.firstVolley + RAINBOW_GUARDIAN.escapeLead,
)
assert.deepEqual(Object.keys(SHOAL_TALKS), ['opening', 'turn', 'aftermath'])
for (const lines of Object.values(SHOAL_TALKS)) {
  assert.equal(lines.length, 3)
  assert.ok(lines.some((line) => line.speaker === 'Lilt-7'))
}

const solo = [{ x: 82, y: 135, lives: 3 }]
const quartet = [60, 105, 165, 210].map((y) => ({
  x: 82,
  y,
  lives: 3,
}))
for (const pilots of [1, 4]) {
  const guardian = createRainbowGuardian('shoalkoi', pilots)
  const targets = pilots === 1 ? solo : quartet
  let warnings = 0
  let first = [] as ReturnType<typeof stepRainbowGuardian>
  for (let frame = 1; frame <= RAINBOW_GUARDIAN.firstVolley; frame++) {
    first = stepRainbowGuardian(guardian, targets, false)
    if (rainbowGuardianWarning(guardian)) warnings++
    if (frame < RAINBOW_GUARDIAN.firstVolley) assert.equal(first.length, 0)
  }
  assert.equal(warnings, RAINBOW_GUARDIAN.warningFrames)
  assert.equal(first.length, 8)
  assert.equal(first.filter((pellet) => pellet.ghost).length, 4)
  assert.equal(first.filter((pellet) => !pellet.ghost).length, 4)
  assert.ok(first.every((pellet) => Number.isFinite(pellet.vx)))
  assert.ok(first.every((pellet) => Number.isFinite(pellet.vy)))
  guardian.hp = guardian.maxHp / 2
  let next = [] as ReturnType<typeof stepRainbowGuardian>
  while (guardian.volleys < 2) {
    next = stepRainbowGuardian(guardian, targets, false)
    assert.ok(guardian.frame < 500)
  }
  assert.equal(next.length, 12)
  assert.equal(next.filter((pellet) => pellet.ghost).length, 6)
  assert.ok(
    next.filter((pellet) => !pellet.ghost).every((shot) => shot.vx < 0),
    'the dangerous school travels left and leaves the middle open',
  )
  guardian.nextVolley = guardian.frame + 1
  assert.deepEqual(stepRainbowGuardian(guardian, targets, true), [])
  assert.equal(guardian.leaving, true)
}
assert.ok(
  createRainbowGuardian('shoalkoi', 4).maxHp >
    createRainbowGuardian('shoalkoi', 1).maxHp,
)

console.log(
  'Mirror Shoal X4: 48 waves, two unlock keys, three scenes, Still Water' +
    ' medal and readable solo/four-seat mirrored guardian passed',
)
