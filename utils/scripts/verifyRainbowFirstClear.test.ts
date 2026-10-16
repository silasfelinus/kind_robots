import assert from 'node:assert/strict'
import { AURELIA_MAX_HP } from '../arcade/games/rainbowMoonjellyBoss'
import {
  BOSS_MAX_HP,
  rainbowBossHp,
  rainbowBossPhase,
} from '../arcade/games/rainbowPinkwakeBoss'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { emptyInput, type InputFrame } from '../arcade/types'

// Conductor rainbow t-007: a measured first clear of Acts I-II. Ordinary pilots (no demo immortality,
// no snapshot edits) fly both Acts, spend their super at the bosses and continue where they fall. The
// solo clear must land in the 10-15 minute window (a full crew may finish a little sooner), every boss
// must show all three phases and last a real fight, and a continue mid-fight must keep the damage the
// crew already dealt.

const MINUTE = 3600

assert.equal(rainbowBossHp(BOSS_MAX_HP, 1), 375)
assert.equal(rainbowBossHp(BOSS_MAX_HP, 4), 1500)
assert.equal(rainbowBossHp(AURELIA_MAX_HP, 1), 525)
assert.equal(rainbowBossHp(AURELIA_MAX_HP, 4), 2100)
assert.equal(rainbowBossHp(BOSS_MAX_HP, 0), 375, 'never an empty hull')
assert.equal(rainbowBossPhase(375, 375), 1)
assert.equal(rainbowBossPhase(250, 375), 2, 'two thirds turns phase 2')
assert.equal(rainbowBossPhase(251, 375), 1)
assert.equal(rainbowBossPhase(125, 375), 3, 'one third turns phase 3')
assert.equal(rainbowBossPhase(126, 375), 2)

function seeded(seed: number) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

type Game = ReturnType<typeof createRainbowPrincessPreview>

/** Fly the lanes through the waves; at a boss, hold its line, slip aside for volleys and spend the super. */
function pilot(game: Game, seat: number, frame: number): InputFrame {
  const snapshot = game.snapshot
  const input = emptyInput()
  const ship = snapshot.ships[seat]
  if (!ship) return input
  input.held.a = true
  const fight = snapshot.boss
    ? {
        y: snapshot.boss.y,
        due: snapshot.boss.nextVolleyAt - snapshot.boss.frame,
      }
    : snapshot.moonBoss
      ? {
          y: snapshot.moonBoss.y,
          due: snapshot.moonBoss.nextVolley - snapshot.moonBoss.frame,
        }
      : null
  let target: number
  if (fight) {
    const side = seat % 2 === 0 ? -1 : 1
    target = fight.y + (fight.due < 30 ? side * 46 : (seat - 1.5) * 8)
    input.pressed.b = ship.charge >= 100
  } else target = 70 + ((Math.floor(frame / 240) + seat) % 3) * 70
  input.held.up = ship.y > target + 3
  input.held.down = ship.y < target - 3
  input.held.right = ship.x < 120
  return input
}

type Fight = {
  attempts: number
  phases: Set<number>
  carried: number
  frames: number
}

function firstClear(players: number, seed: number) {
  const game = createRainbowPrincessPreview({
    players,
    demo: false,
    rng: seeded(seed),
    sound: { play() {} },
    hiScore: 0,
  })
  const fights: Record<'b01' | 'b02', Fight> = {
    b01: { attempts: 0, phases: new Set(), carried: 0, frames: 0 },
    b02: { attempts: 0, phases: new Set(), carried: 0, frames: 0 },
  }
  const leftAt: Record<'b01' | 'b02', number | null> = { b01: null, b02: null }
  let continues = 0
  for (let frame = 0; frame < 30 * MINUTE; frame++) {
    const before = game.snapshot
    if (before.continueLeft > 0) {
      const input = emptyInput()
      input.pressed.a = before.continueLeft < 500
      if (input.pressed.a) continues++
      game.update(input)
      continue
    }
    game.update(
      emptyInput(),
      Array.from({ length: players }, (_, seat) => pilot(game, seat, frame)),
    )
    const after = game.snapshot
    for (const [key, boss, base] of [
      ['b01', after.boss, BOSS_MAX_HP],
      ['b02', after.moonBoss, AURELIA_MAX_HP],
    ] as const) {
      if (!boss) continue
      const fight = fights[key]
      if (boss.frame === 1) {
        fight.attempts++
        assert.equal(boss.maxHp, rainbowBossHp(base, players))
        const expected = leftAt[key] ?? boss.maxHp
        assert.equal(
          boss.hp,
          expected,
          `${key} attempt ${fight.attempts} keeps the crew's damage`,
        )
        if (leftAt[key] !== null && leftAt[key]! < boss.maxHp) fight.carried++
      }
      fight.phases.add(boss.phase)
      fight.frames++
      leftAt[key] = boss.hp
    }
    if (after.act === 'S02' && after.stage === 'aftermath') {
      return { frames: frame + 1, continues, fights }
    }
  }
  assert.fail(`${players} pilots should clear Act II`)
}

const summary: string[] = []
for (const { players, seed, shortest } of [
  { players: 1, seed: 1234, shortest: 10 },
  { players: 4, seed: 1234, shortest: 9 },
]) {
  const { frames, continues, fights } = firstClear(players, seed)
  const minutes = frames / MINUTE
  assert.ok(
    minutes >= shortest && minutes <= 15,
    `${players}-pilot first clear takes ${minutes.toFixed(2)} minutes`,
  )
  for (const [key, fight] of Object.entries(fights)) {
    assert.deepEqual(
      [...fight.phases].sort(),
      [1, 2, 3],
      `${players} pilots see every ${key} phase`,
    )
    assert.ok(
      fight.frames >= 30 * 60,
      `${players} pilots fight ${key} for ${(fight.frames / 60).toFixed(0)}s`,
    )
  }
  summary.push(
    `${players}p ${minutes.toFixed(2)} min, ${continues} continue(s), B01 ${(fights.b01.frames / 60).toFixed(0)}s over ${fights.b01.attempts} attempt(s), B02 ${(fights.b02.frames / 60).toFixed(0)}s over ${fights.b02.attempts} attempt(s), ${fights.b01.carried + fights.b02.carried} carried hull(s)`,
  )
}

console.log(`rainbow first clear: ok (${summary.join('; ')})`)
