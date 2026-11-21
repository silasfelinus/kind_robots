import assert from 'node:assert/strict'
import {
  LIGHTHOUSE,
  LIGHTHOUSE_SECTIONS,
  LIGHTHOUSE_LAMPS,
  LIGHTHOUSE_WAVES,
  LIGHTHOUSE_WAVE_SIZES,
  LIGHTHOUSE_TALKS,
  lighthouseRouteUnlocked,
  lighthouseStage,
  lighthouseSpawns,
  lighthouseLampAt,
  lightLighthouseLamp,
  lighthouseMedalEarned,
  lighthouseBellkeeperVolley,
} from '../arcade/games/rainbowSunkenLighthouse'
import { CROWN_REEF_PYLONS } from '../arcade/games/rainbowCrownReef'

assert.equal(LIGHTHOUSE.id, 'X3')
assert.ok(CROWN_REEF_PYLONS > 0)
assert.equal(lighthouseRouteUnlocked('relay', true, CROWN_REEF_PYLONS), true)
assert.equal(lighthouseRouteUnlocked('relay', false, CROWN_REEF_PYLONS), false)
assert.equal(lighthouseRouteUnlocked('cache', true, CROWN_REEF_PYLONS), false)
assert.equal(lighthouseRouteUnlocked(null, true, CROWN_REEF_PYLONS), false)
assert.equal(
  lighthouseRouteUnlocked('relay', true, CROWN_REEF_PYLONS - 1),
  false,
)

assert.equal(LIGHTHOUSE_SECTIONS.length, 6)
assert.equal(LIGHTHOUSE_WAVES.length, 29)
assert.equal(LIGHTHOUSE_WAVE_SIZES.length, LIGHTHOUSE_WAVES.length)
assert.ok(LIGHTHOUSE_WAVE_SIZES.every((size) => size >= 1 && size <= 4))
assert.deepEqual(
  [...new Set(LIGHTHOUSE_WAVES.map((wave) => wave.kind))].sort(),
  ['harbinger', 'mirror', 'prism', 'squid'],
)
assert.ok(
  LIGHTHOUSE_WAVES.every(
    (wave, index) =>
      wave.at >= LIGHTHOUSE.openingEnds &&
      wave.at < LIGHTHOUSE.guardianFrom &&
      (index === 0 || wave.at > LIGHTHOUSE_WAVES[index - 1]!.at),
  ),
)
let spawned = 0
const visited = new Set<number>()
for (let frame = 0; frame <= LIGHTHOUSE.bossStarts; frame++) {
  const entries = lighthouseSpawns(frame)
  spawned += entries.length
  for (const entry of entries) {
    assert.ok(entry.y >= 52 && entry.y <= 218)
    assert.ok(
      entry.wave >= LIGHTHOUSE.waveBase &&
      entry.wave < LIGHTHOUSE.waveBase + LIGHTHOUSE_WAVES.length,
    )
    visited.add(entry.wave)
  }
  if (frame >= LIGHTHOUSE.guardianFrom)
    assert.equal(entries.length, 0, 'no craft intrude on the Bellkeeper')
}
assert.equal(visited.size, LIGHTHOUSE_WAVES.length)
assert.equal(
  spawned,
  LIGHTHOUSE_WAVE_SIZES.reduce((sum, size) => sum + size, 0),
)
assert.equal(lighthouseStage(0), 'opening')
assert.equal(lighthouseStage(LIGHTHOUSE.openingEnds), 'waves')
assert.equal(lighthouseStage(LIGHTHOUSE.turnStarts), 'turn')
assert.equal(lighthouseStage(LIGHTHOUSE.bossStarts), 'boss')

assert.equal(LIGHTHOUSE_LAMPS.length, 6)
assert.equal(new Set(LIGHTHOUSE_LAMPS.map((lamp) => lamp.id)).size, 6)
assert.ok(
  LIGHTHOUSE_LAMPS.every(
    (lamp, index) =>
      lamp.at >= LIGHTHOUSE.openingEnds &&
      lamp.at < LIGHTHOUSE.guardianFrom &&
      (index === 0 || lamp.at > LIGHTHOUSE_LAMPS[index - 1]!.at),
  ),
)
assert.equal(lighthouseLampAt(0), null)
let mask = 0
for (const [index, lamp] of LIGHTHOUSE_LAMPS.entries()) {
  assert.deepEqual(lighthouseLampAt(lamp.at), lamp)
  assert.equal(lighthouseMedalEarned(mask), false)
  mask = lightLighthouseLamp(mask, index + 1)
  assert.equal(lightLighthouseLamp(mask, index + 1), mask)
}
assert.equal(lighthouseMedalEarned(mask), true)
assert.equal(lighthouseMedalEarned(mask & ~(1 << 2)), false)
assert.throws(() => lightLighthouseLamp(0, 0))
assert.throws(() => lightLighthouseLamp(mask, 7))
assert.throws(() => lightLighthouseLamp(64, 1))
assert.throws(() => lightLighthouseLamp(1.5, 1))

assert.deepEqual(Object.keys(LIGHTHOUSE_TALKS), [
  'opening',
  'turn',
  'aftermath',
])
assert.ok(
  Object.values(LIGHTHOUSE_TALKS).every(
    (lines) =>
      lines.length === 3 &&
      lines.some((line) => line.speaker === 'Lilt-7') &&
      lines.every((line) => line.text.length > 20),
  ),
)
for (const enraged of [false, true]) {
  const hoop = lighthouseBellkeeperVolley(1, enraged)
  const wings = lighthouseBellkeeperVolley(2, enraged)
  assert.equal(hoop.length, enraged ? 13 : 10)
  assert.equal(wings.length, enraged ? 8 : 6)
  assert.ok(hoop.every((shot) => Number.isFinite(shot.angle)))
  assert.ok(wings.every((shot) => Number.isFinite(shot.angle)))
  assert.ok(
    wings.every(
      (shot) => Math.abs(shot.angle - Math.PI) >= 0.2,
    ),
    'both crescent wings preserve the aimed safe central lane',
  )
  assert.notDeepEqual(hoop, wings)
}
assert.throws(() => lighthouseBellkeeperVolley(0))

console.log(
  'rainbow lighthouse X3 score: 29 wave formations, six lamps, guardian' +
    ' patterns, route gate and three authored scenes passed',
)
