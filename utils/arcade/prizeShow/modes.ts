// /utils/arcade/prizeShow/modes.ts
//
// Prize Show Panic's modes and medals (conductor kr-arcade t-034, depth-pass/ASSESSMENT.md section 2,
// "The contestants and the modes"):
//
//   Season          the whole show from Episode 1, as it always was.
//   Rerun           New Game+: the season again from its first rerun, every room's script remixed
//                   (remixScript) and modifiers rolled. Unlocked by a clear.
//   Marathon        endless rooms, the leaderboard's main event: legs of six rooms drawn from the
//                   whole season (marathonLeg), each leg ending on a boss, and harder every two legs.
//   Episode select  play on from any episode of the season. Unlocked by a clear.
//
// Medals per room: Flawless (no hit), Full Haul (every prize grabbed, none lost) and Prime Time (out of
// the room with the ratings at Prime Time). The medal board keeps them per episode, in the save.
//
// The remix is data, not dice: it is worked out from the room's id and the loop alone, so the map, the
// room and a replay always agree, and the game's seeded rng is untouched. Marathon legs are drawn with
// the game's rng (they are gameplay), so a replay draws the same legs.

import { drawText, measureText } from '../font'
import { INK, RAMPS, bevel, glow, hudPanel, rgba, shadedOrb } from '../snes'
import type { Ramp } from '../snes'
import { PRIZE_VAULT, SEASON } from './season'
import type {
  CrasherKind,
  DoorPick,
  Episode,
  MapRoom,
  Prop,
  RoomScript,
  Wave,
} from './season'
import { CX, H, W } from './stage'

// --- the modes -----------------------------------------------------------------------------------

export type ShowMode = 'season' | 'rerun' | 'marathon' | 'episode'
/** The mode card's rows: the four modes, and the medal board. */
export type MenuEntry = ShowMode | 'medals'
export const MENU: readonly MenuEntry[] = [
  'season',
  'rerun',
  'marathon',
  'episode',
  'medals',
]

export const MENU_CARDS: Record<MenuEntry, { title: string; line: string }> = {
  season: { title: 'SEASON', line: 'THE WHOLE SHOW, FROM THE TOP' },
  rerun: { title: 'RERUN', line: 'REMIXED ROOMS, HARDER, MORE TWISTS' },
  marathon: { title: 'MARATHON', line: 'ENDLESS ROOMS. HOW FAR CAN YOU GO?' },
  episode: { title: 'EPISODE SELECT', line: 'PLAY ON FROM ANY EPISODE' },
  medals: { title: 'MEDAL BOARD', line: 'THREE MEDALS IN EVERY ROOM' },
}

export const LOCKED_LINE = 'CLEAR THE SEASON TO UNLOCK'

/** Rerun and episode select open once the season has been cleared. */
export function unlocked(entry: MenuEntry, cleared: boolean): boolean {
  return entry === 'rerun' || entry === 'episode' ? cleared : true
}

/** The loop a Rerun starts on (the season's first rerun, remixed). */
export const RERUN_LOOP = 2

/** Ticks the mode card waits before it takes the row under the cursor. */
export const MENU_AUTO = 60 * 20

export type MenuState = {
  cursor: number
  /** Episode select's pick (an index into SEASON). */
  episode: number
  /** The medal board is open over the card. */
  board: boolean
  ticks: number
}

// --- medals --------------------------------------------------------------------------------------

export type MedalId = 'flawless' | 'haul' | 'prime'
export const MEDAL_IDS: readonly MedalId[] = ['flawless', 'haul', 'prime']

export const MEDALS: Record<
  MedalId,
  { bit: number; title: string; blurb: string; ramp: Ramp }
> = {
  flawless: {
    bit: 1,
    title: 'FLAWLESS',
    blurb: 'NOT ONE HIT',
    ramp: RAMPS.teal,
  },
  haul: {
    bit: 2,
    title: 'FULL HAUL',
    blurb: 'EVERY PRIZE, NONE LOST',
    ramp: RAMPS.gold,
  },
  prime: {
    bit: 4,
    title: 'PRIME TIME',
    blurb: 'OUT AT PRIME TIME',
    ramp: RAMPS.pink,
  },
}

/** Medals won, by room id: a bit for each (MEDALS[id].bit). */
export type MedalBoard = Record<string, number>

/** What each medal pays at the episode's tally, per loop. */
export const MEDAL_PAY = 1500

export function medalCount(bits: number): number {
  return (bits & 1) + ((bits >> 1) & 1) + ((bits >> 2) & 1)
}

/** The medal board's rows: each episode (and the Vault), its rooms and secret rooms in order. */
export type BoardRow = { episode: Episode; rooms: string[] }

export function boardRows(): BoardRow[] {
  return [...SEASON, PRIZE_VAULT].map((episode) => ({
    episode,
    rooms: [
      ...episode.rooms.filter((r) => !r.script.commercial).map((r) => r.id),
      ...Object.keys(episode.secrets),
    ],
  }))
}

/** Every room that can earn medals. */
export function medalRooms(): Set<string> {
  return new Set(boardRows().flatMap((row) => row.rooms))
}

export function boardTotal(board: MedalBoard): { won: number; of: number } {
  const rooms = medalRooms()
  let won = 0
  for (const id of rooms) won += medalCount(board[id] ?? 0)
  return { won, of: rooms.size * MEDAL_IDS.length }
}

/** A stored medal board, checked: only this season's rooms, three bits each. */
export function readMedals(raw: unknown): MedalBoard | null {
  if (raw === undefined) return {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const rooms = medalRooms()
  const out: MedalBoard = {}
  for (const [id, bits] of Object.entries(raw)) {
    if (!rooms.has(id)) return null
    if (typeof bits !== 'number' || !Number.isInteger(bits)) return null
    if (bits < 0 || bits > 7) return null
    if (bits) out[id] = bits
  }
  return out
}

/** A medal: a ribbon and a disc (lit when won, a dim slot when not). */
export function drawMedal(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  id: MedalId,
  lit: boolean,
  r = 3,
) {
  const ramp = MEDALS[id].ramp
  if (!lit) {
    g.fillStyle = INK
    g.fillRect(x - r, y - r, r * 2, r * 2)
    g.fillStyle = RAMPS.night[2]
    g.fillRect(x - r + 1, y - r + 1, r * 2 - 2, r * 2 - 2)
    return
  }
  if (r > 3) {
    g.fillStyle = INK
    g.fillRect(x - r + 1, y - r * 2 - 1, r * 2 - 2, r + 2)
    g.fillStyle = ramp[2]
    g.fillRect(x - r + 2, y - r * 2, r - 2, r + 1)
    g.fillStyle = ramp[1]
    g.fillRect(x, y - r * 2, r - 2, r + 1)
  }
  shadedOrb(g, x, y, r, ramp)
}

// --- the remix (Rerun, and every pass after the first) -------------------------------------------

/** Cousins a remixed wave may swap a crasher for: alike in how they come at you. */
const COUSINS: readonly (readonly CrasherKind[])[] = [
  ['grabber', 'meatball', 'clone'],
  ['bouncer', 'diver', 'saucer'],
  ['thrower', 'chef', 'popper', 'drone'],
  ['stagehand', 'roadie', 'heckler', 'timer'],
]

/** Cousins too much to meet a whole gang of at once. */
const HEAVY: readonly CrasherKind[] = ['clone', 'timer', 'diver']

/** One door for another (never more doors than the script wrote). */
const DOOR_REMIX: Partial<Record<DoorPick, DoorPick>> = {
  far: 'any',
  any: 'far',
}

/** A small, steady hash of a room and a loop (FNV-1a): the remix's only source of choice. */
export function remixHash(id: string, loop: number): number {
  let h = 2166136261
  for (const ch of `${id}/${loop}`) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h
}

function remixWave(wave: Wave, hash: number, i: number): Wave {
  if (wave.fixed) return wave
  const group = COUSINS.find((g) => g.includes(wave.kind))
  let kind = wave.kind
  // About half the waves swap their crashers for cousins (a big gang never for a heavy one).
  if (group && (hash >>> (i % 24)) & 1) {
    const others = group.filter(
      (k) => k !== wave.kind && (wave.count < 3 || !HEAVY.includes(k)),
    )
    if (others.length)
      kind = others[((hash >>> ((i + 5) % 24)) + i) % others.length]!
  }
  const doors =
    (hash >>> ((i + 3) % 24)) & 1
      ? (DOOR_REMIX[wave.doors] ?? wave.doors)
      : wave.doors
  return kind === wave.kind && doors === wave.doors
    ? wave
    : { ...wave, kind, doors }
}

/** A prop seen in a mirror down the middle of the set (the floor is symmetric about CX). */
export function mirrorProp(prop: Prop): Prop {
  const mx = (x: number) => 2 * CX - x
  switch (prop.kind) {
    case 'cushion':
    case 'peel':
    case 'pedestal':
    case 'ticket':
    case 'flour':
    case 'speaker':
      return { ...prop, x: mx(prop.x) }
    case 'mosh':
      return { ...prop, x: mx(prop.x), spin: prop.spin === 1 ? -1 : 1 }
    case 'beam':
      return {
        ...prop,
        x: mx(prop.x),
        base: Math.PI - prop.base,
        swing: -prop.swing,
      }
    case 'hotplate':
      return { ...prop, x: mx(prop.x) - prop.w }
    case 'belt':
      return {
        ...prop,
        x: mx(prop.x) - prop.w,
        dir: prop.dir === 1 ? 3 : prop.dir === 3 ? 1 : prop.dir,
      }
    case 'turntable':
      return { ...prop, spin: -prop.spin }
    case 'warp':
      return { ...prop, x1: mx(prop.x1), x2: mx(prop.x2) }
    case 'crack':
      return prop.side % 2 === 0
        ? { ...prop, at: -prop.at }
        : { ...prop, side: prop.side === 1 ? 3 : 1 }
    case 'camera':
    case 'boom':
      return prop
  }
}

/**
 * A room's script remixed for a later pass: some crashers swapped for their cousins, some single
 * doors swapped, and (half the time, never on a boss stage) the whole floor mirrored. Loop 1 is the
 * authored show, untouched.
 */
export function remixScript(
  script: RoomScript,
  id: string,
  loop: number,
): RoomScript {
  if (loop < 2 || script.commercial) return script
  const hash = remixHash(id, loop)
  const waves = script.waves.map((w, i) => remixWave(w, hash, i))
  const encore = script.encore?.map((e, k) => ({
    ...e,
    waves: e.waves.map((w, i) => remixWave(w, hash, 11 + k * 5 + i)),
  }))
  const mirror = !script.boss && (hash >>> 28) % 2 === 1
  return {
    ...script,
    waves,
    ...(encore ? { encore } : {}),
    ...(mirror && script.props ? { props: script.props.map(mirrorProp) } : {}),
    remixed: true,
  }
}

// --- the Marathon ---------------------------------------------------------------------------------

/** Legs get harder every this many (the loop curves, a step at a time). */
export const MARATHON_LEGS_PER_STEP = 2

export function marathonLoop(leg: number): number {
  return 1 + Math.floor(leg / MARATHON_LEGS_PER_STEP)
}

const LEG_TITLES = [
  'THE LONG HAUL',
  'NO BREAKS',
  'STILL GOING',
  'AFTER HOURS',
  'THE NIGHT SHIFT',
  'OVERTIME',
  'ONE MORE ROUND',
  'THE GRAVEYARD SLOT',
] as const

/** The bosses, in the order the legs meet them (round again after the Prize Machine). */
const BOSS_ORDER = [
  'parade-float',
  'pie-cart',
  'mosh-mascot',
  'mothership',
  'grand-finale',
  'souffle-supreme',
  'the-jumbotron',
  'conga-dragon',
  'prize-machine',
] as const

type PoolRoom = { id: string; script: RoomScript }

/** The Marathon has no tickets or secrets: what those rooms' cards say instead. */
const MARATHON_TAGLINES: Readonly<Record<string, string>> = {
  'lightning-round': 'QUICK! THE CLOCK IS SHORT',
  'sponsor-spotlight': 'NO HITS WINS A SPONSOR BONUS',
  'flour-power': "WHO'S HIDING IN THE CLOUD?",
  'bake-off': 'EVERY PRIZE WINS A BONUS',
  'the-pit': "DON'T GET SWEPT UP",
  'sponsor-solo': 'NO HITS WINS A SPONSOR BONUS',
  'teleport-hall': 'STEP IN, STEP OUT',
  spacewalk: 'NO HITS WINS A SPONSOR BONUS',
}

/** A season room made fit for the Marathon: on its own set, no tickets, no cracked walls. */
function marathonScript(
  id: string,
  script: RoomScript,
  episode: Episode,
): RoomScript {
  return {
    ...script,
    set: script.set ?? episode.set,
    tagline: MARATHON_TAGLINES[id] ?? script.tagline,
    reward: script.reward === 'ticket' ? 'car' : script.reward,
    ticket: undefined,
    props: script.props?.filter(
      (p) => p.kind !== 'ticket' && p.kind !== 'crack',
    ),
  }
}

function pools(): {
  safe: PoolRoom[]
  rich: PoolRoom[]
  boss: Map<string, PoolRoom>
} {
  const safe: PoolRoom[] = []
  const rich: PoolRoom[] = []
  const boss = new Map<string, PoolRoom>()
  for (const episode of [...SEASON, PRIZE_VAULT])
    for (const room of episode.rooms) {
      const s = room.script
      if (s.commercial) continue
      const entry = { id: room.id, script: marathonScript(room.id, s, episode) }
      if (s.boss) boss.set(room.id, entry)
      else if (s.danger <= 2) safe.push(entry)
      else rich.push(entry)
    }
  return { safe, rich, boss }
}

let POOLS: ReturnType<typeof pools> | null = null

/** `n` rooms from `pool` with the game's rng, none twice (and none in `not`). */
function draw(
  pool: readonly PoolRoom[],
  n: number,
  rng: () => number,
  not: Set<string>,
): PoolRoom[] {
  const left = pool.filter((r) => !not.has(r.id))
  const out: PoolRoom[] = []
  for (let i = 0; i < n && left.length; i++) {
    const [room] = left.splice(Math.floor(rng() * left.length), 1)
    out.push(room!)
    not.add(room!.id)
  }
  return out
}

/**
 * A Marathon leg: a racetrack of rooms round the map. From the start (left middle) the top lane is
 * the safe one (a stroll or two, prize vaults) and the bottom lane the rich one (harder rooms, bigger
 * prizes); both meet at the leg's boss on the right.
 *
 *            col 0      col 1      col 2      col 3
 *   row 0    SAFE    -> SAFE    -> SAFE    -> SAFE
 *   row 1    START                            BOSS
 *   row 2    RICH    -> RICH    -> RICH    -> RICH
 */
export function marathonLeg(leg: number, rng: () => number): Episode {
  POOLS ??= pools()
  const used = new Set<string>()
  const late = leg >= 3
  const rich = POOLS.rich.filter((r) => late || r.script.danger < 5)
  const [start] = draw(POOLS.safe, 1, rng, used)
  const safe = draw(POOLS.safe, 4, rng, used)
  const hard = draw(rich, 4, rng, used)
  const boss = POOLS.boss.get(BOSS_ORDER[leg % BOSS_ORDER.length]!)!
  const room = (
    r: PoolRoom,
    col: number,
    row: number,
    exits: string[],
  ): MapRoom => ({ id: r.id, col, row, script: r.script, exits })
  const lane = (rooms: PoolRoom[], row: number): MapRoom[] =>
    rooms.map((r, i) =>
      room(r, i, row, [i + 1 < rooms.length ? rooms[i + 1]!.id : boss.id]),
    )
  return {
    number: leg + 1,
    title: LEG_TITLES[leg % LEG_TITLES.length]!,
    subtitle: `LEG ${leg + 1}`,
    billing: 'MARATHON',
    set: 'studio',
    cols: 4,
    rows: 3,
    start: start!.id,
    midBoss: '',
    finale: boss.id,
    rooms: [
      room(start!, 0, 1, [safe[0]!.id, hard[0]!.id]),
      ...lane(safe, 0),
      ...lane(hard, 2),
      room(boss, 3, 1, []),
    ],
    secrets: {},
  }
}

// --- the cards -------------------------------------------------------------------------------------

export type MenuView = {
  menu: MenuState
  cleared: boolean
  board: MedalBoard
  marathonBest: number
  tick: number
}

/** The mode card: tonight's programme, and what each mode is. */
export function renderModeCard(g: CanvasRenderingContext2D, view: MenuView) {
  const { menu, tick } = view
  g.fillStyle = rgba(INK, 0.7)
  g.fillRect(0, 0, W, H)
  drawText(g, "TONIGHT'S PROGRAMME", CX, 14, {
    align: 'center',
    scale: 2,
    color: '#ffffff',
    outline: INK,
    shadow: RAMPS.purple[1],
  })
  const blink = Math.floor(tick / 10) % 2 === 0
  MENU.forEach((entry, i) => {
    const y = 40 + i * 32
    const open = unlocked(entry, view.cleared)
    const here = i === menu.cursor
    if (here) glow(g, CX, y + 12, 90, RAMPS.gold[3], 0.18)
    hudPanel(g, 30, y, W - 60, 26, here ? RAMPS.purple : RAMPS.night)
    if (here) {
      g.strokeStyle = blink ? '#ffffff' : RAMPS.gold[4]
      g.lineWidth = 1
      g.strokeRect(29.5, y - 0.5, W - 59, 27)
    }
    const card = MENU_CARDS[entry]
    let title = card.title
    if (entry === 'episode' && open) {
      const ep = SEASON[menu.episode]!
      title = `EPISODE  < ${ep.number} >  ${ep.title}`
    }
    drawText(g, title, 40, y + 4, {
      color: open ? (here ? RAMPS.gold[4] : '#ffffff') : RAMPS.night[4],
      outline: INK,
    })
    const line = open ? card.line : LOCKED_LINE
    drawText(g, line, 40, y + 15, {
      color: open ? RAMPS.cream[3] : RAMPS.night[4],
      shadow: INK,
    })
    // What each row has to show for itself on the right.
    let side = ''
    if (entry === 'marathon' && view.marathonBest > 0)
      side = `BEST ${view.marathonBest}`
    if (entry === 'medals') {
      const t = boardTotal(view.board)
      side = `${t.won}/${t.of}`
    }
    if (side)
      drawText(g, side, W - 40, y + 4, {
        align: 'right',
        color: RAMPS.teal[4],
        outline: INK,
      })
    if (!open) bevel(g, W - 50, y + 8, 10, 10, RAMPS.steel, { depth: 1 })
  })
  drawText(g, 'UP/DOWN CHOOSE   A START', CX, 214, {
    align: 'center',
    color: blink ? RAMPS.gold[4] : RAMPS.gold[3],
    outline: INK,
  })
  if (view.menu.board) renderMedalBoard(g, view.board, tick)
}

/** The medal board: every episode's rooms, three medals each, and the totals. */
export function renderMedalBoard(
  g: CanvasRenderingContext2D,
  board: MedalBoard,
  tick: number,
) {
  g.fillStyle = INK
  g.fillRect(0, 0, W, H)
  hudPanel(g, 4, 4, W - 8, H - 8, RAMPS.night)
  drawText(g, 'MEDAL BOARD', CX, 10, {
    align: 'center',
    scale: 2,
    color: RAMPS.gold[4],
    outline: INK,
    shadow: RAMPS.purple[1],
  })
  // The key.
  let kx = 22
  for (const id of MEDAL_IDS) {
    drawMedal(g, kx, 34, id, true)
    drawText(g, MEDALS[id].title, kx + 6, 31, {
      color: MEDALS[id].ramp[3],
      shadow: INK,
    })
    kx += 18 + measureText(MEDALS[id].title)
  }
  boardRows().forEach((row, i) => {
    const y = 46 + i * 28
    const label = row.episode.vault
      ? 'BONUS: THE VAULT'
      : `${row.episode.number}. ${row.episode.title}`
    let won = 0
    for (const id of row.rooms) won += medalCount(board[id] ?? 0)
    const of = row.rooms.length * MEDAL_IDS.length
    const full = won === of
    drawText(g, label, 14, y, {
      color: full ? RAMPS.gold[4] : '#ffffff',
      shadow: INK,
    })
    drawText(g, `${won}/${of}`, W - 14, y, {
      align: 'right',
      color: full ? RAMPS.gold[4] : RAMPS.teal[4],
      shadow: INK,
    })
    // A full row wins its rosette.
    if (full)
      drawMedal(g, W - 22 - measureText(`${won}/${of}`), y + 3, 'haul', true, 4)
    row.rooms.forEach((id, k) => {
      const bits = board[id] ?? 0
      const x = 18 + k * 20
      g.fillStyle = rgba(RAMPS.night[0], 0.8)
      g.fillRect(x - 3, y + 10, 19, 10)
      MEDAL_IDS.forEach((m, j) =>
        drawMedal(g, x + 3 + j * 6, y + 15, m, (bits & MEDALS[m].bit) !== 0, 2),
      )
    })
  })
  const t = boardTotal(board)
  drawText(g, `TOTAL ${t.won}/${t.of}`, 14, H - 20, {
    color: RAMPS.gold[4],
    outline: INK,
  })
  drawText(g, 'A OR B  BACK', W - 14, H - 20, {
    align: 'right',
    color: Math.floor(tick / 20) % 2 ? RAMPS.gold[4] : RAMPS.gold[3],
    outline: INK,
  })
}
