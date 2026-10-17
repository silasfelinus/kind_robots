import assert from 'node:assert/strict'
import { findArcadeGame } from '../arcade/games'
import { BOSS_MAX_HP, rainbowBossHp } from '../arcade/games/rainbowPinkwakeBoss'
import { PINKWAKE_GUARDIAN } from '../arcade/games/rainbowPinkwake'
import {
  RAINBOW_DIFFICULTY,
  createRainbowPrincessPreview,
} from '../arcade/games/rainbowPrincessPreview'
import { RAINBOW_GUARDIAN } from '../arcade/games/rainbowGuardian'
import { ARCADE_DIFFICULTIES, emptyInput } from '../arcade/types'
import type { ArcadeDifficulty } from '../arcade/types'

// Conductor rainbow t-010: Cadet, Pilot and Ace difficulty. The cabinet offers the three levels by name, the
// engine scales lives, enemy pellet speed, craft and boss hulls and the recorded score by the level, Pilot
// (normal) is the unscaled game every other verifier flies, and each level still clears Act I in the demo.

const meta = findArcadeGame('rainbow-bullet-hell-space-princess')
assert.deepEqual(meta?.difficulty, ['Cadet', 'Pilot', 'Ace'])
assert.deepEqual([...ARCADE_DIFFICULTIES], ['easy', 'normal', 'hard'])
assert.deepEqual(RAINBOW_DIFFICULTY.normal, {
  lives: 3,
  bulletSpeed: 1,
  craftHp: 1,
  bossHp: 1,
  score: 1,
})
assert.ok(RAINBOW_DIFFICULTY.easy.lives > RAINBOW_DIFFICULTY.normal.lives)
for (const key of ['bulletSpeed', 'craftHp', 'bossHp', 'score'] as const) {
  assert.ok(RAINBOW_DIFFICULTY.easy[key] < 1, `Cadet ${key} is gentler`)
  assert.ok(RAINBOW_DIFFICULTY.hard[key] > 1, `Ace ${key} is sterner`)
}

function seeded(seed = 1234) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}
const create = (difficulty?: ArcadeDifficulty, demo = true) =>
  createRainbowPrincessPreview({
    players: 1,
    demo,
    rng: seeded(),
    sound: { play() {} },
    hiScore: 0,
    difficulty,
  })

// No choice (and an unknown one) flies the unscaled Pilot game.
assert.equal(create().snapshot.ships[0]!.lives, 3)
assert.equal(
  create('legendary' as ArcadeDifficulty).snapshot.ships[0]!.lives,
  3,
  'an unknown level falls back to Pilot',
)

const summary: string[] = []
const firstCraftHealth: Partial<Record<ArcadeDifficulty, number>> = {}
for (const difficulty of ARCADE_DIFFICULTIES) {
  const level = RAINBOW_DIFFICULTY[difficulty]
  const game = create(difficulty)
  assert.equal(game.snapshot.ships[0]!.lives, level.lives)
  let before = game.snapshot
  let pelletChecked = false
  let firstCraft: number | null = null
  let guardianChecked = false
  let bossChecked = false
  let cleared = false
  for (let frame = 0; frame < 60000 && !cleared; frame++) {
    game.update(emptyInput())
    const after = game.snapshot
    // Every pellet that flew straight on moved by its velocity times the level's speed.
    if (!pelletChecked)
      for (const bullet of after.enemyShots) {
        const was = before.enemyShots.find(
          (b) => b.vx === bullet.vx && b.vy === bullet.vy && !b.bounces,
        )
        if (
          !was ||
          was.fuse !== undefined ||
          Math.abs(was.x + was.vx * level.bulletSpeed - bullet.x) > 1e-9
        )
          continue
        assert.ok(
          Math.abs(was.y + was.vy * level.bulletSpeed - bullet.y) < 1e-9,
        )
        pelletChecked = true
        break
      }
    if (firstCraft === null && after.enemies.length)
      firstCraft = after.enemies[0]!.health
    if (after.guardian && !guardianChecked) {
      guardianChecked = true
      assert.equal(
        after.guardian.maxHp,
        Math.max(
          1,
          Math.round(rainbowBossHp(RAINBOW_GUARDIAN.baseHp, 1) * level.bossHp),
        ),
        `${difficulty} guardian hull`,
      )
      assert.equal(PINKWAKE_GUARDIAN.kind, after.guardian.kind)
    }
    if (after.boss && !bossChecked) {
      bossChecked = true
      assert.equal(
        after.boss.maxHp,
        Math.max(1, Math.round(rainbowBossHp(BOSS_MAX_HP, 1) * level.bossHp)),
        `${difficulty} boss hull`,
      )
    }
    if (after.act === 'S02') cleared = true
    before = after
  }
  assert.ok(pelletChecked, `${difficulty}: a pellet was checked`)
  assert.ok(guardianChecked && bossChecked, `${difficulty}: hulls checked`)
  assert.ok(cleared, `${difficulty}: the demo clears Act I`)
  // The cabinet records the score scaled by the level; the run's own score stays unscaled.
  assert.equal(
    game.score,
    Math.round(game.snapshot.score * level.score),
    `${difficulty} score scale`,
  )
  summary.push(`${difficulty} ${game.score}`)
  firstCraftHealth[difficulty] = firstCraft ?? 0
}

// The same first craft is softer for a Cadet and tougher for an Ace.
assert.ok(firstCraftHealth.easy! <= firstCraftHealth.normal!)
assert.ok(firstCraftHealth.hard! > firstCraftHealth.normal!)

// A seated (non-demo) game starts the crew on the level's lives too.
{
  const game = create('easy', false)
  for (let i = 0; i < 10; i++) game.update(emptyInput())
  assert.equal(game.snapshot.ships[0]!.lives, RAINBOW_DIFFICULTY.easy.lives)
}

console.log(
  `rainbow difficulty: ok (Cadet/Pilot/Ace; Act I scores ${summary.join(', ')}; lives, pellet speed, hulls, score scale)`,
)
