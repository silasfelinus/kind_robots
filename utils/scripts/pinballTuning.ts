// /utils/scripts/pinballTuning.ts
//
// Kind Pinball's tuning harness (conductor kind-pinball/t-013): headless bot
// sessions at several skill levels on the real physics and rules, and the
// numbers a fun-and-balance pass needs: ball time, drain causes, the shots
// made, how often each feature is reached, and the score spread. Also prints
// the aiming chart (what each flipper can make from a cradle, and from the
// inlane), which is the table's shot-geometry evidence.
//
//   npx tsx utils/scripts/pinballTuning.ts [--games 10] [--skills novice,average,good]
//                                          [--seed 1] [--minutes 20] [--json out.json]
//
// Seeded: the same flags give the same numbers. Rerun after every rules or
// geometry change and check the summary into conductor's
// projects/kind-pinball/TUNING.md.

import { writeFileSync } from 'node:fs'
import RAPIER from '@dimforge/rapier3d-compat'
import { mulberry32 } from '../arcade/curve'
import { PHYSICS_HZ } from '../arcade/pinball/clock'
import type { PinballPhysics } from '../arcade/pinball/physics/world'
import type { PinballRulesState } from '../arcade/pinball/rules/engine'
import { PinballRuntime } from '../arcade/pinball/runtime'
import { AMI_VILLAGE_GREYBOX } from '../arcade/pinball/tables/amiVillage/table'
import { measureAimChart, type AimChart } from '../arcade/pinball/tuning/aim'
import {
  BOT_SKILLS,
  PinballBot,
  type BotSkill,
} from '../arcade/pinball/tuning/bot'
import type { RendererLike } from '../arcade/pinball/render/scene'
import type { SwitchEvent } from '../arcade/pinball/types'

const TICKS_PER_SECOND = 60

export type DrainCause = 'outlane' | 'sdtm' | 'center'

/** One game's numbers. */
export type GameReport = {
  score: number
  seconds: number
  /** Seconds per ball number (an extra ball lengthens its ball). */
  ballSeconds: number[]
  drains: Record<DrainCause, number>
  shots: Record<string, number>
  reached: {
    mode: boolean
    multiball: boolean
    subTable: boolean
    wizard: boolean
    extraBall: boolean
  }
  villages: number
  capped: boolean
  aimed: number
  aimedHits: number
}

function headless(): RendererLike {
  return {
    render() {},
    setSize() {},
    setPixelRatio() {},
    dispose() {},
  } as unknown as RendererLike
}

/** Play one seeded game with `skill`; stop at game over or `minutes`. */
export function playGame(
  skill: BotSkill,
  seed: number,
  chart: AimChart | null,
  minutes = 20,
): GameReport {
  const table = AMI_VILLAGE_GREYBOX
  const runtime = new PinballRuntime(
    {
      rng: mulberry32(seed),
      sound: { play: () => {} },
      demo: false,
      hiScore: 0,
    },
    RAPIER,
    table,
    headless,
  )
  const inner = runtime as unknown as {
    physics: PinballPhysics
    rules: PinballRulesState
  }
  const bot = new PinballBot(skill, mulberry32(seed * 7919 + 1), chart)

  // Watch the physics for drains and flipper touches.
  const physics = inner.physics
  const step = physics.step.bind(physics)
  const lastLow = new Map<number, number>()
  const lastFlipper = new Map<number, number>()
  const drains: Record<DrainCause, number> = { outlane: 0, sdtm: 0, center: 0 }
  let tick = 0
  physics.step = () => {
    const events: SwitchEvent[] = step()
    for (const e of events) {
      if (e.type === 'contact' && e.id.startsWith('flipper'))
        lastFlipper.set(e.ballId, tick)
      if (e.type === 'drain') {
        const x = lastLow.get(e.ballId) ?? 0
        const flipped = tick - (lastFlipper.get(e.ballId) ?? -1e9) < 45
        drains[Math.abs(x) > 0.16 ? 'outlane' : flipped ? 'center' : 'sdtm']++
      }
    }
    return events
  }

  const reached = {
    mode: false,
    multiball: false,
    subTable: false,
    wizard: false,
    extraBall: false,
  }
  const ballSeconds: number[] = []
  let ballStart = 0
  let ballNumber = 1
  let shotsBefore: Record<string, number> = {}
  const cap = minutes * 60 * TICKS_PER_SECOND
  while (!runtime.over && tick < cap) {
    tick++
    const balls = physics.ballViews()
    for (const ball of balls)
      if (ball.position[2] > -0.02) lastLow.set(ball.id, ball.position[0])
    runtime.update(
      bot.frame({
        balls,
        rules: inner.rules,
        ballOnPlunger: physics.ballOnPlunger(),
        flippers: physics.table.flippers,
      }),
    )
    const rules = inner.rules
    for (const [shot, made] of Object.entries(rules.shotsMade))
      if (made > (shotsBefore[shot] ?? 0)) bot.shotMade(shot)
    shotsBefore = rules.shotsMade
    const play = rules.play
    reached.mode ||= !!play.villages.mode
    reached.multiball ||= play.multiball.running
    reached.subTable ||= rules.sub.found > 0
    reached.wizard ||= play.wizard.running
    reached.extraBall ||= play.extraBalls > 0
    if (rules.ball !== ballNumber || rules.over) {
      ballSeconds.push((tick - ballStart) / TICKS_PER_SECOND)
      ballStart = tick
      ballNumber = rules.ball
    }
  }
  const rules = inner.rules
  const report: GameReport = {
    score: rules.score,
    seconds: tick / TICKS_PER_SECOND,
    ballSeconds,
    drains,
    shots: { ...rules.shotsMade },
    reached,
    villages: rules.play.villages.visited.length,
    capped: !rules.over,
    aimed: bot.aimed,
    aimedHits: bot.aimedHits,
  }
  runtime.dispose()
  return report
}

export type SkillSummary = {
  skill: string
  games: number
  score: { mean: number; p10: number; median: number; p90: number }
  ballSeconds: number
  drains: Record<DrainCause, number>
  shotsPerMinute: Record<string, number>
  reached: Record<keyof GameReport['reached'], number>
  villages: number
  capped: number
  aimAccuracy: number | null
}

function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return 0
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]!
}

export function summarize(skill: string, games: GameReport[]): SkillSummary {
  const scores = games.map((g) => g.score).sort((a, b) => a - b)
  const balls = games.flatMap((g) => g.ballSeconds)
  const minutes = games.reduce((a, g) => a + g.seconds, 0) / 60
  const drains = { outlane: 0, sdtm: 0, center: 0 }
  const shots: Record<string, number> = {}
  for (const g of games) {
    for (const k of Object.keys(drains) as DrainCause[])
      drains[k] += g.drains[k]
    for (const [s, n] of Object.entries(g.shots)) shots[s] = (shots[s] ?? 0) + n
  }
  const total = drains.outlane + drains.sdtm + drains.center || 1
  const share = (n: number) => Math.round((n / games.length) * 100)
  const aimed = games.reduce((a, g) => a + g.aimed, 0)
  return {
    skill,
    games: games.length,
    score: {
      mean: Math.round(scores.reduce((a, s) => a + s, 0) / (games.length || 1)),
      p10: quantile(scores, 0.1),
      median: quantile(scores, 0.5),
      p90: quantile(scores, 0.9),
    },
    ballSeconds:
      Math.round(
        (balls.reduce((a, s) => a + s, 0) / (balls.length || 1)) * 10,
      ) / 10,
    drains: {
      outlane: Math.round((drains.outlane / total) * 100),
      sdtm: Math.round((drains.sdtm / total) * 100),
      center: Math.round((drains.center / total) * 100),
    },
    shotsPerMinute: Object.fromEntries(
      Object.entries(shots)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([s, n]) => [s, Math.round((n / (minutes || 1)) * 100) / 100]),
    ),
    reached: {
      mode: share(games.filter((g) => g.reached.mode).length),
      multiball: share(games.filter((g) => g.reached.multiball).length),
      subTable: share(games.filter((g) => g.reached.subTable).length),
      wizard: share(games.filter((g) => g.reached.wizard).length),
      extraBall: share(games.filter((g) => g.reached.extraBall).length),
    },
    villages:
      Math.round(
        (games.reduce((a, g) => a + g.villages, 0) / (games.length || 1)) * 10,
      ) / 10,
    capped: games.filter((g) => g.capped).length,
    aimAccuracy: aimed
      ? Math.round((games.reduce((a, g) => a + g.aimedHits, 0) / aimed) * 100)
      : null,
  }
}

/** The chart as text: each flipper's makeable shots and their windows. */
export function chartLines(name: string, chart: AimChart): string[] {
  return (['left', 'right'] as const).map((side) => {
    const windows: Record<string, number> = {}
    for (const shot of chart[side])
      if (shot) windows[shot] = (windows[shot] ?? 0) + 1
    const list = Object.entries(windows)
      .sort((a, b) => b[1] - a[1])
      .map(([s, n]) => `${s} ${n}`)
    return `| ${name} | ${side} | ${list.join(', ') || 'none'} |`
  })
}

export function markdown(
  summaries: SkillSummary[],
  charts: { cradle: AimChart; inlane: AimChart },
): string {
  const lines: string[] = []
  lines.push(
    '| Skill | Games | Ball time (s) | Score median (p10–p90) | Mode | Multiball | Sub-table | Wizard | Extra ball | Villages | Drains outlane/SDTM/center | Aim |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|',
  )
  for (const s of summaries)
    lines.push(
      `| ${s.skill} | ${s.games} | ${s.ballSeconds} | ${s.score.median.toLocaleString('en-US')} (${s.score.p10.toLocaleString('en-US')}–${s.score.p90.toLocaleString('en-US')}) | ${s.reached.mode}% | ${s.reached.multiball}% | ${s.reached.subTable}% | ${s.reached.wizard}% | ${s.reached.extraBall}% | ${s.villages} | ${s.drains.outlane}/${s.drains.sdtm}/${s.drains.center}% | ${s.aimAccuracy === null ? '–' : `${s.aimAccuracy}%`} |`,
    )
  lines.push('', '| Skill | Shots made per minute |', '|---|---|')
  for (const s of summaries)
    lines.push(
      `| ${s.skill} | ${
        Object.entries(s.shotsPerMinute)
          .map(([shot, n]) => `${shot} ${n}`)
          .join(', ') || 'none'
      } |`,
    )
  lines.push(
    '',
    `| Feed | Flipper | Shots it can make (timing windows, of ${charts.cradle.left.length} ticks) |`,
    '|---|---|---|',
    ...chartLines('cradle', charts.cradle),
    ...chartLines('inlane', charts.inlane),
  )
  return lines.join('\n')
}

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback
}

async function main() {
  await RAPIER.init()
  const games = Number(arg('games', '10'))
  const seed = Number(arg('seed', '1'))
  const minutes = Number(arg('minutes', '20'))
  const skills = arg('skills', 'novice,average,good').split(',')
  const charts = {
    cradle: measureAimChart(RAPIER, AMI_VILLAGE_GREYBOX, 'cradle'),
    inlane: measureAimChart(RAPIER, AMI_VILLAGE_GREYBOX, 'inlane'),
  }
  const summaries: SkillSummary[] = []
  const raw: Record<string, GameReport[]> = {}
  for (const name of skills) {
    const skill = BOT_SKILLS[name as keyof typeof BOT_SKILLS]
    if (!skill) throw new Error(`unknown skill ${name}`)
    raw[name] = []
    for (let g = 0; g < games; g++) {
      const report = playGame(skill, seed + g, charts.cradle, minutes)
      raw[name]!.push(report)
      process.stderr.write(
        `${name} #${g + 1}: ${report.score.toLocaleString('en-US')} in ${Math.round(report.seconds)} s\n`,
      )
    }
    summaries.push(summarize(name, raw[name]!))
  }
  console.log(markdown(summaries, charts))
  const json = arg('json', '')
  if (json)
    writeFileSync(
      json,
      JSON.stringify(
        { physicsHz: PHYSICS_HZ, summaries, charts, raw },
        null,
        2,
      ),
    )
}

if (process.argv[1]?.endsWith('pinballTuning.ts')) await main()
