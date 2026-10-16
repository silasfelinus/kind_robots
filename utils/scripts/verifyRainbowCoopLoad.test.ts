import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'
import { PINKWAKE_SECTIONS } from '../arcade/games/rainbowPinkwake'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { emptyInput, type InputFrame } from '../arcade/types'

// Conductor rainbow t-005: four local pilots at once. Simultaneous supers earned through real gun hits,
// same-frame hazards against stacked ships (one hazard never damages two pilots), and the full four-seat
// bullet load through the densest Act I section within a per-frame budget. Ordinary inputs only; where
// the crew falls it continues, as a player would.

function seeded(seed = 1234) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}
type Flight = ReturnType<typeof createRainbowPrincessPreview>
type Snapshot = Flight['snapshot']
const create = (effects: string[] = []) =>
  createRainbowPrincessPreview({
    players: 4,
    demo: false,
    rng: seeded(),
    sound: { play: (effect) => effects.push(effect) },
    hiScore: 0,
  })
function steer(
  input: InputFrame,
  ship: { x: number; y: number },
  x: number,
  y: number,
) {
  input.held.up = ship.y > y + 2
  input.held.down = ship.y < y - 2
  input.held.left = ship.x > x + 2
  input.held.right = ship.x < x - 2
}
function continueIfDown(game: Flight) {
  if (game.snapshot.continueLeft === 0) return false
  const input = emptyInput()
  input.pressed.a = game.snapshot.continueLeft < 500
  game.update(input, [input])
  return true
}

// 1. Four simultaneous supers: every pilot earns 100 charge with its own gun, then all four press B in
// the same frame.
{
  const effects: string[] = []
  const game = create(effects)
  const lanes = [70, 115, 160, 205]
  let charged = false
  for (let frame = 0; frame < 20000 && !charged; frame++) {
    if (continueIfDown(game)) continue
    const inputs = lanes.map((lane, seat) => {
      const input = emptyInput()
      input.held.a = true
      steer(input, game.snapshot.ships[seat]!, 70, lane)
      return input
    })
    game.update(inputs[0]!, inputs)
    charged = game.snapshot.ships.every((ship) => ship.charge === 100)
  }
  assert.ok(charged, 'all four pilots earned a full super through gun hits')
  const before = game.snapshot
  const shieldsBefore = before.ships.map((ship) => ship.shield)
  const extrasBefore = effects.filter((effect) => effect === 'extra').length
  const supers = Array.from({ length: 4 }, () => {
    const input = emptyInput()
    input.held.b = true
    input.pressed.b = true
    return input
  })
  game.update(supers[0]!, supers)
  const after = game.snapshot
  assert.equal(
    effects.filter((effect) => effect === 'extra').length - extrasBefore,
    4,
    'four supers fire in the same frame',
  )
  assert.ok(
    after.ships.every((ship) => ship.charge < 100),
    'each super spends its own charge',
  )
  assert.ok(
    after.ships.every(
      (ship, seat) =>
        ship.shield === Math.min(3, shieldsBefore[seat]! + 1) &&
        ship.invulnerable >= 59,
    ),
    // Seats after Solenne's tick their invulnerability once more in the same update, so 59 or 60.
    "Solenne's Halo shields the whole crew once",
  )
  assert.ok(after.score >= before.score, 'stacked supers never subtract score')
  assert.deepEqual(
    after.ships.map((ship) => ship.lives),
    before.ships.map((ship) => ship.lives),
    'supers cost no lives',
  )
  assert.ok(
    after.enemyShots.length <= before.enemyShots.length,
    'supers clear rather than add hostile shots',
  )
}

// 2. Same-frame hazards: four ships stacked on one spot and not firing. A hazard that reaches the stack
// damages at most one pilot, so in any frame the pilots damaged never outnumber the hazards there.
{
  const game = create()
  // Hazards that could reach any stacked ship this frame: craft within ram reach plus a frame of drift,
  // bullets within hit reach plus a frame of travel.
  const near = (prev: Snapshot) => {
    const close = (x: number, y: number, reach: number) =>
      prev.ships.some((ship) => Math.hypot(ship.x - x, ship.y - y) < reach)
    return (
      prev.enemies.filter((enemy) => close(enemy.x, enemy.y, 22)).length +
      prev.enemyShots.filter((shot) => close(shot.x, shot.y, 14)).length
    )
  }
  let contested = 0
  let checked = 0
  for (let frame = 0; frame < 9000; frame++) {
    if (continueIfDown(game)) continue
    const prev = game.snapshot
    const inputs = prev.ships.map((ship) => {
      const input = emptyInput()
      steer(input, ship, 120, 135 + Math.sin(frame / 90) * 60)
      return input
    })
    game.update(inputs[0]!, inputs)
    const now = game.snapshot
    if (now.continueLeft > 0 || now.tick !== prev.tick + 1) continue
    const stacked = prev.ships.every(
      (ship) =>
        Math.abs(ship.x - prev.ships[0]!.x) < 3 &&
        Math.abs(ship.y - prev.ships[0]!.y) < 3,
    )
    if (!stacked) continue
    const damaged = now.ships.filter(
      (ship, seat) =>
        ship.shield < prev.ships[seat]!.shield ||
        ship.lives < prev.ships[seat]!.lives,
    ).length
    if (!damaged) continue
    checked++
    const hazards = near(prev)
    assert.ok(
      damaged <= hazards,
      `frame ${now.tick}: ${damaged} stacked pilots damaged by ${hazards} hazards`,
    )
    const vulnerable = prev.ships.filter(
      (ship) => ship.lives > 0 && ship.invulnerable === 0,
    ).length
    if (hazards === 1 && vulnerable >= 2) contested++
  }
  assert.ok(checked > 0, 'stacked pilots met real hazards')
  assert.ok(
    contested > 0,
    'a single hazard met several vulnerable stacked pilots and damaged only one',
  )
}

// 3. Four-seat load through the densest Act I stretch: all pilots firing, every frame updated and drawn,
// inside a per-frame budget.
{
  const game = create()
  const g = new Proxy({} as Record<string | symbol, unknown>, {
    get(target, key) {
      if (key in target) return target[key]
      if (key === 'measureText')
        return (text: string) => ({ width: String(text).length * 5 })
      return () => ({ addColorStop() {} })
    },
    set(target, key, value) {
      target[key] = value
      return true
    },
  }) as unknown as CanvasRenderingContext2D
  let worst = 0
  let total = 0
  let frames = 0
  let peakObjects = 0
  const storm = PINKWAKE_SECTIONS.find(
    (section) => section.name === 'Pearl storm',
  )!
  for (let frame = 0; frame < 40000; frame++) {
    if (continueIfDown(game)) continue
    const snapshot = game.snapshot
    if (snapshot.tick >= storm.to) break
    const inputs = snapshot.ships.map((ship, seat) => {
      const input = emptyInput()
      input.held.a = true
      steer(input, ship, 80, 60 + seat * 50 + Math.sin(frame / 70) * 20)
      return input
    })
    const start = performance.now()
    game.update(inputs[0]!, inputs)
    game.render(g)
    const spent = performance.now() - start
    if (snapshot.tick >= storm.from) {
      worst = Math.max(worst, spent)
      total += spent
      frames++
      const now = game.snapshot
      peakObjects = Math.max(
        peakObjects,
        now.shots.length + now.enemyShots.length + now.enemies.length,
      )
    }
  }
  assert.ok(
    frames > 1000,
    `four pilots flew the Pearl storm (${frames} frames)`,
  )
  const average = total / frames
  assert.ok(
    peakObjects > 40,
    `the stretch is under real load (${peakObjects} objects)`,
  )
  assert.ok(average < 2, `average frame ${average.toFixed(3)}ms`)
  assert.ok(
    worst < 16,
    `worst frame ${worst.toFixed(2)}ms stays inside one 60 Hz frame`,
  )
  console.log(
    `rainbow four-pilot co-op: ok (4 same-frame supers; stacked hazards one-for-one; Pearl storm ${frames} frames, peak ${peakObjects} objects, avg ${average.toFixed(3)}ms, worst ${worst.toFixed(2)}ms)`,
  )
}
