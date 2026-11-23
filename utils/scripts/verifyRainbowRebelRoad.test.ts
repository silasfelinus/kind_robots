import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  CROWN_REEF_ALL_WAVES,
  CROWN_REEF,
} from '../arcade/games/rainbowCrownReef'
import { GLASS, GLASS_WAVES } from '../arcade/games/rainbowGlassCurrent'
import { PALACE, PALACE_WAVES } from '../arcade/games/rainbowEclipsePalace'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import {
  REBEL_ROAD,
  REBEL_TRUCE_KINDS,
  rebelEscortSpawns,
  rebelTruce,
  rebelTruceWaves,
  type RebelAct,
} from '../arcade/games/rainbowRebelRoad'
import { emptyInput } from '../arcade/types'

// Conductor rainbow t-060 (PLOT-MOTHERLAND.md "What each road changes"): on the rebel road some Ocean craft stop
// shooting at C.A.T.S. and the Motherland's own drones join the enemy waves; the loyal road is unchanged.

const ACTS: Record<
  RebelAct,
  { base: number; waves: readonly { at: number; kind: string }[] }
> = {
  6: { base: CROWN_REEF.waveBase, waves: CROWN_REEF_ALL_WAVES },
  7: { base: GLASS.waveBase, waves: GLASS_WAVES },
  8: { base: PALACE.waveBase, waves: PALACE_WAVES },
}

// Kinds that attack outside the aimed volley, are terrain or objectives, or are captives never hold a truce.
for (const kinds of Object.values(REBEL_TRUCE_KINDS))
  for (const never of [
    'mortar',
    'clawstrike',
    'brood',
    'captive',
    'gate',
    'pylon',
    'spire',
    'eel',
  ])
    assert.ok(!kinds.includes(never), `${never} never holds a truce`)

for (const act of [6, 7, 8] as const) {
  const { base, waves } = ACTS[act]
  for (let index = 0; index < waves.length; index++) {
    const wave = waves[index]!
    // The loyal road and an undecided crew fly every wave as authored.
    assert.equal(rebelTruce('loyal', act, wave.kind, base + index), false)
    assert.equal(rebelTruce(null, act, wave.kind, base + index), false)
    // A truce never applies to the wrong kind, a craft outside a wave or another Act.
    assert.equal(rebelTruce('rebel', act, 'not-a-kind', base + index), false)
  }
  assert.equal(rebelTruce('rebel', act, waves[0]!.kind, null), false)
  assert.equal(rebelTruce('rebel', 5, waves[0]!.kind, base), false)
  assert.equal(
    rebelTruce('rebel', act, waves[0]!.kind, base),
    false,
    `Act ${act}'s first school still fights`,
  )
  const routes = act === 6 ? (['relay', 'cache'] as const) : ([null] as const)
  for (const route of routes) {
    const truce = rebelTruceWaves(act, route)
    assert.ok(truce.length >= 2, `Act ${act} ${route ?? ''} has truce schools`)
    for (const id of truce) {
      const wave = waves[id - base]!
      assert.ok(REBEL_TRUCE_KINDS[act].includes(wave.kind))
      assert.equal(rebelTruce('rebel', act, wave.kind, id), true)
    }
    // One Motherland pair per truce school, a beat after it enters, inside the lanes; none on the loyal road.
    const escorts: number[] = []
    let last = 0
    for (const wave of waves) last = Math.max(last, wave.at)
    for (let frame = 0; frame <= last + REBEL_ROAD.escortDelay; frame++) {
      assert.deepEqual(rebelEscortSpawns('loyal', act, frame, route), [])
      for (const escort of rebelEscortSpawns('rebel', act, frame, route)) {
        assert.equal(escort.kind, 'motherdrone')
        assert.ok(
          escort.y >= REBEL_ROAD.escortTop &&
            escort.y <= REBEL_ROAD.escortBottom,
          'escorts fly inside the lanes',
        )
        escorts.push(frame)
      }
    }
    assert.equal(escorts.length, truce.length * 2, `Act ${act} escorts`)
  }
}

// Every way a truce craft could reach C.A.T.S. is closed in the engine itself.
const engine = readFileSync(
  new URL('../arcade/games/rainbowPrincessPreview.ts', import.meta.url),
  'utf8',
)
assert.match(
  engine,
  /function fireEnemy\(reef: Reef\) \{\s+if \(reef\.truce\) \{\s+truceHeld\+\+\s+return/,
  'a truce craft never fires',
)
assert.match(
  engine,
  /reef\.kind === 'captive' \|\|\s*reef\.truce\)\s+continue\s+const ship = ships/,
  'a truce craft never rams',
)
assert.match(
  engine,
  /shot\.struck\?\.includes\(reef\) \|\|\s*reef\.kind === 'captive' \|\|\s*reef\.truce/,
  'shots pass a truce craft',
)
assert.match(
  engine,
  /reef\.kind === 'spire' \|\| reef\.truce\) continue/,
  'supers pass a truce craft',
)
assert.match(
  engine,
  /reef\.kind === 'spire' \|\|\s*reef\.kind === 'captive' \|\|\s*reef\.truce\s*\)\s+continue/,
  'the Halo Pulse passes a truce craft',
)

// Flown: the attract demo turns on the empire with one pilot and stays the course with two (verifyRainbowMotherland).
function seeded(seed = 7) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}
for (const [players, road] of [
  [1, 'rebel'],
  [2, 'loyal'],
] as const) {
  const game = createRainbowPrincessPreview({
    players,
    demo: true,
    rng: seeded(),
    sound: { play() {} },
    hiScore: 0,
  })
  for (let frame = 0; frame < 200000 && game.snapshot.act !== 'S06'; frame++)
    game.update(emptyInput())
  assert.equal(game.snapshot.act, 'S06')
  assert.equal(game.snapshot.allegiance, road)
  const seen = { truce: 0, drones: 0 }
  // Read the Act fresh each frame: the assertion above narrowed the snapshot's type to S06.
  const act = (): string => game.snapshot.act
  for (
    let frame = 0;
    frame < 160000 && act() !== 'S09' && game.snapshot.failFrame === null;
    frame++
  ) {
    game.update(emptyInput())
    if (frame % 15) continue
    for (const enemy of game.snapshot.enemies) {
      if (enemy.truce) seen.truce++
      if (enemy.kind === 'motherdrone') seen.drones++
    }
  }
  if (road === 'rebel') {
    assert.ok(seen.truce > 0, 'rebel road: Ocean craft fly in truce')
    assert.ok(seen.drones > 0, 'rebel road: Motherland drones join the waves')
    assert.ok(
      game.snapshot.truceHeld > 0,
      'rebel road: truce craft hold their volleys',
    )
  } else {
    assert.equal(seen.truce, 0, 'loyal road: no truce')
    assert.equal(seen.drones, 0, 'loyal road: no Motherland drones')
    assert.equal(game.snapshot.truceHeld, 0)
  }
  console.log(
    `${road}: act ${act()}, truce sightings ${seen.truce}, drone sightings ${seen.drones}, held ${game.snapshot.truceHeld}`,
  )
}
console.log('rainbow rebel road: ok')
