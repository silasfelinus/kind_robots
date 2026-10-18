import assert from 'node:assert/strict'
import { MOONJELLY } from '../arcade/games/rainbowMoonjelly'
import { TRENCH } from '../arcade/games/rainbowTrench'
import { AURELIA_MAX_HP } from '../arcade/games/rainbowMoonjellyBoss'
import {
  BOSS_MAX_HP,
  rainbowBossHp,
  rainbowBossPhase,
} from '../arcade/games/rainbowPinkwakeBoss'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { emptyInput, type InputFrame } from '../arcade/types'

// Conductor rainbow t-007: measure a first clear of Acts I-II. Ordinary pilots (no demo immortality,
// no snapshot edits) fly both Acts, spend their super at the bosses and continue where they fall.
// Every boss must show all three phases and last a real fight, and a continue mid-fight must keep the
// damage the crew already dealt. The world bible's pacing target was 10-15 minutes per Act; Silas's first
// playtest (2026-10-17: "too easy and too long ... monotonous") cut it, so a clean solo run (the deathless
// demo pilot) must now land between CLEAN_MIN and CLEAN_MAX minutes. Ordinary pilots, continues included,
// may take longer but not absurdly so, and may not fall below the floor.
const CLEAN_MIN_MINUTES = 3
const CLEAN_MAX_MINUTES = 15
const ACT_FLOOR_MINUTES = 3
const ACT_CEILING_MINUTES = 20

const MINUTE = 3600

assert.equal(rainbowBossHp(BOSS_MAX_HP, 1), 375)
assert.equal(rainbowBossHp(BOSS_MAX_HP, 2), 975)
assert.equal(rainbowBossHp(BOSS_MAX_HP, 4), 2175)
assert.equal(rainbowBossHp(AURELIA_MAX_HP, 1), 525)
assert.equal(rainbowBossHp(AURELIA_MAX_HP, 4), 3045)
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
  let actTwoAt = 0
  for (let frame = 0; frame < 40 * MINUTE; frame++) {
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
    if (after.act === 'S02' && actTwoAt === 0) actTwoAt = frame
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
      return {
        // Like Act I (timed to Act II's start), Act II includes its closing A02.AFTER scene.
        acts: [
          actTwoAt / MINUTE,
          (frame + 1 - actTwoAt + MOONJELLY.aftermathFrames) / MINUTE,
        ],
        continues,
        fights,
      }
    }
  }
  assert.fail(`${players} pilots should clear Act II`)
}

const summary: string[] = []
for (const { players, seed } of [
  { players: 1, seed: 1234 },
  { players: 4, seed: 1234 },
]) {
  const { acts, continues, fights } = firstClear(players, seed)
  acts.forEach((minutes, index) => {
    assert.ok(
      minutes >= ACT_FLOOR_MINUTES && minutes <= ACT_CEILING_MINUTES,
      `${players}-pilot Act ${index + 1} takes ${minutes.toFixed(2)} minutes`,
    )
  })
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
    `${players}p Act I ${acts[0]!.toFixed(2)} + Act II ${acts[1]!.toFixed(2)} min, ${continues} continue(s), B01 ${(fights.b01.frames / 60).toFixed(0)}s over ${fights.b01.attempts} attempt(s), B02 ${(fights.b02.frames / 60).toFixed(0)}s over ${fights.b02.attempts} attempt(s), ${fights.b01.carried + fights.b02.carried} carried hull(s)`,
  )
}

// A clean solo run, excluding retries: the demo pilot never dies, so each Act's length is the authored
// sections plus a real boss fight.
{
  const game = createRainbowPrincessPreview({
    players: 1,
    demo: true,
    rng: seeded(1234),
    sound: { play() {} },
    hiScore: 0,
  })
  let actTwoAt = 0
  let actThreeAt = 0
  let clean: number[] = []
  for (let frame = 0; frame < 50 * MINUTE; frame++) {
    game.update(emptyInput())
    const s = game.snapshot
    if (s.act === 'S02' && actTwoAt === 0) actTwoAt = frame
    if (s.act === 'S03' && actThreeAt === 0) actThreeAt = frame
    if (s.act === 'S03' && s.stage === 'aftermath') {
      // Each Act runs to the next one's start; Act III includes its closing A03.AFTER scene.
      clean = [
        actTwoAt / MINUTE,
        (actThreeAt - actTwoAt) / MINUTE,
        (frame + 1 - actThreeAt + TRENCH.aftermathFrames) / MINUTE,
      ]
      break
    }
  }
  assert.equal(clean.length, 3, 'the clean run clears Act III')
  clean.forEach((minutes, index) =>
    assert.ok(
      minutes >= CLEAN_MIN_MINUTES && minutes <= CLEAN_MAX_MINUTES,
      `a clean solo Act ${index + 1} takes ${minutes.toFixed(2)} minutes`,
    ),
  )
  summary.push(
    `clean solo Act I ${clean[0]!.toFixed(2)} + Act II ${clean[1]!.toFixed(2)} + Act III ${clean[2]!.toFixed(2)} min`,
  )
}

console.log(`rainbow first clear: ok (${summary.join('; ')})`)
