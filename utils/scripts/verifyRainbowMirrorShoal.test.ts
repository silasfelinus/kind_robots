import assert from 'node:assert/strict'
import {
  MIRROR_SHOAL,
  SHOAL_GUARDIAN,
  SHOAL_SECTIONS,
  SHOAL_WAVES,
  SHOAL_WAVE_SIZES,
  SHOAL_TALKS,
  mirrorShoalMedalEarned,
  mirrorShoalRouteUnlocked,
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
assert.deepEqual(
  [...new Set(SHOAL_WAVES.map((entry) => entry.kind))].sort(),
  ['harbinger', 'mirror', 'skate', 'squid'],
)
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
assert.equal(mirrorShoalStage(17700), 'complete')
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
assert.deepEqual(Object.keys(SHOAL_TALKS), [
  'opening',
  'turn',
  'aftermath',
])
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
    if (frame < RAINBOW_GUARDIAN.firstVolley)
      assert.equal(first.length, 0)
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
