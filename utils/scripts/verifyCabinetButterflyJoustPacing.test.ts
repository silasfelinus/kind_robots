// /utils/scripts/verifyCabinetButterflyJoustPacing.test.ts
//
// Butterfly Joust pacing measurement (conductor kr-arcade/t-146): limited-life survival and
// first-clear time against the authored Four Gardens Tourney target (a first clear in roughly 45-60
// minutes, depth-pass CABINETS.md section 4). The game runs on its own rules, unchanged: three
// butterflies, an extra every 20,000, the save at each arena start and its Continue. The player is
// the game's own attract pilot (demoInput), driving the real menu and Wing Garden, over a spread of
// seeds. Time is counted in fixed 60 Hz ticks, never scaled.
//
// What is measured (printed, BOT ESTIMATES ONLY):
//   1. One credit: time to the first lost butterfly, time to game over, furthest wave, and how
//      butterflies were lost, in the Tourney and (as the baseline) Classic Pond's original rules.
//   2. Credits until a clear: game over -> the stored save (withSave/sanitizeSaves) -> Continue, as
//      a player at home would, until the ending or a 2-hour cap.
//   3. Content traversal: the same pilot with its lives topped up (the convention of the existing
//      pilot probes), so every wave, bout and garden is played once: time to the ending, per arena.
//
// None of this is human evidence. The pilot loses dozens of butterflies a clear and is a much
// weaker jouster than a practised human, so it cannot show the 45-60 minute target is met or
// missed for people; only human playtests can. The assertions below pin only what the bot can
// establish: runs end, the rules are not topped up in the limited sections, the tourney is
// completable, and scores stay under the registry ceiling.
//
//   npx tsx utils/scripts/verifyCabinetButterflyJoustPacing.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { ARCADE_GAMES } from '../arcade/games'
import { create } from '../arcade/games/butterflyJoust'
import { ARENAS } from '../arcade/butterflyJoust/arenas'
import { sanitizeSaves, withSave } from '../arcade/saves'
import type { InputFrame } from '../arcade/types'

const SLUG = 'butterfly-joust'
const TICKS_PER_MIN = 60 * 60
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const CONTINUE_SEEDS = SEEDS.slice(0, 6)
/** A single credit never lasts this long (it ends in minutes). */
const CREDIT_CAP = 30 * TICKS_PER_MIN
/** Credits until a clear: stop counting here. */
const CLEAR_CAP = 120 * TICKS_PER_MIN
/** Content traversal with lives topped up. */
const TRAVERSE_CAP = 90 * TICKS_PER_MIN

type Rider = { alive: boolean; held: boolean; seat: number }
type Game = {
  over: boolean
  mode: string
  score: number
  lives: number
  level: number
  wave: number
  arena: { id: string }
  menu: { pick: number } | null
  ending: unknown
  champion: unknown
  storm: unknown
  save: unknown
  update(input: InputFrame): void
  demoInput(): InputFrame
  loseLife(p: Rider, splashed?: boolean): void
}

type Credit = {
  ticks: number
  firstDeath: number | null
  deaths: string[]
  reached: string
  waves: number
  cleared: boolean
  score: number
  save: unknown
}

const meta = ARCADE_GAMES.find((g) => g.slug === SLUG)!

function makeGame(seed: number, resume?: unknown): Game {
  return create({
    rng: mulberry32(seed),
    sound: { play: () => {} },
    demo: false,
    hiScore: 0,
    resume,
    selectScreen: true,
  }) as unknown as Game
}

/**
 * Play one credit with the pilot. `menuRow` points the real mode card's cursor (0 is Continue when
 * a save is offered, else Tourney); `topUp` keeps three butterflies, for content traversal only.
 */
function playCredit(
  seed: number,
  {
    menuRow = 0,
    resume,
    cap,
    topUp = false,
  }: { menuRow?: number; resume?: unknown; cap: number; topUp?: boolean },
): Credit {
  const g = makeGame(seed, resume)
  assert.ok(g.menu, 'a real game opens on the mode card')
  g.menu.pick = menuRow
  const deaths: string[] = []
  let t = 0
  let firstDeath: number | null = null
  // Record each lost butterfly as the game loses it (the game's own call, observed, not altered).
  const lose = g.loseLife.bind(g)
  g.loseLife = (p: Rider, splashed = false) => {
    if (p.alive) {
      if (firstDeath === null) firstDeath = t
      deaths.push(
        splashed
          ? 'pond'
          : g.champion
            ? 'champion'
            : g.storm
              ? 'storm'
              : 'joust',
      )
    }
    lose(p, splashed)
  }
  let waves = 0
  let lastLevel = g.level
  for (; t < cap && !g.over && !g.ending; t++) {
    if (topUp) g.lives = Math.max(g.lives, 3)
    const lives = g.lives
    g.update(g.demoInput())
    if (!topUp)
      assert.ok(
        g.lives <= lives + 1,
        'limited lives: only the game itself adds butterflies',
      )
    if (g.level > lastLevel) waves += g.level - lastLevel
    lastLevel = g.level
  }
  return {
    ticks: t,
    firstDeath,
    deaths,
    reached:
      g.mode === 'classic' ? `wave ${g.level}` : `${g.arena.id}:${g.wave}`,
    waves,
    cleared: Boolean(g.ending),
    score: g.score,
    save: g.save,
  }
}

const minutes = (ticks: number) => ticks / TICKS_PER_MIN
function stats(values: number[]) {
  const s = [...values].sort((a, b) => a - b)
  const at = (q: number) => s[Math.min(s.length - 1, Math.floor(q * s.length))]!
  return { min: s[0]!, median: at(0.5), p90: at(0.9), max: s.at(-1)! }
}
const fmt = (v: number) => v.toFixed(1)
const line = (label: string, values: number[], unit = 'min') => {
  const { min, median, p90, max } = stats(values)
  return `  ${label.padEnd(34)} min ${fmt(min)}  median ${fmt(median)}  p90 ${fmt(p90)}  max ${fmt(max)} ${unit}`
}
const tally = (all: string[]) =>
  Object.entries(
    all.reduce<Record<string, number>>(
      (n, k) => ((n[k] = (n[k] ?? 0) + 1), n),
      {},
    ),
  )
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} ${v}`)
    .join(', ')

const report: string[] = []

// --- 1. one credit: the Tourney against Classic Pond's original rules --------------------------
const oneCredit: Record<'tourney' | 'classic', Credit[]> = {
  tourney: [],
  classic: [],
}
{
  // The mode card with no save: TOURNEY, ENDLESS POND, CLASSIC POND, MEDAL BOARD.
  for (const [mode, row] of [
    ['tourney', 0],
    ['classic', 2],
  ] as const) {
    for (const seed of SEEDS) {
      const c = playCredit(seed, { menuRow: row, cap: CREDIT_CAP })
      assert.ok(!c.cleared, `${mode} seed ${seed}: one credit, bot skill`)
      assert.ok(
        c.ticks < CREDIT_CAP,
        `${mode} seed ${seed}: a single credit ends`,
      )
      assert.ok(c.firstDeath !== null, `${mode} seed ${seed}: a first loss`)
      assert.ok(c.score <= meta.maxPlausibleScore)
      oneCredit[mode].push(c)
    }
    const runs = oneCredit[mode]
    report.push(`One credit, ${mode} (${runs.length} seeds, 3 butterflies):`)
    report.push(
      line(
        'first butterfly lost after',
        runs.map((c) => minutes(c.firstDeath!)),
      ),
    )
    report.push(
      line(
        'game over after',
        runs.map((c) => minutes(c.ticks)),
      ),
    )
    report.push(
      line(
        'waves begun',
        runs.map((c) => c.waves),
        'waves',
      ),
    )
    report.push(`  furthest: ${runs.map((c) => c.reached).join(' ')}`)
    report.push(`  lost to: ${tally(runs.flatMap((c) => c.deaths))}`)
  }
}

// --- 2. credits until a clear, through the save and Continue ---------------------------------
const toClear: Array<{
  seed: number
  ticks: number
  credits: number
  cleared: boolean
  reached: string
}> = []
{
  for (const seed of CONTINUE_SEEDS) {
    let ticks = 0
    let credits = 0
    let resume: unknown = undefined
    let last: Credit | null = null
    while (ticks < CLEAR_CAP && !last?.cleared) {
      credits++
      last = playCredit(seed * 1000 + credits, {
        resume,
        cap: CLEAR_CAP - ticks,
      })
      ticks += last.ticks
      // Game over keeps the arena-start save; the store keeps it; the next credit continues it.
      resume = sanitizeSaves(
        JSON.parse(JSON.stringify(withSave({}, SLUG, last.save))),
      )[SLUG]
      assert.ok(resume, `seed ${seed}: the save survives the store`)
    }
    toClear.push({
      seed,
      ticks,
      credits,
      cleared: Boolean(last?.cleared),
      reached: last!.reached,
    })
  }
  const done = toClear.filter((r) => r.cleared)
  report.push(
    `Credits until a clear (${toClear.length} seeds, Continue from each arena start, cap ${minutes(CLEAR_CAP)} min):`,
  )
  report.push(
    `  cleared: ${done.length} of ${toClear.length}; ${toClear
      .map(
        (r) =>
          `seed ${r.seed} ${r.cleared ? 'CLEAR' : `stuck at ${r.reached}`} ${fmt(minutes(r.ticks))} min/${r.credits} credits`,
      )
      .join('; ')}`,
  )
}

// --- 3. content traversal: every wave, bout and garden played once ---------------------------
const traverse: Array<{
  ticks: number
  deaths: number
  arenas: Record<string, number>
  lost: Record<string, number>
}> = []
{
  for (const seed of SEEDS) {
    const g = makeGame(seed)
    g.menu!.pick = 0
    const arenas: Record<string, number> = {}
    const lost: Record<string, number> = {}
    let deaths = 0
    let t = 0
    for (; t < TRAVERSE_CAP && !g.over && !g.ending; t++) {
      g.lives = Math.max(g.lives, 3)
      const lives = g.lives
      g.update(g.demoInput())
      if (g.lives < lives) {
        deaths++
        lost[g.arena.id] = (lost[g.arena.id] ?? 0) + 1
      }
      arenas[g.arena.id] = (arenas[g.arena.id] ?? 0) + 1
    }
    assert.ok(g.ending, `seed ${seed}: the tourney can be played to its end`)
    assert.ok(g.score <= meta.maxPlausibleScore, `seed ${seed}: score ceiling`)
    traverse.push({ ticks: t, deaths, arenas, lost })
  }
  const order = [
    ...new Set([
      ...ARENAS.map((a) => a.id),
      ...traverse.flatMap((r) => Object.keys(r.arenas)),
    ]),
  ]
  report.push(
    `Content traversal (${traverse.length} seeds, butterflies topped up; bot pace, not a human clear):`,
  )
  report.push(
    line(
      'start to the ending',
      traverse.map((r) => minutes(r.ticks)),
    ),
  )
  report.push(
    line(
      'butterflies lost on the way',
      traverse.map((r) => r.deaths),
      'lost',
    ),
  )
  for (const id of order) {
    const per = traverse.map((r) => minutes(r.arenas[id] ?? 0))
    if (!per.some((v) => v > 0)) continue
    report.push(line(`  in ${id}`, per))
    report.push(
      line(
        `  lost in ${id}`,
        traverse.map((r) => r.lost[id] ?? 0),
        'lost',
      ),
    )
  }
}

// --- the verdict the bot can and cannot give ---------------------------------------------------
{
  const median = (v: number[]) => stats(v).median
  const tourneyOver = median(oneCredit.tourney.map((c) => minutes(c.ticks)))
  const classicOver = median(oneCredit.classic.map((c) => minutes(c.ticks)))
  const traversal = median(traverse.map((r) => minutes(r.ticks)))
  report.push('Reading (bot estimates, not human evidence):')
  report.push(
    `  one credit lasts ${fmt(tourneyOver)} min in the Tourney vs ${fmt(classicOver)} min under Classic Pond's original rules (median)`,
  )
  report.push(
    `  the content itself takes the pilot ${fmt(traversal)} min (median) against the 45-60 min target; a human first clear adds continues and learning, so the target is neither met nor missed by this evidence`,
  )
  console.log(
    ['Butterfly Joust pacing (t-146), BOT ESTIMATES ONLY:', ...report].join(
      '\n',
    ),
  )
}

console.log('verifyCabinetButterflyJoustPacing: ok')
