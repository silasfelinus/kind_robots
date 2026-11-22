import assert from 'node:assert/strict'
import { formationMembers } from '../arcade/games/rainbowFormations'
import {
  RAINBOW_GUARDIAN,
  createRainbowGuardian,
  rainbowGuardianWarning,
  stepRainbowGuardian,
} from '../arcade/games/rainbowGuardian'
import {
  COMET,
  COMET_CADETS,
  COMET_GUARDIAN,
  COMET_SECTIONS,
  COMET_SURGES,
  COMET_TALKS,
  COMET_WAVES,
  COMET_WAVE_SIZES,
  cometCadetAvailable,
  cometCheckpointValid,
  cometCoralFragments,
  cometDetourFor,
  cometFullWing,
  cometHerderVolley,
  cometPhase,
  cometSpeed,
  cometSpawns,
  rescueCometCadet,
} from '../arcade/games/rainbowCoralComet'

assert.equal(COMET.id, 'X2')
assert.equal(COMET_WAVES.length, 52)
assert.equal(COMET_SECTIONS.length, 10)
assert.equal(COMET_SECTIONS[0]!.from, COMET.openingEnds)
assert.equal(COMET_SECTIONS.at(-1)!.to, COMET.end)
for (let i = 1; i < COMET_SECTIONS.length; i++)
  assert.equal(COMET_SECTIONS[i]!.from, COMET_SECTIONS[i - 1]!.to)
assert.deepEqual(COMET_GUARDIAN, {
  name: 'Comet Herder',
  from: 16800,
  to: 18000,
  kind: 'herder',
})
assert.deepEqual(Object.keys(COMET_TALKS), ['opening', 'turn', 'aftermath'])
for (const lines of Object.values(COMET_TALKS)) {
  assert.equal(lines.length, 3)
  assert.ok(lines.some((line) => line.speaker === 'Lilt-7'))
}

assert.equal(cometPhase(0), 'opening')
assert.equal(cometPhase(240), 'waves')
assert.equal(cometPhase(16799), 'waves')
assert.equal(cometPhase(16800), 'guardian')
assert.equal(cometPhase(18000), 'exit')
assert.equal(cometPhase(18600), 'done')
assert.equal(cometSpawns(COMET.guardianFrom).length, 0)
assert.equal(cometSpawns(COMET.guardianTo).length, 0)
assert.ok(
  COMET_WAVES.every(
    (entry, index) =>
      entry.at > COMET.openingEnds &&
      entry.at < COMET.guardianFrom &&
      (index === 0 || entry.at > COMET_WAVES[index - 1]!.at),
  ),
)

const formed = COMET_WAVES.flatMap((entry) => formationMembers(entry))
const emitted = []
for (let frame = 0; frame < COMET.end; frame++) {
  emitted.push(...cometSpawns(frame))
  if (frame >= COMET.guardianFrom)
    assert.equal(cometSpawns(frame).length, 0)
}
assert.equal(emitted.length, formed.length)
assert.equal(COMET_WAVE_SIZES.length, COMET_WAVES.length)
assert.equal(
  COMET_WAVE_SIZES.reduce((sum, size) => sum + size, 0),
  emitted.length,
)
assert.equal(new Set(emitted.map((entry) => entry.wave)).size, 52)
assert.ok(emitted.every((entry) => entry.y >= 52 && entry.y <= 218))
assert.deepEqual([...new Set(COMET_WAVES.map((wave) => wave.kind))].sort(), [
  'courier',
  'cutter',
  'dolphin',
  'eel',
  'scrap',
])

for (const seats of [1, 2, 3, 4]) {
  const upper = Array.from({ length: seats }, () => 80)
  const lower = Array.from({ length: seats }, () => 190)
  assert.equal(cometDetourFor(upper, true, true), true)
  assert.equal(cometDetourFor(lower, true, true), false)
  assert.equal(cometDetourFor(upper, false, true), false)
  assert.equal(cometDetourFor(upper, true, false), false)
}
assert.equal(cometDetourFor([80, 190], true, true), true)
assert.equal(cometDetourFor([190, 80], true, true), false)
assert.equal(cometDetourFor([80, 190, 190, 80], true, true), true)
assert.equal(cometDetourFor([190, 80, 80, 190], true, true), false)
assert.equal(cometDetourFor([], true, true), false)
assert.equal(cometDetourFor([NaN], true, true), false)

assert.equal(COMET_CADETS.length, 4)
assert.equal(new Set(COMET_CADETS.map((cadet) => cadet.id)).size, 4)
let mask = 0
for (let i = 0; i < COMET_CADETS.length; i++) {
  const cadet = COMET_CADETS[i]!
  assert.equal(cometCadetAvailable(cadet.at - 1, mask), null)
  assert.equal(cometCadetAvailable(cadet.at, mask)?.id, cadet.id)
  assert.equal(
    cometCadetAvailable(cadet.at + COMET.trainerWindow, mask),
    null,
  )
  mask = rescueCometCadet(mask, i + 1)
  assert.equal(cometCadetAvailable(cadet.at + 1, mask), null)
  assert.equal(rescueCometCadet(mask, i + 1), mask)
}
assert.equal(cometFullWing(mask), true)
assert.equal(cometFullWing(mask ^ 1), false)
assert.equal(cometCadetAvailable(0, -1), null)
assert.throws(() => rescueCometCadet(16, 1))
assert.throws(() => rescueCometCadet(0, 0))

const valid = {
  rescuedCourier: true,
  cometStartedAt: 34000,
  cometFrame: 9840,
  cometCadetsMask: 3,
  cometGuardianOutcome: 'waiting' as const,
  cometHits: 0,
}
assert.equal(cometCheckpointValid(4, 43840, valid), true)
for (const bad of [
  { ...valid, rescuedCourier: false },
  { ...valid, cometStartedAt: 0 },
  { ...valid, cometStartedAt: 32190 },
  { ...valid, cometFrame: 9900 },
  { ...valid, cometFrame: 18600 },
  { ...valid, cometCadetsMask: 16 },
  { ...valid, cometHits: -1 },
  { ...valid, cometGuardianOutcome: 'unknown' },
])
  assert.equal(cometCheckpointValid(4, 43840, bad), false)
assert.equal(cometCheckpointValid(3, 43840, valid), false)
assert.equal(cometCheckpointValid(4, 43841, valid), false)

for (const surge of COMET_SURGES) {
  assert.equal(cometSpeed(surge.from), 1)
  assert.ok(cometSpeed(surge.from + 120) > 1)
}
for (let frame = 0; frame <= COMET.end; frame += 30) {
  const speed = cometSpeed(frame)
  assert.ok(speed >= 1 && speed <= 1.65, 'speed always remains fair')
}
for (const volley of [1, 2, 3, 4]) {
  const shots = cometHerderVolley(volley)
  assert.equal(shots.length, 4)
  assert.ok(shots.every((shot) => shot.vx < 0))
  assert.ok(shots.every((shot) => Math.abs(shot.vy) > 0.2))
  assert.notDeepEqual(shots, cometHerderVolley(volley + 1))
}
const fragments = cometCoralFragments(390, 125)
assert.equal(fragments.length, 4)
assert.ok(fragments.every((shot) => shot.x === 390 && shot.y === 125))
assert.ok(fragments.every((shot) => shot.vx < 0))
assert.ok(fragments.some((shot) => shot.vy < 0))
assert.ok(fragments.some((shot) => shot.vy > 0))

for (const players of [1, 4]) {
  const guardian = createRainbowGuardian('herder', players)
  const targets = Array.from({ length: players }, (_, i) => ({
    x: 80,
    y: 70 + 50 * i,
    lives: 3,
  }))
  let first = [] as ReturnType<typeof stepRainbowGuardian>
  let warningFrames = 0
  for (let frame = 1; frame <= RAINBOW_GUARDIAN.firstVolley; frame++) {
    first = stepRainbowGuardian(guardian, targets, false)
    if (rainbowGuardianWarning(guardian)) warningFrames++
    if (frame < RAINBOW_GUARDIAN.firstVolley)
      assert.equal(first.length, 0)
  }
  assert.equal(warningFrames, RAINBOW_GUARDIAN.warningFrames)
  assert.equal(first.length, 4)
  assert.ok(first.every((shot) => shot.vx < 0))
  let second = [] as ReturnType<typeof stepRainbowGuardian>
  while (guardian.volleys < 2) {
    second = stepRainbowGuardian(guardian, targets, false)
    assert.ok(guardian.frame < 500)
  }
  assert.equal(second.length, 8)
  assert.ok(second.some((shot) => shot.vy > 0))
  assert.ok(second.some((shot) => shot.vy < 0))
  assert.deepEqual(stepRainbowGuardian(guardian, targets, true), [])
  assert.equal(guardian.leaving, true)
}
assert.ok(
  createRainbowGuardian('herder', 4).maxHp >
    createRainbowGuardian('herder', 1).maxHp,
)

console.log(
  'X2 Coral Comet: 52 waves, ten sections, four trainers, safe co-op fork, 310-second flight model and checkpoint proof passed',
)
