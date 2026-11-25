import assert from 'node:assert/strict'
import { emptyInput } from '../arcade/types'
import { create } from '../arcade/games/superkateSpectrum'
import { readSpectrumSave } from '../arcade/superkateSpectrum/progress'
import {
  endingForStory,
  STORY_DECISIONS,
} from '../arcade/superkateSpectrum/story'
import type { StoryChoice } from '../arcade/superkateSpectrum/story'

// Full-campaign playthrough (conductor kr-arcade t-184): a bot plays all 30 Story boards and the six
// chapter bosses through the game's own update loop, one real shot at a time. For each shot it tries a
// fan of aim angles on a throwaway copy of the game, keeps the one that does the most good, then
// aims the real game there and presses A; nothing is cleared, skipped or patched by hand. It plays
// each of the three choice routes from a fresh save and checks the ending, the career (stage 30
// unlocked, every stage starred, chapter trophies earned) and that the save never goes missing.

type Game = ReturnType<typeof create> & Record<string, unknown>
type Snapshot = {
  level: number
  lives: number
  over: boolean
  won: boolean
  bubbles: number
  bossHits: number
  bossMisses: number
  score: number
}

const ANGLES = Array.from(
  { length: 81 },
  (_, i) => -Math.PI + 0.18 + ((Math.PI - 0.36) * i) / 80,
)
const MAX_FRAMES_PER_SHOT = 400

function seeded(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

const options = (seed: number) =>
  ({
    rng: seeded(seed),
    demo: false,
    hiScore: 0,
    sound: { play: () => {} },
    resume: readSpectrumSave(null),
  }) as unknown as Parameters<typeof create>[0]

const bubbles = (game: Game) =>
  (game.board as (string | null)[][]).reduce(
    (sum, row) => sum + row.filter(Boolean).length,
    0,
  )

function snapshot(game: Game): Snapshot {
  const boss = game.boss as { hits: number; misses: number } | null
  return {
    level: game.level,
    lives: game.lives,
    over: game.over,
    won: game.won,
    bubbles: bubbles(game),
    bossHits: boss?.hits ?? 0,
    bossMisses: boss?.misses ?? 0,
    score: game.score,
  }
}

/** A throwaway copy for trying an angle: its own board, career and sets, and a fixed rng. */
function copy(game: Game): Game {
  const twin = Object.assign(Object.create(Object.getPrototypeOf(game)), game)
  twin.board = (game.board as unknown[][]).map((row) => [...row])
  twin.career = {
    ...(game.career as object),
    stars: [...(game.career as { stars: number[] }).stars],
  }
  twin.boss = game.boss ? { ...(game.boss as object) } : null
  twin.sparks = []
  twin.feats = []
  const internal = game as unknown as {
    earned: Set<string>
    powerTipsShown: Set<string>
  }
  twin.earned = new Set(internal.earned)
  twin.storyChoices = [...(game.storyChoices as unknown[])]
  twin.storyEndings = [...(game.storyEndings as unknown[])]
  twin.powerTipsShown = new Set(internal.powerTipsShown)
  twin.rng = () => 0.5
  return twin
}

const press = (button: 'a' | 'b') => {
  const input = emptyInput()
  input.pressed[button] = true
  return input
}

/** Fire at `angle` and run frames until the orb has landed (or the board moved on). */
function shoot(game: Game, angle: number) {
  game.angle = angle
  game.update(press('a'))
  for (let frame = 0; frame < MAX_FRAMES_PER_SHOT && game.shot; frame++)
    game.update(emptyInput())
  assert.equal(game.shot, null, 'every shot lands within the frame budget')
}

/** How much good a shot did, from the bot's point of view. */
function value(before: Snapshot, after: Snapshot) {
  if (after.won) return 1e9
  if (after.level > before.level) return 1e8
  if (after.lives < before.lives || after.over) return -1e8
  if (before.bossHits + before.bossMisses > 0 || after.bossHits > 0) {
    if (after.bossHits > before.bossHits) return 1e7
    if (after.bossMisses > before.bossMisses) return -1e6
  }
  return (before.bubbles - after.bubbles) * 1000 + (after.score - before.score)
}

function bestAngle(game: Game, swap: boolean) {
  let best = { angle: -Math.PI / 2, score: -Infinity }
  const before = snapshot(game)
  for (const angle of ANGLES) {
    const twin = copy(game)
    if (swap) twin.update(press('b'))
    shoot(twin, angle)
    const score = value(before, snapshot(twin))
    if (score > best.score) best = { angle, score }
  }
  return best
}

function playCampaign(route: readonly [StoryChoice, StoryChoice, StoryChoice]) {
  const game = create(options(route.join('').length * 977 + 31)) as Game
  game.update(press('a'))
  assert.equal(game.choosingMode, false, 'Story stage 1 starts from the hub')
  let shots = 0
  let bossShots = 0
  let lostLives = 0
  let decisions = 0
  while (!game.over) {
    if (game.pendingChoice !== null) {
      const scene = game.pendingChoice as number
      game.choiceCursor = route[scene]!
      game.update(press('a'))
      assert.equal(game.pendingChoice, null, 'a story choice confirms')
      decisions++
      continue
    }
    const lives = game.lives
    const level = game.level
    // Try the loaded orb and the swapped one (swaps are free outside bosses).
    const plain = bestAngle(game, false)
    const swapped = game.boss ? null : bestAngle(game, true)
    if (swapped && swapped.score > plain.score) {
      game.update(press('b'))
      shoot(game, swapped.angle)
    } else shoot(game, plain.angle)
    shots++
    if (game.boss || (level % 5 === 0 && game.level > level)) bossShots++
    if (game.lives < lives && game.level === level) lostLives++
    assert.ok(shots < 2000, 'the campaign finishes in a sane number of shots')
  }
  return { game, shots, bossShots, lostLives, decisions }
}

const routes = [
  [0, 0, 0],
  [0, 1, 0],
  [1, 1, 1],
] as const
const endings = new Set<string>()
for (const route of routes) {
  const started = Date.now()
  const { game, shots, bossShots, lostLives, decisions } = playCampaign(route)
  const career = game.career as {
    highestStage: number
    stars: number[]
  }
  assert.equal(game.won, true, `route ${route}: the campaign is won`)
  assert.equal(game.level, 30, `route ${route}: it ends on stage 30`)
  assert.equal(decisions, STORY_DECISIONS.length, 'all three choices are met')
  assert.equal(game.ending, endingForStory(route), `route ${route}: ending`)
  endings.add(game.ending as string)
  assert.equal(career.highestStage, 30)
  assert.ok(
    career.stars.every((stars) => stars >= 1),
    `route ${route}: every stage earned at least one star`,
  )
  const save = game.save as { career: { highestStage: number } } | null
  assert.ok(save, 'the finished campaign still returns a save')
  assert.equal(save.career.highestStage, 30)
  const feats = game.drainFeats() as string[]
  for (let chapter = 1; chapter <= 6; chapter++)
    assert.ok(
      feats.includes(`chapter-${chapter}`),
      `route ${route}: chapter ${chapter} trophy earned`,
    )
  assert.ok(feats.includes('true-spectrum'))
  const stars = career.stars.reduce((sum, n) => sum + n, 0)
  console.log(
    `route ${route.join('')}: ${game.ending} in ${shots} shots (${bossShots} at bosses), ` +
      `${lostLives} lives lost, ${stars}/90 stars, score ${game.score}, ${Date.now() - started}ms`,
  )
}
assert.equal(endings.size, 3, 'the three routes reach all three endings')

// Adversarial play: a careless player mashes random aims, swaps and buttons (fire during choices,
// swaps at bosses, held directions) across many runs. No shot may hang, the career may only grow,
// a game over must keep the career in the save, and the next visit resumes at the furthest stage.
{
  const chaos = seeded(4242)
  let career = readSpectrumSave(null)
  let games = 0
  let furthest = 1
  let totalShots = 0
  while (games < 12) {
    const game = create({
      ...options(games + 1),
      resume: career,
    } as Parameters<typeof create>[0]) as Game
    assert.equal(
      game.menuStage,
      furthest,
      'a new visit opens on the furthest unlocked stage',
    )
    game.update(press('a'))
    let before = game.career as { highestStage: number; xp: number }
    let shotsThisRun = 0
    while (!game.over && shotsThisRun < 160) {
      const roll = chaos()
      const input = emptyInput()
      if (roll < 0.15) input.pressed.b = true
      if (roll > 0.9) input.pressed.x = true
      if (chaos() < 0.3) input.held.left = true
      else {
        const rightRoll = chaos()
        if (rightRoll < 0.3) input.held.right = true
      }
      game.update(input)
      if (game.pendingChoice !== null) {
        game.choiceCursor = chaos() < 0.5 ? 0 : 1
        game.update(press('a'))
        continue
      }
      // A careless player, but one who does win some boards: every fourth shot is the bot's best.
      const angle =
        shotsThisRun % 4 === 3
          ? bestAngle(game, false).angle
          : ANGLES[Math.floor(chaos() * ANGLES.length)]!
      shoot(game, angle)
      shotsThisRun++
      totalShots++
      const now = game.career as { highestStage: number; xp: number }
      assert.ok(now.highestStage >= before.highestStage, 'stages never relock')
      assert.ok(now.xp >= before.xp, 'Color XP never drops')
      before = now
      const save = game.save as { career: { highestStage: number } } | null
      assert.ok(save, 'the save is never null mid-run')
    }
    const save = game.save as ReturnType<typeof readSpectrumSave>
    assert.ok(save, 'game over keeps a save')
    assert.equal(save.career.highestStage, before.highestStage)
    furthest = save.career.highestStage
    career = readSpectrumSave(JSON.parse(JSON.stringify(save)))
    games++
  }
  assert.ok(furthest > 1, 'careless play still progresses over many visits')
  console.log(
    `adversarial: ${games} visits, ${totalShots} careless shots, reached stage ${furthest}, no hang or regression`,
  )
}
console.log(
  'Superkate Spectrum: full 30-stage campaign played to all three endings',
)
