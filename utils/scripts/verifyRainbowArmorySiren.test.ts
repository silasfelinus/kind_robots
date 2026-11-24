import assert from 'node:assert/strict'
import {
  ARMORY_SIREN,
  armorySirenAllowsWave,
  armorySirenWindow,
} from '../arcade/games/rainbowArmorySiren'
import { emptyInput } from '../arcade/types'
import {
  createRainbowGuardian,
  rainbowGuardianGone,
  rainbowGuardianWarning,
  rainbowGuardianMarksLanes,
  stepRainbowGuardian,
  RAINBOW_GUARDIAN,
} from '../arcade/games/rainbowGuardian'
import {
  readRainbowSave,
  type RainbowSave,
} from '../arcade/games/rainbowLoadouts'
import {
  createRainbowPrincessPreview,
  isRainbowCheckpoint,
} from '../arcade/games/rainbowPrincessPreview'
import { WRECK_FORK, wreckSpawns } from '../arcade/games/rainbowWreckyard'

const siren = armorySirenWindow(WRECK_FORK.decideAt, WRECK_FORK.rejoinAt)
assert.equal(siren.name, ARMORY_SIREN.name)
assert.equal(siren.kind, 'siren')
assert.ok(siren.from > WRECK_FORK.decideAt)
assert.equal(siren.to, WRECK_FORK.rejoinAt)
assert.ok(siren.to - siren.from > RAINBOW_GUARDIAN.escapeLead + 250)
assert.throws(() => armorySirenWindow(8, 8))
assert.equal(armorySirenAllowsWave(siren.from - 1, 'armory', siren), true)
assert.equal(armorySirenAllowsWave(siren.from, 'armory', siren), false)
assert.equal(armorySirenAllowsWave(siren.to - 1, 'armory', siren), false)
assert.equal(armorySirenAllowsWave(siren.from, 'depot', siren), true)
assert.equal(armorySirenAllowsWave(siren.from, null, siren), true)
assert.ok(
  wreckSpawns(WRECK_FORK.decideAt + 60, 'armory').length > 0,
  'the original heavy armory teaching waves still play before the guardian',
)

for (const players of [1, 4]) {
  const guardian = createRainbowGuardian('siren', players)
  const patterns: number[] = []
  let warned = 0
  for (let frame = 0; frame < 720; frame++) {
    if (rainbowGuardianWarning(guardian)) warned++
    const lanesMarked = rainbowGuardianMarksLanes(guardian)
    const shots = stepRainbowGuardian(
      guardian,
      [{ x: 86, y: 141, lives: 3 }],
      false,
    )
    if (!shots.length) continue
    assert.ok(warned >= RAINBOW_GUARDIAN.warningFrames)
    if (lanesMarked) {
      assert.ok(guardian.lanes.length >= 3, 'lane bolts are warned')
      assert.ok(shots.every((shot) => shot.vx <= -3.8 && shot.vy === 0))
    } else {
      // The chord leaves the aimed line open; on alternate volleys one slow pellet closes it late, after the
      // chord has passed (gameplay critic D5: standing still between the fans must not be safe).
      const closers = shots.filter(
        (shot) => Math.abs(Math.hypot(shot.vx, shot.vy) - 1.15) < 0.01,
      )
      assert.ok(
        closers.length <= 1,
        'at most one late pellet down the aimed line',
      )
      // Every chord pellet flies well off the aimed line (the Siren moves now, so a side pellet may fly level).
      const aim = Math.atan2(141 - guardian.y, 86 - (guardian.x - 18))
      assert.ok(
        shots
          .filter((shot) => !closers.includes(shot))
          .every((shot) => {
            const off = Math.abs(
              Math.atan2(
                Math.sin(Math.atan2(shot.vy, shot.vx) - aim),
                Math.cos(Math.atan2(shot.vy, shot.vx) - aim),
              ),
            )
            return off > 0.15
          }),
        'the chord leaves the aimed line open',
      )
    }
    patterns.push(shots.length)
    warned = 0
  }
  assert.ok(patterns.length >= 4)
  assert.notEqual(patterns[0], patterns[1], 'fan and bolts alternate')
  const escaping = createRainbowGuardian('siren', players)
  for (let i = 0; i < 80 && !rainbowGuardianGone(escaping); i++)
    stepRainbowGuardian(escaping, [], true)
  assert.ok(rainbowGuardianGone(escaping))
}

const saved: RainbowSave = {
  v: 1,
  difficulty: 'easy',
  checkpoint: {
    act: 5,
    frame: WRECK_FORK.decideAt,
    score: 2000,
    rescuedStation: true,
    rescuedNemi: true,
    trenchRoute: 'safe',
    routeSettled: true,
    nurseryGuardianOutcome: 'escaped',
    rescuedCourier: true,
    wreckRoute: 'armory',
    armoryGuardianOutcome: 'waiting',
    wreckSettled: false,
    podsSaved: 0,
    reefRoute: null,
    reefSettled: false,
    pylonsDown: 0,
    rescuedNavigator: false,
    captivesFreed: 0,
    schoolBonuses: 0,
  },
  guardians: {
    1: 'escaped',
    2: 'defeated',
    3: 'escaped',
    4: 'defeated',
    5: 'defeated',
  },
  medals: { 1: 'bronze', 2: 'silver', 3: 'gold', 4: 'silver' },
}
assert.equal(
  isRainbowCheckpoint(5, WRECK_FORK.decideAt),
  true,
  'the armory fork begins on a canonical saved Act checkpoint',
)
const read = readRainbowSave(saved, isRainbowCheckpoint)
assert.equal(read?.checkpoint.armoryGuardianOutcome, 'waiting')
assert.equal(
  readRainbowSave(
    {
      ...saved,
      checkpoint: { ...saved.checkpoint, armoryGuardianOutcome: 'not-real' },
    },
    isRainbowCheckpoint,
  ),
  null,
  'an invalid guardian verdict cannot enter the engine',
)
const legacy = structuredClone(saved) as RainbowSave
delete legacy.checkpoint.armoryGuardianOutcome
assert.equal(
  readRainbowSave(legacy, isRainbowCheckpoint)?.checkpoint
    .armoryGuardianOutcome,
  'waiting',
  'pre-Siren saves are not discarded',
)
const later = {
  ...legacy,
  checkpoint: { ...legacy.checkpoint, act: 6 as const, frame: 0 },
}
assert.equal(
  readRainbowSave(later, isRainbowCheckpoint)?.checkpoint.armoryGuardianOutcome,
  'escaped',
  'a later-act legacy save does not fabricate a defeat',
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
  assert.equal(flight.snapshot.act, 'S05')
  assert.equal(flight.snapshot.wreckRoute, 'armory')
  let foundSiren = false
  for (let frame = 0; frame < 2400; frame++) {
    const input = emptyInput()
    input.held.a = true
    if (flight.snapshot.continueLeft > 0) input.pressed.a = true
    flight.update(input)
    const state = flight.snapshot
    if (state.guardian?.kind === 'siren') {
      assert.equal(state.armoryGuardianOutcome, 'waiting')
      assert.ok(state.actFiveFrame >= siren.from)
      foundSiren = true
      break
    }
    if (state.act !== 'S05' || state.actFiveFrame >= siren.to) break
  }
  assert.ok(
    foundSiren,
    `the actual ${seats}-player armory route must spawn its guardian`,
  )
}
console.log(
  'rainbow Armory Siren: warned waves, saves and real 1/4-seat route passed',
)
