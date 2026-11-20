import assert from 'node:assert/strict'
import {
  NURSERY,
  NURSERY_GUARDIAN,
  NURSERY_SECTIONS,
  NURSERY_WAVES,
  nurseryRouteSpawns,
  nurserySpawns,
  nurseryStage,
} from '../arcade/games/rainbowLanternNursery'
import {
  TRENCH_FORK,
  trenchSpawns,
} from '../arcade/games/rainbowTrench'

assert.equal(NURSERY_SECTIONS.length, 5)
assert.equal(NURSERY_GUARDIAN.kind, 'lantern')
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
    assert.ok(
      ['angler', 'pistol', 'skate', 'clawstrike'].includes(spawn.kind),
    )
    assert.ok(
      !trenchSpawns(frame, 'vault', true).some((other) => other.wave === spawn.wave),
      'a Nursery craft cannot leak into the high salvage route',
    )
    seen.set(spawn.wave, (seen.get(spawn.wave) ?? 0) + 1)
    total++
  }
}
assert.equal(seen.size, NURSERY_WAVES.length, 'all 20 waves fly in-game')
assert.ok(total > 20, 'formations spawn multiple visible craft')
assert.deepEqual(
  nurseryRouteSpawns(TRENCH_FORK.rejoinAt, TRENCH_FORK.decideAt, TRENCH_FORK.rejoinAt),
  [],
  'no alternate wave leaks past the route join',
)
assert.deepEqual(
  nurseryRouteSpawns(TRENCH_FORK.decideAt - 1, TRENCH_FORK.decideAt, TRENCH_FORK.rejoinAt),
  [],
)
assert.deepEqual(nurseryRouteSpawns(12, 10, 10), [])
console.log(`Lantern Nursery runtime: ${total} craft in ${seen.size} live low-route waves`)

console.log('Rainbow Lantern Nursery alternate Act score contracts passed')
