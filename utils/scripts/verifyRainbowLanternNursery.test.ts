import assert from 'node:assert/strict'
import {
  NURSERY,
  NURSERY_GUARDIAN,
  NURSERY_SECTIONS,
  NURSERY_SPAWNS,
  NURSERY_WAVES,
  nurserySpawns,
  nurseryStage,
} from '../arcade/games/rainbowLanternNursery'

assert.equal(NURSERY_SECTIONS.length, 5)
assert.equal(NURSERY_GUARDIAN.kind, 'lantern')
assert.equal(NURSERY_GUARDIAN.from, 3600)
assert.equal(NURSERY_WAVES.length, 20)
assert.ok(NURSERY_SPAWNS.length >= NURSERY_WAVES.length)
assert.equal(nurseryStage(0), 'opening')
assert.equal(nurseryStage(240), 'waves')
assert.equal(nurseryStage(4380), 'turn')
assert.equal(nurseryStage(4680), 'boss')
assert.deepEqual(nurserySpawns(0), [])
assert.deepEqual(nurserySpawns(4680), [])
assert.ok(nurserySpawns(300).length > 0)
assert.ok(NURSERY_WAVES.every((wave) => wave.at < NURSERY_GUARDIAN.from))
assert.ok(NURSERY_SPAWNS.every((spawn) => spawn.at >= NURSERY.openingEnds))
console.log('Rainbow Lantern Nursery alternate Act score contracts passed')
