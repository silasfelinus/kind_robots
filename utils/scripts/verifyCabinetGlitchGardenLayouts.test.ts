import assert from 'node:assert/strict'
import {
  GARDENS,
  LAYOUT_CAN,
  LAYOUT_EXIT,
  LAYOUT_HEATER,
  LAYOUT_LAMP,
  LAYOUT_LEAF,
  LAYOUT_PUMPKIN,
  LAYOUT_SUNFLOWER,
  LAYOUT_TREE,
  MAX_HEADS,
  MAX_SPEED,
  MIN_BEETLE_EVERY,
  MIN_BODY,
  lapWave,
} from '../arcade/games/glitchGardenGardens'

const allowed = new Set([
  '.',
  LAYOUT_LAMP,
  LAYOUT_CAN,
  LAYOUT_TREE,
  LAYOUT_SUNFLOWER,
  LAYOUT_EXIT,
  LAYOUT_LEAF,
  LAYOUT_PUMPKIN,
  LAYOUT_HEATER,
])

assert.ok(GARDENS.length >= 8, 'the four seasons have authored gardens')
assert.equal(new Set(GARDENS.map((garden) => garden.id)).size, GARDENS.length)
assert.deepEqual(
  new Set(GARDENS.map((garden) => garden.season)),
  new Set(['spring', 'summer', 'autumn', 'winter']),
)

for (const garden of GARDENS) {
  assert.equal(garden.layout.length, 36, `${garden.id}: 36 rows`)
  for (const [index, row] of garden.layout.entries()) {
    assert.equal(row.length, 30, `${garden.id}: row ${index + 1} width`)
    for (const glyph of row) {
      assert.ok(allowed.has(glyph), `${garden.id}: invalid glyph ${glyph}`)
    }
  }

  assert.equal(garden.intro.length, 2, `${garden.id}: two intro lines`)
  assert.ok(
    garden.intro.every((line) => line.trim().length > 0),
    `${garden.id}: non-empty intro`,
  )
  assert.ok(garden.waves.length > 0, `${garden.id}: authored waves`)

  for (const [index, wave] of garden.waves.entries()) {
    const label = `${garden.id} wave ${index + 1}`
    assert.ok(wave.segments >= MIN_BODY, `${label}: body length`)
    assert.ok(wave.heads >= 0 && wave.heads <= MAX_HEADS, `${label}: heads`)
    assert.ok(wave.speed > 0 && wave.speed <= MAX_SPEED, `${label}: speed`)
    assert.ok(
      wave.beetleEvery === null || wave.beetleEvery >= MIN_BEETLE_EVERY,
      `${label}: beetle interval`,
    )
    assert.ok(wave.sub.trim().length > 0, `${label}: wave subtitle`)
    if (wave.objective) {
      assert.ok(wave.objective.title.trim(), `${label}: objective title`)
      assert.ok(wave.objective.hint.trim(), `${label}: objective hint`)
    }

    const laterLap = lapWave(wave, 12)
    assert.ok(laterLap.speed <= MAX_SPEED, `${label}: lap speed cap`)
    assert.ok(laterLap.heads <= MAX_HEADS, `${label}: lap head cap`)
    assert.ok(
      laterLap.beetleEvery !== null && laterLap.beetleEvery >= MIN_BEETLE_EVERY,
      `${label}: lap beetle cap`,
    )
  }
}

console.log('Glitch Garden: all seasonal layouts and wave bounds verified')
