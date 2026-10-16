import assert from 'node:assert/strict'
import { PINKWAKE } from '../arcade/games/rainbowPinkwake'
import { BOSS_MAX_HP } from '../arcade/games/rainbowPinkwakeBoss'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { emptyInput, type InputFrame } from '../arcade/types'

// Conductor rainbow t-019: B01's phase warnings, proven through real play. Ordinary pilots (no demo
// immortality, no snapshot edits) fly Act I, spend continues where they fall, and earn every phase
// crossing with their own shots. Every frame of the fight is drawn by the real renderer into a
// recording canvas, and every volley must follow 36 consecutive drawn warning frames. This is isolated
// engine and renderer evidence; shared-cabinet and device play remain separate proof.

const WARNING_FRAMES = 36
const CUE_STROKE = '#fffbb6'

function seeded(seed: number) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

/** A canvas stand-in that remembers whether this frame stroked the boss's warning outline. */
function recordingCanvas() {
  const state: Record<string | symbol, unknown> = {}
  const frame = { cue: false, texts: [] as string[] }
  const g = new Proxy(state, {
    get(target, key) {
      if (key === 'stroke')
        return () => {
          if (target.strokeStyle === CUE_STROKE) frame.cue = true
        }
      if (key === 'fillText')
        return (text: string) => {
          frame.texts.push(String(text))
        }
      if (key === 'measureText')
        return (text: string) => ({ width: String(text).length * 5 })
      if (key in target) return target[key]
      return () => ({ addColorStop() {} })
    },
    set(target, key, value) {
      target[key] = value
      return true
    },
  }) as unknown as CanvasRenderingContext2D
  return { g, frame }
}

type Game = ReturnType<typeof createRainbowPrincessPreview>

/** Fly the lanes through the waves; at the boss, hold its line and slip aside when a volley is due. */
function pilot(game: Game, seat: number, frame: number): InputFrame {
  const snapshot = game.snapshot
  const input = emptyInput()
  const ship = snapshot.ships[seat]
  if (!ship) return input
  input.held.a = true
  let target: number
  if (snapshot.boss) {
    const due = snapshot.boss.nextVolleyAt - snapshot.boss.frame
    const side = seat % 2 === 0 ? -1 : 1
    target = snapshot.boss.y + (due < 30 ? side * 46 : (seat - 1.5) * 8)
  } else target = 70 + ((Math.floor(frame / 240) + seat) % 3) * 70
  input.held.up = ship.y > target + 3
  input.held.down = ship.y < target - 3
  input.held.right = ship.x < 120
  return input
}

type Crossing = {
  to: number
  hp: number
  boundary: number
  duringWarning: boolean
}

function fight(players: number, seed: number) {
  const game = createRainbowPrincessPreview({
    players,
    demo: false,
    rng: seeded(seed),
    sound: { play() {} },
    hiScore: 0,
  })
  const { g, frame: drawn } = recordingCanvas()
  let cueRun = 0
  let volleys = 0
  let attempts = 0
  let continues = 0
  const crossings: Crossing[] = []
  let interrupted = 0
  let before = game.snapshot
  let leftAt: number | null = null
  for (let frame = 0; frame < 60000; frame++) {
    if (before.continueLeft > 0) {
      const input = emptyInput()
      input.pressed.a = before.continueLeft < 500
      if (input.pressed.a) continues++
      game.update(input)
      before = game.snapshot
      cueRun = 0
      continue
    }
    const inputs = Array.from({ length: players }, (_, seat) =>
      pilot(game, seat, frame),
    )
    game.update(inputs[0]!, inputs)
    const after = game.snapshot
    const boss = after.boss
    const prior = before.boss

    if (boss && boss.frame === 1) {
      attempts++
      // 2.5 base shares for the first pilot and 4 for each pilot after.
      assert.equal(boss.maxHp, BOSS_MAX_HP * (2.5 + 4 * (players - 1)))
      // A continue brings the boss back as damaged as the crew left it.
      assert.equal(
        boss.hp,
        leftAt ?? boss.maxHp,
        `attempt ${attempts} starts where the last one left off`,
      )
    }
    if (boss) leftAt = boss.hp
    if (boss && prior && boss.frame === prior.frame + 1) {
      // Damage lands after the boss step: the phase follows the HP one step later, never mid-step.
      const upper = (prior.maxHp * 2) / 3
      const lower = prior.maxHp / 3
      const expected = prior.hp > upper ? 1 : prior.hp > lower ? 2 : 3
      assert.equal(boss.phase, expected, `phase follows HP at ${after.tick}`)
      if (boss.phase !== prior.phase) {
        const duringWarning =
          prior.frame >= prior.nextVolleyAt - WARNING_FRAMES &&
          prior.frame < prior.nextVolleyAt
        crossings.push({
          to: boss.phase,
          hp: prior.hp,
          boundary: boss.phase === 2 ? upper : lower,
          duringWarning,
        })
        if (duringWarning) interrupted++
        assert.equal(
          boss.nextVolleyAt,
          boss.frame + 2 * WARNING_FRAMES,
          'a new phase restarts its warning from scratch',
        )
      }
      const fired = prior.nextVolleyAt <= boss.frame
      if (fired) {
        volleys++
        assert.ok(
          cueRun >= WARNING_FRAMES,
          `volley at boss frame ${boss.frame} (${players} pilots) followed ${cueRun} drawn warning frames`,
        )
      }
    }

    drawn.cue = false
    drawn.texts.length = 0
    game.render(g)
    cueRun = boss && drawn.cue ? cueRun + 1 : 0
    if (boss && boss.frame >= 1) {
      const due = boss.nextVolleyAt - boss.frame
      assert.equal(
        drawn.cue,
        due > 0 && due <= WARNING_FRAMES,
        `the drawn cue matches the warning window at boss frame ${boss.frame}`,
      )
    }

    if (after.defeatedAt !== null && before.defeatedAt === null) {
      assert.equal(after.boss, null)
      assert.equal(after.enemyShots.length, 0, 'defeat clears boss shots')
      assert.equal(after.enemies.length, 0)
      assert.ok(
        !drawn.texts.includes('POD'),
        'the rescued pod leaves with the boss',
      )
      for (const [seat, ship] of after.ships.entries()) {
        const was = before.ships[seat]!
        assert.equal(ship.lives, was.lives, 'defeat keeps lives')
        assert.equal(ship.shield, was.shield, 'defeat keeps shields')
        assert.equal(ship.power, was.power, 'defeat keeps power')
        assert.ok(ship.charge >= was.charge, 'defeat keeps charge')
      }
      const kept = after.ships.map(({ lives, shield, power }) => ({
        lives,
        shield,
        power,
      }))
      for (let i = 0; i <= PINKWAKE.aftermathFrames; i++) {
        game.update(emptyInput(), [])
      }
      const actTwo = game.snapshot
      assert.equal(actTwo.act, 'S02', 'the crew flies on into Act II')
      assert.deepEqual(
        actTwo.ships.map(({ lives, shield, power }) => ({
          lives,
          shield,
          power,
        })),
        kept,
        'ship resources carry into Act II',
      )
      return { crossings, volleys, attempts, continues, interrupted }
    }
    before = after
  }
  assert.fail(`${players} pilots should defeat B01`)
}

const runs = [
  { players: 1, seed: 1234 },
  { players: 4, seed: 1234 },
  { players: 2, seed: 77 },
  { players: 3, seed: 9001 },
]
const summary: string[] = []
const allCrossings: Crossing[] = []
for (const { players, seed } of runs) {
  const result = fight(players, seed)
  allCrossings.push(...result.crossings)
  assert.ok(result.volleys > 0, `${players} pilots met at least one volley`)
  assert.ok(
    result.crossings.some((c) => c.to === 2) &&
      result.crossings.some((c) => c.to === 3),
    `${players} pilots earned both HP crossings`,
  )
  summary.push(
    `${players}p: ${result.volleys} volleys, ${result.crossings.length} crossings (${result.interrupted} mid-warning), ${result.attempts} attempt(s), ${result.continues} continue(s)`,
  )
}
// The two-thirds and one-third hull boundaries are met both while the boss is charging (the cue is
// interrupted and restarts) and while it is not.
for (const [to, boundary] of [
  [2, 'two-thirds'],
  [3, 'one-third'],
] as const) {
  for (const duringWarning of [true, false]) {
    assert.ok(
      allCrossings.some(
        (c) => c.to === to && c.duringWarning === duringWarning,
      ),
      `the ${boundary} hull crossing is earned ${duringWarning ? 'mid-warning' : 'outside a warning'}`,
    )
  }
  assert.ok(
    allCrossings
      .filter((c) => c.to === to)
      .every((c) => c.hp <= c.boundary && c.hp > c.boundary - 10),
    `phase ${to} begins at the ${boundary} hull boundary`,
  )
}

console.log(`rainbow boss cue: ok (${summary.join('; ')})`)
