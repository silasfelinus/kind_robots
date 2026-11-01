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

function deployZone(view: MatchView, side: Side, x: number): boolean {
  if (view.mode === 'blackout')
    return side === 'player' ? x <= 1 : x >= view.width - 2
  return side === 'player' ? x === 0 : x === view.width - 1
}

function trapZone(view: MatchView, x: number): boolean {
  if (view.mode === 'blackout') return !deployZone(view, other(view.side), x)
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
    : action.t === 'attack'
      ? 'a:' + action.id + ':' + action.target
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
  if (view.mode === 'blackout') {
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
      if (deployZone(view, view.side, x) && !occupant(view, x, y))
        open.push({ x, y })
  if (!open.length) return null
  const tie = (c: Cell) => mix(view.salt, view.round, c.x, c.y) * 0.01
  let score: (c: Cell) => number
  if (view.mode === 'blackout') {
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
      if (view.mode === 'blackout')
        need = mine.length < 4 ? 3 : mine.length < 6 ? 1 : -2
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
            value +=
              view.mode === 'blackout'
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
        if (view.mode === 'blackout') {
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
      if (view.mode === 'blackout') {
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
            (a, b) =>
              dist(a, view.flag) - dist(b, view.flag) || a.id - b.id,
          )[0]
          const nearby = nearest && dist(nearest, view.flag) <= 4
          const cells = cellsAround(view, view.flag).filter(legal)
          const best = nearest
            ? cells.sort(
                (a, b) =>
                  dist(a, nearest) - dist(b, nearest) ||
                  a.x - b.x || a.y - b.y,
              )[0]
            : cells.sort((a, b) => a.x - b.x || a.y - b.y)[0]
          if (best) deploy(card, best, nearby ? 9 - dist(nearest, view.flag) * 0.4 : 3.5)
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

function bestAttack(view: MatchView, tried: Set<string>): CpuAction | null {
  if (view.mode !== 'blackout') return null
  const mine = view.units.filter((u) => u.side === view.side && u.hp !== null)
  const enemies = view.units.filter(
    (u) => u.side !== view.side && u.hp !== null,
  )
  for (const u of mine) {
    if (u.attackedRound === view.round) continue
    if (u.summonedRound === view.round && !u.keywords?.includes('ambush'))
      continue
    // A carrier nearing home is a tactical emergency. Prefer stopping it
    // over a convenient one-HP target, but take lethal hits when safe.
    const target = enemies
      .filter((e) => dist(u, e) <= (u.range ?? 1))
      .sort((a, b) => {
        const rank = (e: ViewFighter) =>
          (e.carryingFlag ? 12 : 0) +
          ((e.hp ?? 99) <= (u.attack ?? 0) ? 4 : 0) +
          Math.max(0, 3 - dist(e, view.flag)) +
          1 / Math.max(1, e.hp ?? 99)
        return rank(b) - rank(a) || a.id - b.id
      })[0]
    if (target) {
      const action: CpuAction = { t: 'attack', id: u.id, target: target.id }
      if (!tried.has(key(action))) return action
    }
    if (view.monster && dist(u, view.monster) <= (u.range ?? 1)) {
      const action: CpuAction = { t: 'attack', id: u.id, target: -1 }
      if (!tried.has(key(action))) return action
    }
  }
  return null
}

/** The CPU's next action for the side in view, or null to pass. */
export function chooseCpuAction(
  view: MatchView,
  tried: Set<string> = new Set(),
): CpuAction | null {
  if (view.victor) return null
  const attack = bestAttack(view, tried)
  if (attack) return attack
  const card = bestCard(view, tried)
  if (card) return card
  if (view.mode === 'blackout') return bestMove(view, tried)
  return null
}
