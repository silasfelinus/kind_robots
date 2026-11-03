// Slime City CPU opponent (conductor slime-city t-002). It decides from a
// MatchView only, so hidden identities and the other side's traps are out of
// reach by construction. It picks one action at a time: the engine applies it
// and calls back with a fresh view until the CPU passes. Rules here mirror the
// engine's zones only to rank options; the engine still validates every play.
import type {
  Card,
  CpuAction,
  Keyword,
  MatchView,
  Side,
  ViewFighter,
} from './prototypes'

/** What the CPU assumes about a fighter it cannot identify yet. */
const GUESS = { hp: 3, attack: 2, armor: 0 }
const PLAY_THRESHOLD = 2
/** While banking in BLOODRUSH, only a special at least this urgent goes out. */
const BANKED_SPECIAL = 4

interface Cell {
  x: number
  y: number
}

interface Candidate {
  action: CpuAction
  value: number
}

function mix(...parts: number[]): number {
  let h = 0x9e3779b1
  for (const part of parts) {
    h = Math.imul(h ^ (part >>> 0), 0x85ebca6b)
    h ^= h >>> 13
  }
  return (h >>> 0) / 4294967296
}

function other(side: Side): Side {
  return side === 'player' ? 'enemy' : 'player'
}

function dist(a: Cell, b: Cell): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

function cellsAround(view: MatchView, c: Cell): Cell[] {
  return [
    { x: c.x + 1, y: c.y },
    { x: c.x - 1, y: c.y },
    { x: c.x, y: c.y + 1 },
    { x: c.x, y: c.y - 1 },
  ].filter((n) => n.x >= 0 && n.y >= 0 && n.x < view.width && n.y < view.height)
}

function occupant(view: MatchView, x: number, y: number) {
  return view.units.find((u) => u.x === x && u.y === y)
}

/** A fighter or the neutral monster stands here. */
function blocked(view: MatchView, x: number, y: number): boolean {
  return (
    !!occupant(view, x, y) ||
    (!!view.monster && view.monster.x === x && view.monster.y === y)
  )
}

/** The legacy hidden-army Blackout fixture, the only format with manual moves. */
function flagRun(view: MatchView): boolean {
  return view.mode === 'blackout' && !view.auto
}

function deployZone(view: MatchView, side: Side, x: number): boolean {
  if (view.mode !== 'gridiron')
    return side === 'player' ? x <= 1 : x >= view.width - 2
  return side === 'player' ? x === 0 : x === view.width - 1
}

function trapZone(view: MatchView, x: number): boolean {
  if (view.mode !== 'gridiron') return !deployZone(view, other(view.side), x)
  return x > 0 && x < view.width - 1
}

function flagHome(view: MatchView, side: Side, x: number): boolean {
  return side === 'player' ? x === 0 : x === view.width - 1
}

function hpOf(u: ViewFighter): number {
  return u.hp ?? GUESS.hp
}

/** What each keyword is worth to the CPU, in stat points. */
const KEYWORD_WORTH: Record<Keyword, number> = {
  ambush: 1.5,
  regen: 1.5,
  swarm: 1,
  leech: 1,
  bulldoze: 1,
  volatile: 0.5,
  pierce: 1,
  snare: 1,
  collect: 1,
}

function keywordWorth(keywords: Keyword[] | null | undefined): number {
  return (keywords ?? []).reduce((sum, k) => sum + KEYWORD_WORTH[k], 0)
}

function worthCard(card: Card): number {
  return (
    (card.hp || 0) +
    2 * (card.attack || 0) +
    2 * (card.armor || 0) +
    0.5 * (card.ap || 0) +
    keywordWorth(card.keywords)
  )
}

function worthUnit(u: ViewFighter): number {
  return (
    hpOf(u) +
    2 * (u.attack ?? GUESS.attack) +
    2 * (u.armor ?? GUESS.armor) +
    keywordWorth(u.keywords)
  )
}

function power(card: Card): number {
  return card.power ?? 2
}

function isEngaged(view: MatchView, u: ViewFighter): boolean {
  return view.units.some((o) => o.side !== u.side && dist(o, u) === 1)
}

function laneBlocked(view: MatchView, u: ViewFighter): boolean {
  const ahead = occupant(view, u.x + (view.side === 'player' ? 1 : -1), u.y)
  return !!ahead && ahead.side !== view.side
}

function key(action: CpuAction): string {
  return action.t === 'deploy'
    ? 'd:' + action.card + ':' + action.x + ':' + action.y
    : action.t === 'stance'
      ? 's:' + action.id + ':' + action.stance
      : 'm:' + action.id + ':' + action.x + ':' + action.y
}

/** Breadth-first first step toward any goal square over empty squares. */
function firstStep(
  view: MatchView,
  from: ViewFighter,
  goals: Cell[],
): { step: Cell; length: number } | null {
  const goalKeys = new Set(goals.map((g) => g.x + ':' + g.y))
  if (goalKeys.has(from.x + ':' + from.y)) return null
  const seen = new Set([from.x + ':' + from.y])
  let frontier: { cell: Cell; first: Cell }[] = []
  for (const n of cellsAround(view, from)) {
    if (blocked(view, n.x, n.y)) continue
    seen.add(n.x + ':' + n.y)
    frontier.push({ cell: n, first: n })
  }
  for (let length = 1; frontier.length; length++) {
    const hit = frontier.find((f) => goalKeys.has(f.cell.x + ':' + f.cell.y))
    if (hit) return { step: hit.first, length }
    const next: typeof frontier = []
    for (const f of frontier)
      for (const n of cellsAround(view, f.cell)) {
        const k = n.x + ':' + n.y
        if (seen.has(k) || blocked(view, n.x, n.y)) continue
        seen.add(k)
        next.push({ cell: n, first: f.first })
      }
    frontier = next
  }
  // No open path: take any empty square that closes the distance.
  const nearest = (c: Cell) => Math.min(...goals.map((g) => dist(c, g)))
  const here = nearest(from)
  const step = cellsAround(view, from)
    .filter((n) => !blocked(view, n.x, n.y) && nearest(n) < here)
    .sort((a, b) => nearest(a) - nearest(b))[0]
  return step ? { step, length: here } : null
}

/** How urgently an opposing fighter must be answered. */
function threat(view: MatchView, foe: ViewFighter): number {
  if (view.auto && foe.carryingFlag) return 8
  if (flagRun(view)) {
    if (foe.carryingFlag) return 6
    return Math.max(0, 3 - dist(foe, view.flag))
  }
  const ownEnd = view.side === 'player' ? 0 : view.width - 1
  return Math.max(0, 7 - Math.abs(foe.x - ownEnd))
}

function progress(view: MatchView, u: ViewFighter): number {
  const goal = view.side === 'player' ? view.width - 1 : 0
  return Math.max(0, 7 - Math.abs(u.x - goal))
}

function creatureCell(view: MatchView, foes: ViewFighter[]): Cell | null {
  const open: Cell[] = []
  for (let x = 0; x < view.width; x++)
    for (let y = 0; y < view.height; y++)
      if (
        deployZone(view, view.side, x) &&
        !occupant(view, x, y) &&
        !view.flagHomes.some((f) => f.x === x && f.y === y)
      )
        open.push({ x, y })
  if (!open.length) return null
  const tie = (c: Cell) => mix(view.salt, view.round, c.x, c.y) * 0.01
  let score: (c: Cell) => number
  if (flagRun(view)) {
    const carrier = foes.find((f) => f.carryingFlag)
    const target = carrier || view.flag
    score = (c) => dist(c, target) + tie(c)
  } else {
    const danger = [...foes].sort(
      (a, b) => threat(view, b) - threat(view, a),
    )[0]
    if (danger && threat(view, danger) >= 3)
      score = (c) => Math.abs(c.y - danger.y) * 2 + tie(c)
    else
      score = (c) =>
        foes.filter((f) => f.y === c.y).length * 2 +
        foes.filter((f) => Math.abs(f.y - c.y) === 1).length +
        view.units.filter((u) => u.side === view.side && u.y === c.y).length *
          0.7 -
        (view.monster && view.monster.y === c.y ? 1.5 : 0) +
        tie(c)
  }
  return [...open].sort((a, b) => score(a) - score(b))[0] || null
}

function cardCandidates(view: MatchView): Candidate[] {
  const mine = view.units.filter((u) => u.side === view.side)
  const foes = view.units.filter((u) => u.side !== view.side)
  const out: Candidate[] = []
  const flagFree = !view.units.some((u) => u.carryingFlag)
  const deploy = (card: Card, c: Cell, value: number) =>
    out.push({ action: { t: 'deploy', card: card.id, x: c.x, y: c.y }, value })
  for (const card of view.hand) {
    if (card.cost > view.mana) continue
    if (card.kind === 'creature') {
      if (mine.length >= view.fieldCap) continue
      const cell = creatureCell(view, foes)
      if (!cell) continue
      let need: number
      if (view.mode === 'blackout' || view.auto)
        need =
          (mine.length < 4 ? 3 : mine.length < 6 ? 1 : -2) +
          (view.auto && foes.some((f) => threat(view, f) >= 5) ? 1.5 : 0)
      else
        need =
          (foes.some((f) => threat(view, f) >= 3) ? 3 : 0) +
          (mine.length < foes.length ? 1.5 : 0)
      deploy(card, cell, 2 + worthCard(card) * 0.6 + need)
    } else if (
      card.effect === 'zap' ||
      card.effect === 'chaos' ||
      card.effect === 'blast' ||
      card.effect === 'root' ||
      card.effect === 'debt'
    ) {
      for (const foe of foes) {
        const dmg = card.effect === 'chaos' ? 1 : power(card)
        const kills = dmg > 0 && hpOf(foe) <= dmg
        let value =
          (dmg > 0 ? 2 : 0) +
          threat(view, foe) * 0.6 +
          (kills ? 3 + worthUnit(foe) * 0.4 : 0) +
          (foe.carryingFlag && dmg > 0 ? 4 : 0)
        if (card.effect === 'blast') {
          // Splash: every other fighter beside the target takes 1.
          for (const o of view.units) {
            if (o.id === foe.id || dist(o, foe) !== 1) continue
            const friend = o.side === view.side
            if (friend && card.splash !== 'all') continue
            const pop = hpOf(o) <= 1 ? 2 + worthUnit(o) * 0.3 : 1
            value += friend ? -pop * 1.2 : pop
          }
        } else if (card.effect === 'root') {
          // Stopping a runner or a carrier is worth more than chip damage.
          if (foe.rooted) value -= 3
          else
            value += flagRun(view)
              ? foe.carryingFlag
                ? 6
                : dist(foe, view.flag) <= 2
                  ? 2
                  : 0
              : threat(view, foe) >= 4
                ? 2 + threat(view, foe) * 0.3
                : 0
        } else if (card.effect === 'debt') {
          value += (card.debt ?? 1) * 0.8 - view.debt[1] * 0.6
        }
        deploy(card, foe, value)
      }
      const monster = view.monster
      if (
        monster &&
        (card.effect === 'zap' ||
          card.effect === 'chaos' ||
          card.effect === 'blast')
      ) {
        const dmg = Math.max(
          0,
          (card.effect === 'chaos' ? 1 : power(card)) - monster.armor,
        )
        if (dmg > 0) {
          const kills = monster.hp <= dmg
          deploy(
            card,
            monster,
            kills ? 20 : 1 + (monster.hp <= monster.maxHp / 2 ? 1.5 : 0),
          )
        }
      }
    } else if (card.effect === 'scan') {
      // Sonar pays off when hidden enemies stand near one of ours.
      for (const u of mine) {
        const seen = foes.filter((f) => f.hidden && dist(f, u) <= 2).length
        const lanesRigged = view.mode !== 'blackout' && progress(view, u) >= 3
        const value = seen * 1.3 + (lanesRigged ? 1.6 : 0)
        if (value) deploy(card, u, value)
      }
    } else if (card.kind === 'equipment' && card.effect === 'sharpen') {
      for (const u of mine)
        deploy(
          card,
          u,
          1.5 +
            (isEngaged(view, u) ? 2 : 0) +
            (u.carryingFlag ? 1 : 0) +
            worthUnit(u) * 0.1,
        )
    } else if (card.kind === 'equipment' && card.effect === 'grant') {
      for (const u of mine) {
        const fresh = (card.grants ?? []).filter(
          (k) => !(u.keywords ?? []).includes(k),
        )
        if (!fresh.length) continue
        deploy(
          card,
          u,
          1 +
            keywordWorth(fresh) +
            (isEngaged(view, u) ? 1 : 0) +
            worthUnit(u) * 0.1,
        )
      }
    } else if (card.effect === 'heal') {
      for (const u of mine) {
        const missing = Math.min(power(card), (u.maxHp ?? 0) - (u.hp ?? 0))
        if (missing < 1) continue
        deploy(
          card,
          u,
          missing * 1.2 +
            (u.carryingFlag ? 3 : 0) +
            (isEngaged(view, u) ? 1 : 0),
        )
      }
    } else if (card.kind === 'spell' && card.effect === 'boost') {
      for (const u of mine) {
        let value = 0
        if (flagRun(view)) {
          const ap = u.ap ?? 0
          if (u.carryingFlag) value = 6
          else if (flagFree && dist(u, view.flag) > ap)
            value = dist(u, view.flag) <= ap + 2 ? 5 : 0
        } else if (!laneBlocked(view, u) && (u.ap ?? 0) < 3)
          value = 1.5 + progress(view, u) * 0.4
        // A rearming boost pays most on a spent ambusher about to fight.
        if (
          card.rearm &&
          (u.keywords ?? []).includes('ambush') &&
          u.ambushReady === false
        )
          value += isEngaged(view, u) ? 3.5 : 1.5
        if (value) deploy(card, u, value)
      }
    } else if (card.kind === 'equipment' && card.effect === 'armor') {
      for (const u of mine) {
        if ((u.armor ?? 0) >= 3) continue
        deploy(
          card,
          u,
          1.5 +
            (isEngaged(view, u) ? 2 : 0) +
            (u.carryingFlag ? 3 : 0) +
            worthUnit(u) * 0.1,
        )
      }
    } else if (card.kind === 'equipment') {
      for (const u of mine) {
        let value: number
        if (view.mode === 'blackout') value = u.carryingFlag ? 5 : 1.5
        else value = u.maxAp === 2 ? 2.5 + progress(view, u) * 0.3 : 0.5
        deploy(card, u, value + worthUnit(u) * 0.1)
      }
    } else if (card.kind === 'trap') {
      if (view.traps.length >= view.trapCap) continue
      const own = new Set(view.traps.map((t) => t.x + ':' + t.y))
      const legal = (c: Cell) =>
        c.x >= 0 &&
        c.y >= 0 &&
        c.x < view.width &&
        c.y < view.height &&
        trapZone(view, c.x) &&
        !blocked(view, c.x, c.y) &&
        !own.has(c.x + ':' + c.y)
      if (flagRun(view)) {
        // Lay a trap in the *visible* approach to the flag or the carrier's
        // retreat, not at an arbitrary seed cell. All inputs are from observe:
        // hidden identities, enemy trap locations and match seed stay private.
        const carrier = foes.find((f) => f.carryingFlag)
        if (carrier) {
          const home = view.side === 'player' ? 1 : -1
          for (const step of [1, 2]) {
            const cell = { x: carrier.x + home * step, y: carrier.y }
            if (legal(cell)) deploy(card, cell, 11 - step * 0.5)
          }
          for (const cell of cellsAround(view, carrier))
            if (legal(cell) && Math.sign(cell.x - carrier.x) === home)
              deploy(card, cell, 10)
        } else if (flagFree) {
          const nearest = [...foes].sort(
            (a, b) => dist(a, view.flag) - dist(b, view.flag) || a.id - b.id,
          )[0]
          const nearby = nearest && dist(nearest, view.flag) <= 4
          const cells = cellsAround(view, view.flag).filter(legal)
          const best = nearest
            ? cells.sort(
                (a, b) =>
                  dist(a, nearest) - dist(b, nearest) || a.x - b.x || a.y - b.y,
              )[0]
            : cells.sort((a, b) => a.x - b.x || a.y - b.y)[0]
          if (best)
            deploy(
              card,
              best,
              nearby ? 9 - dist(nearest, view.flag) * 0.4 : 3.5,
            )
        }
      } else {
        const ownEnd = view.side === 'player' ? 0 : view.width - 1
        for (const foe of foes) {
          const t = threat(view, foe)
          if (t < 1) continue
          const dir = Math.sign(ownEnd - foe.x)
          for (const step of [1, 2]) {
            const c = { x: foe.x + dir * step, y: foe.y }
            if (legal(c)) {
              deploy(card, c, 2 + t * 0.5 - step * 0.2)
              break
            }
          }
        }
      }
    }
  }
  return out
}

function bestCard(view: MatchView, tried: Set<string>): CpuAction | null {
  let options = cardCandidates(view).filter((c) => !tried.has(key(c.action)))
  if (!options.length) return null
  if (view.mode === 'bloodrush') {
    // BLOODRUSH banks mana for creature waves unless it must defend now;
    // specials still go out when they are worth it.
    const foes = view.units.filter((u) => u.side !== view.side)
    const pressed = foes.some((f) => threat(view, f) >= 4)
    const banking = !pressed && view.mana < 6 && view.round % 6 !== 0
    if (banking) {
      const creatures = new Set(
        view.hand.filter((c) => c.kind === 'creature').map((c) => c.id),
      )
      options = options.filter(
        (o) =>
          o.action.t === 'deploy' &&
          !creatures.has(o.action.card) &&
          o.value >= BANKED_SPECIAL,
      )
      if (!options.length) return null
    }
  }
  const best = options.sort(
    (a, b) => b.value - a.value || key(a.action).localeCompare(key(b.action)),
  )[0]!
  return best.value >= PLAY_THRESHOLD ? best.action : null
}

function bestMove(view: MatchView, tried: Set<string>): CpuAction | null {
  const mine = view.units
    .filter((u) => u.side === view.side)
    .sort((a, b) => a.id - b.id)
  const foes = view.units.filter((u) => u.side !== view.side)
  const carrier = mine.find((u) => u.carryingFlag)
  const foeCarrier = foes.find((u) => u.carryingFlag)
  const runners: number[] = []
  if (!carrier && !foeCarrier) {
    const ranked = mine
      .map((u) => ({ u, d: firstStep(view, u, [view.flag])?.length ?? 99 }))
      .sort((a, b) => a.d - b.d || a.u.id - b.u.id)
    runners.push(...ranked.slice(0, 2).map((r) => r.u.id))
  }
  const monster = view.monster
  const hunters: number[] = []
  if (monster && !foeCarrier) {
    const ranked = mine
      .filter((u) => !u.carryingFlag && !runners.includes(u.id))
      .map((u) => ({ u, d: dist(u, monster) }))
      .sort((a, b) => a.d - b.d || a.u.id - b.u.id)
    // Two hunters once it is wounded, so the killing blow is ours.
    const count = monster.hp <= monster.maxHp / 2 ? 2 : 1
    hunters.push(...ranked.slice(0, count).map((r) => r.u.id))
  }
  const ordered = [
    ...mine.filter((u) => u.carryingFlag),
    ...mine.filter((u) => runners.includes(u.id)),
    ...mine.filter((u) => !u.carryingFlag && !runners.includes(u.id)),
  ]
  for (const u of ordered) {
    if ((u.ap ?? 0) < 1) continue
    let goals: Cell[]
    if (u.carryingFlag) {
      goals = []
      for (let x = 0; x < view.width; x++)
        for (let y = 0; y < view.height; y++)
          if (flagHome(view, view.side, x)) goals.push({ x, y })
    } else if (foeCarrier) {
      if (dist(u, foeCarrier) === 1) continue
      goals = cellsAround(view, foeCarrier)
    } else if (runners.includes(u.id)) {
      goals = [view.flag]
    } else if (monster && hunters.includes(u.id)) {
      if (dist(u, monster) === 1) continue
      goals = cellsAround(view, monster)
    } else {
      if (isEngaged(view, u) || !foes.length) continue
      goals = foes.flatMap((f) => cellsAround(view, f))
    }
    const found = firstStep(view, u, goals)
    if (!found) continue
    const action: CpuAction = {
      t: 'move',
      id: u.id,
      x: found.step.x,
      y: found.step.y,
    }
    if (!tried.has(key(action))) return action
  }
  return null
}

/**
 * Arena orders: keep one defender home per intruder in our half (one more if
 * our flag is stolen), closest to our base first; everyone else attacks.
 */
function bestStance(view: MatchView, tried: Set<string>): CpuAction | null {
  const ownBase = view.side === 'player' ? 0 : view.width - 1
  const mine = view.units.filter((u) => u.side === view.side && !u.carryingFlag)
  if (!mine.length) return null
  const foes = view.units.filter((u) => u.side !== view.side)
  const intruders = foes.filter(
    (f) => Math.abs(f.x - ownBase) < view.width / 2,
  ).length
  const stolen = view.flags[0].carrier !== null ? 1 : 0
  const want = Math.min(
    Math.max(0, mine.length - 2),
    Math.ceil(intruders / 2) + stolen,
  )
  const ranked = [...mine].sort(
    (a, b) =>
      Math.abs(a.x - ownBase) - Math.abs(b.x - ownBase) ||
      (b.armor ?? 0) - (a.armor ?? 0) ||
      a.id - b.id,
  )
  for (const [index, unit] of ranked.entries()) {
    const stance = index < want ? 'defend' : 'attack'
    if (unit.stance === stance) continue
    const action: CpuAction = { t: 'stance', id: unit.id, stance }
    if (!tried.has(key(action))) return action
  }
  return null
}

// ---------------------------------------------------------------------------
// TURF CPU: a beginner Go player. It simulates each placement on a light
// board (captures, suicide), scores the result by nearest-stone influence
// plus atari pressure, then picks the card whose TURF effect suits the point.
// ---------------------------------------------------------------------------

type TurfCell = Side | 'slime'

interface TurfGroup {
  side: Side
  cells: Cell[]
  libs: number
  warded: boolean
}

function turfGroupsOn(
  view: MatchView,
  grid: Map<string, TurfCell>,
  wards: Set<string>,
): TurfGroup[] {
  const seen = new Set<string>()
  const groups: TurfGroup[] = []
  for (let y = 0; y < view.height; y++)
    for (let x = 0; x < view.width; x++) {
      const side = grid.get(x + ':' + y)
      if (!side || side === 'slime' || seen.has(x + ':' + y)) continue
      const cells: Cell[] = [{ x, y }]
      const libs = new Set<string>()
      seen.add(x + ':' + y)
      for (let i = 0; i < cells.length; i++)
        for (const n of cellsAround(view, cells[i]!)) {
          const k = n.x + ':' + n.y
          const at = grid.get(k)
          if (!at) libs.add(k)
          else if (at === side && !seen.has(k)) {
            seen.add(k)
            cells.push(n)
          }
        }
      groups.push({
        side,
        cells,
        libs: libs.size,
        warded: cells.some((c) => wards.has(c.x + ':' + c.y)),
      })
    }
  return groups
}

function turfInfluence(view: MatchView, grid: Map<string, TurfCell>): number {
  const stones: { x: number; y: number; side: Side }[] = []
  for (const [k, v] of grid)
    if (v !== 'slime') {
      const [x, y] = k.split(':').map(Number) as [number, number]
      stones.push({ x, y, side: v })
    }
  let total = 0
  for (let y = 0; y < view.height; y++)
    for (let x = 0; x < view.width; x++) {
      const at = grid.get(x + ':' + y)
      if (at && at !== 'slime') {
        total += at === view.side ? 1 : -1
        continue
      }
      let mine = 99
      let theirs = 99
      for (const s of stones) {
        const d = Math.abs(s.x - x) + Math.abs(s.y - y)
        if (s.side === view.side) mine = Math.min(mine, d)
        else theirs = Math.min(theirs, d)
      }
      if (mine < theirs && mine <= 4) total += 1
      else if (theirs < mine && theirs <= 4) total -= 1
    }
  return total
}

function turfEval(
  view: MatchView,
  grid: Map<string, TurfCell>,
  wards: Set<string>,
): number {
  let value = turfInfluence(view, grid)
  for (const g of turfGroupsOn(view, grid, wards)) {
    if (g.warded) continue
    if (g.side === view.side) {
      if (g.libs === 1) value -= 1.6 * g.cells.length
      else if (g.libs === 2) value -= 0.3 * g.cells.length
    } else if (g.libs === 1) value += 1.2 * g.cells.length
    else if (g.libs === 2) value += 0.3 * g.cells.length
  }
  return value
}

/** Place a stone of ours on a copy; null when the move would be suicide. */
function turfSimulate(
  view: MatchView,
  grid: Map<string, TurfCell>,
  wards: Set<string>,
  at: Cell,
): { grid: Map<string, TurfCell>; captured: number } | null {
  const next = new Map(grid)
  next.set(at.x + ':' + at.y, view.side)
  let captured = 0
  for (const g of turfGroupsOn(view, next, wards))
    if (g.side !== view.side && g.libs === 0 && !g.warded) {
      captured += g.cells.length
      for (const c of g.cells) next.delete(c.x + ':' + c.y)
    }
  const mine = turfGroupsOn(view, next, wards).find((g) =>
    g.cells.some((c) => c.x === at.x && c.y === at.y),
  )
  if (!mine || (mine.libs === 0 && !mine.warded)) return null
  return { grid: next, captured }
}

const TURF_OFFENSIVE = new Set(['zap', 'blast', 'chaos', 'root'])

function turfAction(view: MatchView, tried: Set<string>): CpuAction | null {
  if (view.turfPlayed) return null
  const grid = new Map<string, TurfCell>()
  const wards = new Set<string>()
  for (const u of view.units) {
    grid.set(u.x + ':' + u.y, u.side)
    if (u.warded) wards.add(u.x + ':' + u.y)
  }
  for (const p of view.puddles) grid.set(p.x + ':' + p.y, 'slime')
  const ownTraps = new Set(view.traps.map((t) => t.x + ':' + t.y))
  const base = turfEval(view, grid, wards)
  const groups = turfGroupsOn(view, grid, wards)
  const groupAt = (c: Cell) =>
    groups.find((g) => g.cells.some((s) => s.x === c.x && s.y === c.y))
  // PARITY: once the turn's play is spent, only the crew's free kind is left,
  // so never price cards the engine would refuse (that cost 80 retries a turn).
  const cards = view.hand.filter(
    (c) =>
      c.cost <= view.mana &&
      (!view.playSpent || (view.parity && c.kind === view.freeKind)),
  )
  if (!cards.length) return null
  const early = view.round < 8
  const options: Candidate[] = []
  for (let y = 0; y < view.height; y++)
    for (let x = 0; x < view.width; x++) {
      const k = x + ':' + y
      if (grid.has(k) || ownTraps.has(k)) continue
      const at = { x, y }
      const edge =
        x === 0 || y === 0 || x === view.width - 1 || y === view.height - 1
      const sim = turfSimulate(view, grid, wards, at)
      const near = cellsAround(view, at)
      const foes = near
        .map((n) => groupAt(n))
        .filter((g): g is TurfGroup => !!g && g.side !== view.side)
      const weakest = foes.length ? Math.min(...foes.map((g) => g.libs)) : 9
      for (const card of cards) {
        let value: number
        if (card.kind === 'trap') {
          if (view.traps.length >= view.trapCap) continue
          value = 0.5 + (foes.length && weakest <= 2 ? 0.4 : 0)
        } else {
          if (!sim) continue
          value = turfEval(view, sim.grid, wards) - base + sim.captured * 1.5
          if (early && edge) value -= 0.8
          if (card.kind === 'creature') value += 0.15
          else if (card.effect && TURF_OFFENSIVE.has(card.effect))
            value += foes.length
              ? weakest <= 1
                ? 3
                : weakest <= 2
                  ? 1.8
                  : 0.4
              : -0.6
          else if (card.effect === 'debt') value += 0.3
          else if (card.effect === 'boost')
            value += near.some((n) => grid.get(n.x + ':' + n.y) === 'slime')
              ? 1
              : -0.4
          else if (card.effect === 'scan') value -= 0.2
          else {
            const after = turfGroupsOn(view, sim.grid, wards).find((g) =>
              g.cells.some((c) => c.x === x && c.y === y),
            )
            value += after && after.libs <= 2 ? 1.5 : -0.3
          }
          value -= card.cost * 0.05
        }
        options.push({ action: { t: 'deploy', card: card.id, x, y }, value })
      }
    }
  const best = options
    .filter((o) => !tried.has(key(o.action)))
    .sort(
      (a, b) => b.value - a.value || key(a.action).localeCompare(key(b.action)),
    )[0]
  // Pass once nothing gains turf: two passes end the game.
  return best && best.value > 0.4 ? best.action : null
}

/** The CPU's next action for the side in view, or null to pass. */
export function chooseCpuAction(
  view: MatchView,
  tried: Set<string> = new Set(),
): CpuAction | null {
  if (view.victor) return null
  if (view.mode === 'turf') return turfAction(view, tried)
  const card = bestCard(view, tried)
  if (card) return card
  if (view.auto) return bestStance(view, tried)
  if (view.mode === 'blackout') return bestMove(view, tried)
  return null
}
