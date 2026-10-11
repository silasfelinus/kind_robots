// /utils/zuzuLair/engine.ts
//
// Zuzu's Lair (conductor zuzu-lair): the pure QTE engine. A run is a value; `lairReducer`
// maps (run, action) to the next run and never mutates. Framework-free, no DOM, no clock:
// the player page feeds it `tick` with the video's elapsed seconds and `press` with input.
//
// Rules (DESIGN-BRIEF.md "How it plays"):
//   - the right button inside a moment's window -> its success clip, then `next`;
//   - a wrong button, or no press before the window closes -> the death clip, a life is lost,
//     then the moment replays; out of lives -> game over, with a continue at a score penalty;
//   - Assist widens every window by `assistExtra`, ignores early presses and has unlimited lives;
//     Classic counts an early press as wrong.

import type {
  LairAction,
  LairButton,
  LairChapter,
  LairDifficulty,
  LairNode,
  LairRun,
} from './types'

export const POINTS_BASE = 100
export const POINTS_SPEED = 400
export const NO_DEATH_BONUS = 1000
export const TIME_BONUS_MAX = 2000
export const TIME_BONUS_PER_SECOND = 20
/** Share of the score kept when continuing after a game over. */
export const CONTINUE_KEEP = 0.5

export function nodeById(chapter: LairChapter, id: string): LairNode {
  const node = chapter.nodes.find((n) => n.id === id)
  if (!node) throw new Error(`zuzuLair: unknown node "${id}" in ${chapter.id}`)
  return node
}

/** The moment's input window for this difficulty, [open, close] seconds into the clip. */
export function windowFor(
  chapter: LairChapter,
  node: LairNode,
  difficulty: LairDifficulty,
): [number, number] {
  if (!node.window) throw new Error(`zuzuLair: "${node.id}" is not a moment`)
  const extra = difficulty === 'assist' ? chapter.assistExtra : 0
  return [node.window[0], node.window[1] + extra]
}

export function startRun(
  chapter: LairChapter,
  difficulty: LairDifficulty,
): LairRun {
  const first = chapter.nodes[0]
  if (!first) throw new Error(`zuzuLair: ${chapter.id} has no nodes`)
  return {
    chapter,
    difficulty,
    phase: 'playing',
    node: first.id,
    t: 0,
    lives: chapter.lives,
    score: 0,
    deaths: 0,
    continues: 0,
    elapsed: 0,
    lastMoment: first.id,
    bonus: null,
  }
}

function enter(run: LairRun, id: string): LairRun {
  const node = nodeById(run.chapter, id)
  return {
    ...run,
    node: id,
    t: 0,
    lastMoment: node.kind === 'moment' ? id : run.lastMoment,
  }
}

function die(run: LairRun, moment: LairNode): LairRun {
  const next = enter(run, moment.death as string)
  return {
    ...next,
    deaths: run.deaths + 1,
    lives: run.difficulty === 'assist' ? run.lives : Math.max(0, run.lives - 1),
    // the moment stays the continue point even though we are now in its death clip
    lastMoment: moment.id,
  }
}

function succeed(run: LairRun, moment: LairNode, at: number): LairRun {
  const [open, close] = windowFor(run.chapter, moment, run.difficulty)
  const span = Math.max(close - open, 1e-6)
  const earliness = Math.min(1, Math.max(0, 1 - (at - open) / span))
  const points = POINTS_BASE + Math.round(POINTS_SPEED * earliness)
  return { ...enter(run, moment.success as string), score: run.score + points }
}

function finish(run: LairRun): LairRun {
  const noDeath = run.deaths === 0 ? NO_DEATH_BONUS : 0
  const time = Math.max(
    0,
    TIME_BONUS_MAX - Math.floor(run.elapsed) * TIME_BONUS_PER_SECOND,
  )
  return {
    ...run,
    phase: 'complete',
    score: run.score + noDeath + time,
    bonus: { noDeath, time },
  }
}

function press(run: LairRun, button: LairButton): LairRun {
  const node = nodeById(run.chapter, run.node)
  if (run.phase !== 'playing' || node.kind !== 'moment') return run
  const [open, close] = windowFor(run.chapter, node, run.difficulty)
  if (run.t < open) return run.difficulty === 'assist' ? run : die(run, node)
  if (run.t > close) return die(run, node)
  return button === node.expect ? succeed(run, node, run.t) : die(run, node)
}

function advance(run: LairRun, dt: number): LairRun {
  if (run.phase !== 'playing' || dt <= 0) return run
  let cur = run
  let left = dt
  // a large dt can cross several clip boundaries; walk them one at a time
  for (
    let guard = 0;
    left > 1e-9 && guard < 64 && cur.phase === 'playing';
    guard++
  ) {
    const node = nodeById(cur.chapter, cur.node)
    let step = Math.min(left, node.seconds - cur.t)
    if (node.kind === 'moment') {
      const [, close] = windowFor(cur.chapter, node, cur.difficulty)
      // the window is inclusive: a run sitting exactly at the close is still alive, and only
      // time passing beyond it is a miss. Stop at the close so the miss lands there.
      if (cur.t >= close - 1e-9) {
        cur = die(cur, node)
        continue
      }
      step = Math.min(step, close - cur.t)
    }
    cur = { ...cur, t: cur.t + step, elapsed: cur.elapsed + step }
    left -= step
    if (node.kind === 'moment') continue
    if (cur.t < node.seconds - 1e-9) continue
    if (node.kind === 'closing') return finish(cur)
    if (node.kind === 'death') {
      cur =
        cur.lives === 0
          ? { ...cur, phase: 'gameover' }
          : enter(cur, node.retry as string)
    } else {
      cur = enter(cur, node.next as string)
    }
  }
  return cur
}

function resume(run: LairRun): LairRun {
  if (run.phase !== 'gameover') return run
  return {
    ...enter({ ...run, phase: 'playing' }, run.lastMoment),
    lives: run.chapter.lives,
    score: Math.floor(run.score * CONTINUE_KEEP),
    continues: run.continues + 1,
  }
}

export function lairReducer(run: LairRun, action: LairAction): LairRun {
  switch (action.type) {
    case 'tick':
      return advance(run, action.dt)
    case 'press':
      return press(run, action.button)
    case 'continue':
      return resume(run)
  }
}

/** Graph checks: every edge resolves, nothing is orphaned, windows sit inside the clip. */
export function validateChapter(chapter: LairChapter): string[] {
  const errors: string[] = []
  const ids = new Set(chapter.nodes.map((n) => n.id))
  if (ids.size !== chapter.nodes.length) errors.push('duplicate node ids')
  const reached = new Set<string>()
  const edge = (from: string, to: string | undefined, field: string) => {
    if (!to) return errors.push(`${from}: missing ${field}`)
    if (!ids.has(to))
      return errors.push(`${from}: ${field} -> unknown node "${to}"`)
    reached.add(to)
  }
  chapter.nodes.forEach((n, i) => {
    if (n.seconds < 2 || n.seconds > 5)
      errors.push(`${n.id}: seconds ${n.seconds} outside 2-5`)
    if (i === 0 && n.kind !== 'opening')
      errors.push(`${n.id}: first node must be the opening`)
    if (n.kind === 'opening' || n.kind === 'success') edge(n.id, n.next, 'next')
    if (n.kind === 'death') edge(n.id, n.retry, 'retry')
    if (n.kind === 'moment') {
      edge(n.id, n.success, 'success')
      edge(n.id, n.death, 'death')
      if (!n.expect) errors.push(`${n.id}: moment needs expect`)
      if (!n.window) errors.push(`${n.id}: moment needs window`)
      else {
        const [a, b] = n.window
        if (a < 0 || b <= a) errors.push(`${n.id}: bad window [${a}, ${b}]`)
        if (b + chapter.assistExtra > n.seconds)
          errors.push(`${n.id}: Assist window runs past the clip`)
      }
    }
  })
  chapter.nodes.slice(1).forEach((n) => {
    if (!reached.has(n.id)) errors.push(`${n.id}: orphan node`)
  })
  if (chapter.nodes.filter((n) => n.kind === 'closing').length !== 1) {
    errors.push('exactly one closing node required')
  }
  return errors
}
