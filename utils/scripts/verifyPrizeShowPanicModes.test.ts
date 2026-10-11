// Prize Show Panic depth slice 7 (conductor kr-arcade/t-034): the mode card (Season, Rerun, Marathon,
// episode select, the medal board), the Rerun's remixed room scripts, the Marathon's endless legs,
// room medals (Flawless, Full Haul, Prime Time) kept on the device's board, and saves that carry them.
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import { create, readSave } from '../arcade/games/prizeShowPanic'
import type { PrizeSave } from '../arcade/games/prizeShowPanic'
import { TALLY_PAY, tallyRows } from '../arcade/prizeShow/broadcast'
import type { TallyRow } from '../arcade/prizeShow/broadcast'
import {
  MEDALS,
  MENU,
  MENU_AUTO,
  RERUN_LOOP,
  boardRows,
  boardTotal,
  marathonLeg,
  marathonLoop,
  medalRooms,
  mirrorProp,
  readMedals,
  remixScript,
} from '../arcade/prizeShow/modes'
import type { MedalBoard, MenuState, ShowMode } from '../arcade/prizeShow/modes'
import { CRASHER_KINDS } from '../arcade/prizeShow/roster'
import {
  PRIZE_VAULT,
  SEASON,
  declaredCrashers,
  exitsOf,
  roomById,
} from '../arcade/prizeShow/season'
import type {
  Episode,
  ModifierId,
  Prop,
  RoomScript,
  Side,
} from '../arcade/prizeShow/season'
import { CX, CY, LEFT, RIGHT, TOP } from '../arcade/prizeShow/stage'

type Prize = {
  x: number
  y: number
  kind: string
  life: number
  pedestal?: boolean
  lift: number
}
type Inner = {
  picking: unknown
  menu: MenuState | null
  choosing: number
  mode: ShowMode
  medals: MedalBoard
  marathonRooms: number
  marathonBest: number
  seasonCleared: boolean
  save: PrizeSave | null
  season: readonly Episode[]
  episode: Episode
  episodeIndex: number
  loop: number
  score: number
  lives: number
  level: number
  over: boolean
  invuln: number
  px: number
  py: number
  hit: boolean
  ratings: number
  roomId: string
  script: RoomScript
  prizes: Prize[]
  waves: unknown[]
  crashers: unknown[]
  mines: unknown[]
  twistClock: number
  modifiers: Map<string, ModifierId | null>
  tally: { rows: TallyRow[] } | null
  swap: { ticks: number } | null
  commercial: unknown
  map: unknown
  banner: { text: string; sub?: string } | null
  finalRows: TallyRow[] | null
  update(input: InputFrame, players?: InputFrame[]): void
  render(g: CanvasRenderingContext2D): void
  demoInput(): InputFrame
  startMode(mode: ShowMode, episode?: number): void
  beginEpisode(index: number): void
  enterRoom(id: string, entry: Side): void
  finishEpisode(): void
  awardMedals(wrap?: boolean): void
  openTally(): void
  leave(exit: {
    side: Side
    x: number
    y: number
    to: string
    kind: 'door'
  }): void
}

function stubContext(): CanvasRenderingContext2D {
  const gradient = { addColorStop: () => {} }
  return new Proxy(
    {},
    {
      get: (_, prop) => {
        if (prop === 'measureText') return () => ({ width: 6 })
        if (prop === 'createLinearGradient' || prop === 'createRadialGradient')
          return () => gradient
        return () => {}
      },
      set: () => true,
    },
  ) as CanvasRenderingContext2D
}
const g2d = stubContext()

function game(seed = 3, demo = false, resume?: unknown): Inner {
  return create({
    rng: mulberry32(seed),
    sound: { play: () => {} },
    demo,
    hiScore: 0,
    resume,
  }) as unknown as Inner
}

function press(...buttons: Array<keyof InputFrame['pressed']>): InputFrame {
  const f = emptyInput()
  for (const b of buttons) f.pressed[b] = true
  return f
}

/** Past the card's settle, onto its first live tick. */
function settle(g: Inner) {
  for (let t = 0; t < 20; t++) g.update(emptyInput())
}

/** Past the pick card, each seat with its cursor's contestant. */
function skipPick(g: Inner) {
  if (!g.picking) return
  ;(g.picking as { ticks: number }).ticks = 1e9
  g.update(emptyInput())
}

/** A quiet room of a show already under way: nobody coming. */
function quiet(g: Inner, id: string, entry: Side = 3) {
  g.modifiers.set(id, null)
  g.enterRoom(id, entry)
  g.waves = []
  g.crashers = []
  g.mines = []
  g.twistClock = 1e9
}

/** A save as the game keeps it: a cleared season, started over at Episode 1. */
function clearedSave(extra: Partial<PrizeSave> = {}): PrizeSave {
  const g = game(9)
  g.startMode('season')
  g.seasonCleared = true
  g.beginEpisode(0)
  return { ...g.save!, ...extra }
}

// --- the mode card -----------------------------------------------------------------------------------------
{
  const g = game(3)
  assert.ok(g.menu, 'a new show opens on the mode card')
  assert.deepEqual(MENU, ['season', 'rerun', 'marathon', 'episode', 'medals'])
  g.render(g2d)
  assert.equal(game(3, true).menu, null, 'the attract demo has no card')
  settle(g)
  // Rerun is locked until the season is cleared: A there does nothing.
  g.update(press('down'))
  assert.equal(g.menu!.cursor, 1)
  g.update(press('a'))
  assert.ok(g.menu, 'a locked row does not start')
  // Episode select is locked too.
  g.update(press('down'))
  g.update(press('down'))
  g.update(press('right'))
  assert.equal(g.menu!.episode, 0, 'no episode to pick yet')
  g.update(press('a'))
  assert.ok(g.menu)
  // The medal board opens over the card, and closes again.
  g.update(press('down'))
  g.update(press('a'))
  assert.ok(g.menu!.board, 'the medal board')
  g.render(g2d)
  settle(g)
  g.update(press('b'))
  assert.ok(g.menu && !g.menu.board, 'back to the card')
  settle(g)
  // Up wraps round to the Marathon's row... and A starts it.
  g.update(press('up'))
  g.update(press('up'))
  assert.equal(MENU[g.menu!.cursor], 'marathon')
  g.update(press('a'))
  assert.equal(g.menu, null)
  assert.equal(g.mode, 'marathon')
  assert.ok(g.picking, 'then the pick card')
  assert.equal(g.episode.billing, 'MARATHON')
  assert.equal(g.level, 1, 'the show starts on studio 1')

  // Left alone, the card takes the Season.
  const idle = game(4)
  for (let t = 0; t <= MENU_AUTO + 1 && idle.menu; t++)
    idle.update(emptyInput())
  assert.equal(idle.menu, null)
  assert.equal(idle.mode, 'season')
  assert.equal(idle.loop, 1)
  assert.equal(idle.episodeIndex, 0)
  assert.equal(idle.level, 1)
}

// --- a cleared season unlocks Rerun and episode select ------------------------------------------------------
{
  const save = clearedSave()
  assert.equal(save.episode, 0)
  // An Episode 1 save isn't offered, but what it has won still counts.
  const g = game(5, false, save)
  assert.equal(g.choosing, 0)
  assert.ok(g.menu)
  assert.ok(g.seasonCleared, 'the clear carries over')
  settle(g)
  g.update(press('down'))
  g.update(press('a'))
  assert.equal(g.mode, 'rerun')
  assert.equal(g.loop, RERUN_LOOP, 'New Game+: the first rerun')
  assert.equal(g.episodeIndex, 0)
  assert.ok(g.script.remixed, 'its rooms are remixed')
  skipPick(g)
  g.render(g2d)

  const e = game(6, false, save)
  settle(e)
  for (let i = 0; i < 3; i++) e.update(press('down'))
  e.update(press('right'))
  e.update(press('right'))
  assert.equal(e.menu!.episode, 2)
  e.render(g2d)
  e.update(press('left'))
  e.update(press('left'))
  e.update(press('left'))
  assert.equal(e.menu!.episode, SEASON.length - 1, 'round the season')
  e.update(press('right'))
  e.update(press('right'))
  e.update(press('right'))
  e.update(press('a'))
  assert.equal(e.mode, 'episode')
  assert.equal(e.episodeIndex, 2, 'Countdown Concert')
  assert.equal(e.loop, 1)
  assert.equal(e.roomId, SEASON[2]!.start)
  assert.equal(e.save!.episode, 2, 'and it saves there')
}

// --- the remix ----------------------------------------------------------------------------------------------
{
  const scripts: Array<[string, RoomScript]> = [...SEASON, PRIZE_VAULT].flatMap(
    (ep) => [
      ...ep.rooms.map((r): [string, RoomScript] => [r.id, r.script]),
      ...Object.entries(ep.secrets),
    ],
  )
  const total = (r: Record<string, number>) =>
    Object.values(r).reduce((a, b) => a + b, 0)
  let swapped = 0
  let mirrored = 0
  for (const [id, script] of scripts) {
    assert.equal(remixScript(script, id, 1), script, `${id}: loop 1 as written`)
    for (const loop of [2, 3, 4]) {
      const r = remixScript(script, id, loop)
      assert.deepEqual(r, remixScript(script, id, loop), 'the same every time')
      if (script.commercial) {
        assert.equal(r, script, 'a commercial is a commercial')
        continue
      }
      assert.ok(r.remixed)
      // As many crashers as the script wrote (only who they are and which door changes).
      assert.equal(
        total(declaredCrashers(r, loop)),
        total(declaredCrashers(script, loop)),
        `${id} at loop ${loop}: as many crashers`,
      )
      r.waves.forEach((w, i) => {
        const was = script.waves[i]!
        assert.ok(CRASHER_KINDS.includes(w.kind))
        if (was.fixed) assert.deepEqual(w, was, `${id}: a mini-boss stays`)
        if (was.count >= 3 && w.kind !== was.kind)
          assert.ok(
            !['clone', 'timer', 'diver'].includes(w.kind),
            `${id}: no gang of heavies`,
          )
        if (w.kind !== was.kind) swapped++
      })
      if (script.boss)
        assert.deepEqual(r.props, script.props, `${id}: a boss stage stays put`)
      if (r.props !== script.props) mirrored++
      for (const p of r.props ?? []) {
        if ('x' in p && p.kind !== 'hotplate' && p.kind !== 'belt')
          assert.ok(
            p.x >= LEFT && p.x <= RIGHT,
            `${id}: ${p.kind} on the floor`,
          )
        if (p.kind === 'warp')
          for (const [x, y] of [
            [p.x1, p.y1],
            [p.x2, p.y2],
          ] as const)
            assert.ok(
              Math.abs(x - CX) > 20 && Math.abs(y - CY) > 20,
              `${id}: no teleport door on a door's line`,
            )
      }
    }
  }
  assert.ok(swapped > 100, `crashers swapped for cousins (${swapped})`)
  assert.ok(mirrored > 30, `floors mirrored (${mirrored})`)
  // A mirror twice is the prop again.
  const props: Prop[] = [
    { kind: 'cushion', x: 70, y: 90 },
    {
      kind: 'beam',
      x: 100,
      y: TOP + 2,
      base: 1,
      swing: 0.5,
      on: 30,
      off: 30,
      offset: 0,
    },
    {
      kind: 'hotplate',
      x: 60,
      y: 80,
      w: 40,
      h: 20,
      every: 120,
      offset: 0,
    },
    { kind: 'belt', x: 50, y: 150, w: 80, h: 16, dir: 1 },
    { kind: 'mosh', x: 90, y: 160, r: 30, spin: 1 },
    { kind: 'crack', side: 1, at: 30, secret: 'backstage' },
    { kind: 'crack', side: 0, at: -60, secret: 'backstage' },
    { kind: 'warp', x1: 60, y1: 70, x2: 250, y2: 200 },
  ]
  for (const p of props) {
    const was = p as unknown as Record<string, unknown>
    for (const [k, v] of Object.entries(mirrorProp(mirrorProp(p))))
      assert.ok(
        v === was[k] ||
          (typeof v === 'number' && Math.abs(v - (was[k] as number)) < 1e-9),
        `${p.kind}.${k}: mirrored back`,
      )
  }
  const hp = mirrorProp(props[2]!) as Prop & { x: number; w: number }
  assert.equal(hp.x + hp.w, 2 * CX - 60, 'a plate flips about the middle')
  assert.equal((mirrorProp(props[3]!) as { dir: Side }).dir, 3)
  assert.equal((mirrorProp(props[5]!) as { side: Side }).side, 3)

  // In play: a rerun's room is the remix (and its HUD tags it).
  const g = game(7)
  g.startMode('rerun')
  skipPick(g)
  quiet(g, 'whoopee-alley')
  assert.deepEqual(
    g.script,
    remixScript(
      roomById(SEASON[0]!, 'whoopee-alley').script,
      'whoopee-alley',
      2,
    ),
  )
  g.render(g2d)
}

// --- the Marathon ---------------------------------------------------------------------------------------------
{
  assert.equal(marathonLoop(0), 1)
  assert.equal(marathonLoop(1), 1)
  assert.equal(marathonLoop(2), 2)
  assert.ok(marathonLoop(20) > marathonLoop(10))
  const seasonIds = new Set(
    [...SEASON, PRIZE_VAULT].flatMap((ep) => ep.rooms.map((r) => r.id)),
  )
  for (let leg = 0; leg < 12; leg++) {
    const ep = marathonLeg(leg, mulberry32(leg + 1))
    assert.deepEqual(ep, marathonLeg(leg, mulberry32(leg + 1)), 'replays alike')
    assert.equal(ep.number, leg + 1)
    assert.equal(ep.subtitle, `LEG ${leg + 1}`)
    assert.equal(ep.rooms.length, 10)
    const ids = ep.rooms.map((r) => r.id)
    assert.equal(new Set(ids).size, ids.length, 'no room twice in a leg')
    for (const room of ep.rooms) {
      assert.ok(seasonIds.has(room.id), `${room.id}: a season room`)
      exitsOf(ep, room.id) // every door faces its neighbour
      const s = room.script
      assert.ok(s.set, `${room.id}: on its own set`)
      assert.equal(s.ticket, undefined, 'no golden tickets in the Marathon')
      assert.ok(
        !(s.props ?? []).some((p) => p.kind === 'ticket' || p.kind === 'crack'),
        'no tickets or cracked walls',
      )
      assert.ok(!s.commercial)
      assert.notEqual(s.reward, 'ticket')
    }
    // Two lanes round the track, both ending at the boss.
    const start = roomById(ep, ep.start)
    assert.equal(start.exits.length, 2, 'safe or rich')
    const boss = roomById(ep, ep.finale)
    assert.ok(boss.script.boss, 'each leg ends on a boss')
    for (const [first, safe] of [
      [start.exits[0]!, true],
      [start.exits[1]!, false],
    ] as const) {
      let at = roomById(ep, first)
      let steps = 0
      while (at.id !== ep.finale && steps < 10) {
        if (safe) assert.ok(at.script.danger <= 2, `${at.id}: the safe lane`)
        else assert.ok(at.script.danger >= 3, `${at.id}: the rich lane`)
        assert.equal(at.exits.length, 1)
        at = roomById(ep, at.exits[0]!)
        steps++
      }
      assert.equal(steps, 4, 'four rooms a lane')
    }
  }
  // Every boss turns up within nine legs.
  const bosses = new Set(
    Array.from({ length: 9 }, (_, leg) => {
      const ep = marathonLeg(leg, mulberry32(1))
      return roomById(ep, ep.finale).script.boss!.kind
    }),
  )
  assert.equal(bosses.size, 9)

  // In play: a finished leg brings the next one, harder every two; there's always a commercial.
  const g = game(8)
  g.startMode('marathon')
  skipPick(g)
  assert.equal(g.season.length, 1)
  g.render(g2d)
  g.finishEpisode()
  assert.equal(g.episodeIndex, 1)
  assert.equal(g.season.length, 2)
  assert.equal(g.loop, marathonLoop(1))
  g.finishEpisode()
  assert.equal(g.loop, 2, 'leg 3 steps up')
  assert.equal(g.episode.subtitle, 'LEG 3')
  g.openTally()
  assert.ok(g.tally)
  for (let t = 0; t < 60 * 60 && !g.commercial; t++) g.update(press('a'))
  assert.ok(g.commercial, 'a commercial between legs')
  // Its rooms count, and the best run stays on the device.
  g.awardMedals()
  assert.equal(g.marathonRooms, 1)
  assert.equal(g.marathonBest, 1)
  assert.equal(g.save!.marathon, 1)
  assert.equal(g.save!.episode, 0, 'no Marathon leg to pick back up')
  assert.equal(g.save!.loop, 1)
  const back = game(9, false, JSON.parse(JSON.stringify(g.save)))
  assert.equal(back.choosing, 0, 'nothing to continue')
  assert.equal(back.marathonBest, 1)
  back.render(g2d)
}

// --- medals ----------------------------------------------------------------------------------------------------
{
  // Flawless, Full Haul and Prime Time, all three.
  const g = game(10)
  g.startMode('season')
  skipPick(g)
  quiet(g, 'opening-act')
  g.prizes = [{ x: g.px, y: g.py, kind: 'cash', life: 300, lift: 0 }]
  g.invuln = 1000
  g.update(emptyInput())
  assert.equal(g.prizes.length, 0, 'grabbed')
  g.ratings = 100
  g.leave({ side: 1, x: RIGHT, y: CY, to: 'whoopee-alley', kind: 'door' })
  assert.equal(
    g.medals['opening-act'],
    MEDALS.flawless.bit | MEDALS.haul.bit | MEDALS.prime.bit,
  )
  assert.deepEqual(g.save!.medals, g.medals, 'kept the moment they are won')

  // A hit costs Flawless; a prize let go costs the Full Haul; low ratings cost Prime Time.
  const h = game(11)
  h.startMode('season')
  skipPick(h)
  quiet(h, 'warm-up-crowd')
  h.prizes = [
    { x: h.px, y: h.py, kind: 'toaster', life: 300, lift: 0 },
    { x: 60, y: 60, kind: 'cash', life: 2, lift: 0 },
  ]
  h.update(emptyInput())
  for (let t = 0; t < 5; t++) h.update(emptyInput())
  h.hit = true
  h.ratings = 10
  h.awardMedals()
  assert.equal(h.medals['warm-up-crowd'] ?? 0, 0, 'no medals')
  // Nothing grabbed at all is no Full Haul either; a prize left lying is one lost.
  quiet(h, 'opening-act')
  h.awardMedals()
  assert.equal(h.medals['opening-act'], MEDALS.flawless.bit)
  quiet(h, 'conga-line')
  h.prizes = [{ x: h.px, y: h.py, kind: 'cash', life: 300, lift: 0 }]
  h.update(emptyInput())
  h.prizes = [{ x: 60, y: 60, kind: 'cash', life: 300, lift: 0 }]
  h.awardMedals()
  assert.equal(h.medals['conga-line'], MEDALS.flawless.bit, 'left behind')
  // ...unless it's the finale's wrap (the crew bags what's on the floor).
  h.awardMedals(true)
  assert.equal(
    h.medals['conga-line'],
    MEDALS.flawless.bit | MEDALS.haul.bit,
    'the wrap',
  )
  // Medals add up, never come off.
  quiet(h, 'opening-act')
  h.hit = true
  h.awardMedals()
  assert.equal(h.medals['opening-act'], MEDALS.flawless.bit)

  // The episode's medals pay at the tally.
  const rows = tallyRows({ cash: 0, toaster: 0, car: 0 }, 0, 0, 2, 4)
  const row = rows.find((r) => r.icon === 'medal')!
  assert.equal(row.count, 4)
  assert.equal(row.points, 4 * TALLY_PAY.medal * 2)
  assert.ok(
    !tallyRows({ cash: 0, toaster: 0, car: 0 }, 0, 0, 1).some(
      (r) => r.icon === 'medal',
    ),
  )
  h.openTally()
  assert.ok(
    h.tally!.rows.some((r) => r.icon === 'medal'),
    'the haul counts them',
  )
  h.render(g2d)

  // The board: every room but the commercial, three medals each, and only those.
  const rooms = medalRooms()
  assert.ok(!rooms.has('commercial-break'))
  assert.ok(rooms.has('backstage') && rooms.has('grand-prize'))
  assert.equal(boardRows().length, SEASON.length + 1)
  assert.deepEqual(boardTotal({}), { won: 0, of: rooms.size * 3 })
  assert.deepEqual(boardTotal({ 'opening-act': 7, backstage: 1 }).won, 4)
  assert.deepEqual(readMedals(undefined), {})
  assert.deepEqual(readMedals({ 'opening-act': 5 }), { 'opening-act': 5 })
  assert.equal(readMedals({ 'opening-act': 9 }), null)
  assert.equal(readMedals({ nowhere: 1 }), null)
  assert.equal(readMedals([1]), null)

  // The board rides along in the save, through a continue and through a new show.
  const kept = { ...clearedSave(), episode: 2, medals: { 'opening-act': 7 } }
  assert.ok(JSON.stringify(kept).length < 8192, 'the save stays small')
  const full: MedalBoard = {}
  for (const id of rooms) full[id] = 7
  assert.ok(
    JSON.stringify({ ...kept, medals: full }).length < 8192,
    'even with every medal won',
  )
  const a = game(12, false, kept)
  assert.ok(a.choosing > 0)
  settle(a)
  a.update(press('a'))
  assert.deepEqual(a.medals, { 'opening-act': 7 })
  const b = game(12, false, kept)
  settle(b)
  b.update(press('b'))
  assert.ok(b.menu, 'a new show: the mode card')
  assert.deepEqual(b.medals, { 'opening-act': 7 }, 'the board stays')
  assert.ok(b.seasonCleared)
  b.menu!.ticks = 1e9
  b.update(emptyInput())
  assert.equal(b.save!.episode, 0)
  assert.deepEqual(b.save!.medals, { 'opening-act': 7 })
  // A version 1 save (before medals) still reads.
  const { medals: _m, marathon: _r, ...old } = kept
  const v1 = readSave({ ...old, v: 1 })
  assert.ok(v1)
  assert.deepEqual(v1.medals, {})
  assert.equal(v1.marathon, 0)
}

// --- the game-over haul ---------------------------------------------------------------------------------------------
{
  const g = game(13)
  g.startMode('marathon')
  skipPick(g)
  quiet(g, g.roomId)
  g.awardMedals()
  g.lives = 1
  for (let t = 0; t < 60 * 60 && !g.over; t++) {
    g.invuln = 0
    g.hit = true
    ;(g as unknown as { loseLife(why: string): void }).loseLife('grabber')
    g.update(emptyInput())
  }
  assert.ok(g.over)
  const labels = g.finalRows!.map((r) => r.label)
  assert.ok(labels.includes('ROOM MEDALS'))
  assert.ok(labels.includes('MARATHON ROOMS'))
  for (let t = 0; t < 200; t++) g.update(emptyInput())
  g.render(g2d)
}

// --- whole runs: deterministic, the demo never scores, real runs end -------------------------------------------------
{
  function marathon(seed: number, minutes: number) {
    const g = game(seed)
    g.startMode('marathon')
    const trace: number[] = []
    let t = 0
    for (; t < 60 * 60 * minutes && !g.over; t++) {
      g.update(g.demoInput())
      if (t % 1200 === 0) {
        trace.push(g.level, g.episodeIndex, Math.round(g.px), g.score)
        g.render(g2d)
      }
    }
    return { g, trace, minutes: t / 3600 }
  }
  const a = marathon(3, 40)
  assert.deepEqual(
    a.trace,
    marathon(3, 40).trace,
    'the Marathon replays exactly',
  )
  assert.ok(a.g.over, `a real Marathon run ends (${a.minutes.toFixed(1)} min)`)
  assert.ok(
    a.g.marathonRooms >= 12,
    `the pilot gets two legs in (${a.g.marathonRooms})`,
  )
  assert.ok(a.g.score > 0 && a.g.score < 250_000_000)

  // The attract demo still never scores or saves (and never sees the cards).
  const d = game(4, true)
  for (let t = 0; t < 60 * 60 * 5; t++) {
    d.lives = 9
    d.update(emptyInput())
  }
  assert.equal(d.score, 0)
  assert.equal(d.save, null)
  assert.ok(Object.keys(d.medals).length > 0, 'it still wins medals (unsaved)')
}

console.log('verifyPrizeShowPanicModes: ok')
