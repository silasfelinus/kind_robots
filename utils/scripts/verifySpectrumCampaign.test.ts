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

// The bot reads and copies the game's private run state, so it sees the instance as a plain record.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Game = Record<string, any>
type Snapshot = {
  level: number
  lives: number
  over: boolean
  won: boolean
  bubbles: number
  bossHits: number
  bossMisses: number
  score: number
  result: unknown
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
    result: game.atelierResult,
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
  twin.earned = new Set(game.earned as Set<string>)
  twin.storyChoices = [...(game.storyChoices as unknown[])]
  twin.storyEndings = [...(game.storyEndings as unknown[])]
  twin.powerTipsShown = new Set(game.powerTipsShown as Set<string>)
  twin.relayUsed = [...(game.relayUsed as number[])]
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
  if (after.won || (after.result === 'cleared' && !before.result)) return 1e9
  if (after.result === 'retry') return -1e8
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
  const game = create(
    options(route.join('').length * 977 + 31),
  ) as unknown as Game
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
    } as Parameters<typeof create>[0]) as unknown as Game
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
      const lean = chaos()
      if (lean < 0.3) input.held.left = true
      else if (lean < 0.55) input.held.right = true
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

// Co-op Relay (t-183): two players alternate their own orbs through all six relay boards and the
// duet boss, through the real update loop. Every board must fall with the orbs it gives.
{
  const game = create({
    ...options(77),
    resume: readSpectrumSave({
      ...readSpectrumSave(null),
      mode: 'classic',
    }),
  } as Parameters<typeof create>[0]) as unknown as Game
  const left = emptyInput()
  left.pressed.left = true
  game.update(left)
  assert.equal(game.relayActive, true, 'relay starts from the Classic menu')
  let rounds = 0
  let shots = 0
  let bossShots = 0
  let gifts = 0
  const turns: number[] = []
  while (game.relayActive) {
    if (game.atelierResult) {
      assert.equal(
        game.atelierResult,
        'cleared',
        `relay round ${(game.atelierIndex as number) + 1} (${game.puzzleTitle}) is solvable with its orbs`,
      )
      rounds++
      game.update(press('a'))
      continue
    }
    turns.push(game.relayTurn as number)
    if (game.power === 'prism') gifts++
    shoot(game, bestAngle(game, false).angle)
    shots++
    if (game.relayFinale || game.boss) bossShots++
    assert.ok(shots < 200, 'the relay finishes')
  }
  const career = game.career as { relayRounds: number; relayBest: number }
  assert.equal(rounds, 6, 'all six relay rounds (the last with its boss)')
  assert.equal(career.relayRounds, 6)
  assert.ok(career.relayBest >= game.score - 1, 'the best relay score is kept')
  assert.ok(
    turns.some((turn, i) => i > 0 && turn !== turns[i - 1]),
    'turns alternate',
  )
  assert.ok(bossShots > 0, 'the duet boss was fought')
  assert.equal(game.choosingMode, true, 'the relay finishes back at the menu')
  console.log(
    `relay: 6 rounds + duet boss in ${shots} shots (${bossShots} at the boss, ${gifts} gifted prisms), best ${career.relayBest}`,
  )
}

// Puzzle Atelier (t-183): every puzzle, introductory and advanced, falls to its own fixed orbs
// through the real update loop, and none touches the career.
{
  const { ATELIER_PUZZLES } = await import('../arcade/games/superkateSpectrum')
  assert.equal(ATELIER_PUZZLES.length, 12)
  let total = 0
  for (let index = 0; index < ATELIER_PUZZLES.length; index++) {
    const game = create({
      ...options(index + 5),
      resume: readSpectrumSave({ ...readSpectrumSave(null), mode: 'classic' }),
    } as Parameters<typeof create>[0]) as unknown as Game
    const right = emptyInput()
    right.pressed.right = true
    game.update(right)
    assert.equal(game.atelierMenu, true, 'the Atelier opens from Classic')
    for (let i = 0; i < index; i++) game.update(right)
    const career = JSON.stringify(game.career)
    game.update(press('a'))
    assert.equal(game.atelierActive, true)
    assert.equal(game.atelierIndex, index)
    let shots = 0
    while (!game.atelierResult) {
      shoot(game, bestAngle(game, false).angle)
      shots++
    }
    assert.equal(
      game.atelierResult,
      'cleared',
      `Atelier ${index + 1} (${ATELIER_PUZZLES[index]!.title}) is solvable with its orbs`,
    )
    assert.ok(shots <= ATELIER_PUZZLES[index]!.shots.length)
    assert.equal(JSON.stringify(game.career), career, 'Atelier is unranked')
    total += shots
  }
  console.log(`atelier: all 12 puzzles solved in ${total} shots`)
}
