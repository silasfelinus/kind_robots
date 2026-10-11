// Prize Show Panic depth slice 3 (conductor kr-arcade/t-028): the broadcast. The host and co-host
// (original lines, bleep-speak through playNotes or a plain blip), the cues that bring them on, the
// ratings meter and its four tiers (multipliers, Prime Time care packages, Off Air plot twists),
// cheer chains, the prize tally, the Prize Swap, the studio (APPLAUSE, the audience, camera
// flashes) and the season haul on the game-over screen; plus seed replay with the show running.
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { glyphFor } from '../arcade/font'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import type { Note } from '../arcade/sound'
import { create } from '../arcade/games/prizeShowPanic'
import {
  BORROWED_PHRASES,
  CHAIN_CAP,
  CHAIN_STEP,
  CHAIN_WINDOW,
  COHOST_FROM_EPISODE,
  COHOST_LINES,
  HOST_LINES,
  RATINGS,
  SWAP_OFFERS,
  TIERS,
  affordable,
  bleepSpeak,
  chainMilestone,
  chainMultiplier,
  emptyWallet,
  seasonRows,
  tallyRows,
  tierOf,
  wrapLine,
} from '../arcade/prizeShow/broadcast'
import type {
  Cue,
  SwapId,
  TallyRow,
  Wallet,
} from '../arcade/prizeShow/broadcast'
import type { Crasher, CrasherKind } from '../arcade/prizeShow/roster'
import { EPISODE_1, roomById } from '../arcade/prizeShow/season'
import type { ModifierId, Side } from '../arcade/prizeShow/season'
import type { PowerKind } from '../arcade/prizeShow/arsenal'

type Point = { x: number; y: number }
type Inner = {
  picking: unknown
  score: number
  level: number
  lives: number
  over: boolean
  px: number
  py: number
  invuln: number
  loop: number
  episodeIndex: number
  commercial: unknown
  roomTick: number
  roomTimer: number
  cleared: boolean
  hit: boolean
  ratings: number
  chain: number
  bestChain: number
  twistClock: number
  packageClock: number
  applause: number
  audienceCheer: number
  camFlash: number
  tickets: string[]
  wallet: Wallet
  episodeWon: Wallet
  seasonWon: Wallet
  powers: Record<PowerKind, number>
  perks: { clock: number; power: PowerKind | null; secret: boolean }
  cutIn: { voice: string; text: string; ticks: number } | null
  cutQueue: Array<{ voice: string; text: string }>
  tally: { rows: TallyRow[]; ticks: number; paid: number } | null
  swap: { cursor: number; ticks: number; bought: SwapId[] } | null
  finalRows: TallyRow[] | null
  modifiers: Map<string, ModifierId | null>
  waves: unknown[]
  crashers: Crasher[]
  streamers: Array<
    Point & { vx: number; vy: number; life: number; style: string }
  >
  prizes: Array<Point & { kind: string; life: number; lift: number }>
  packages: unknown[]
  crack: { hp: number } | null
  boss: { hp: number; x: number; y: number } | null
  map: unknown
  update(input: InputFrame): void
  render(g: CanvasRenderingContext2D): void
  enterRoom(id: string, entry: Side): void
  beginEpisode(index: number): void
  makeCrasher(kind: CrasherKind, x: number, y: number): Crasher
  cheer(c: Crasher): void
  multiplier(withChain?: boolean): number
  canBuy(id: SwapId): boolean
  openTally(): void
  openSwap(): void
  openMap(side: Side | null): void
}

type Heard = { notes: Note[][]; plays: string[] }

/** Past the contestant pick card (each seat takes the contestant under its cursor). */
function skipPick(g: { picking: unknown; update(input: InputFrame): void }) {
  // Past the mode card first (left alone, it takes the Season).
  const menu = (g as unknown as { menu: { ticks: number } | null }).menu
  if (menu) {
    menu.ticks = 1e9
    g.update(emptyInput())
  }
  if (!g.picking) return
  ;(g.picking as { ticks: number }).ticks = 1e9
  g.update(emptyInput())
}

function fresh(seed = 3, withNotes = true): Inner & { heard: Heard } {
  const heard: Heard = { notes: [], plays: [] }
  const sound = withNotes
    ? {
        play: (name: string) => void heard.plays.push(name),
        playNotes: (notes: Note[]) => void heard.notes.push(notes),
      }
    : { play: (name: string) => void heard.plays.push(name) }
  const g = create({
    rng: mulberry32(seed),
    sound: sound as never,
    demo: false,
    hiScore: 0,
  }) as unknown as Inner & { heard: Heard }
  g.heard = heard
  skipPick(g)
  return g
}

/** A quiet room: nothing coming, no twists, the host's last line done. */
function stage(id = 'opening-act', seed = 3) {
  const g = fresh(seed)
  g.modifiers.set(id, null)
  g.enterRoom(id, 2)
  g.waves = [
    {
      wave: { at: 0, kind: 'grabber', count: 1, doors: 'far' },
      at: 1e9,
      left: 1,
    },
  ]
  g.crashers = []
  g.twistClock = 1e9
  g.cutIn = null
  g.cutQueue = []
  ;(g as unknown as { cutGap: number }).cutGap = 0
  g.px = 160
  g.py = 200
  return g
}

function safe(g: Inner, n = 1, input: InputFrame = emptyInput()) {
  for (let i = 0; i < n; i++) {
    g.invuln = 1000
    g.update(input)
  }
}

function press(button: keyof InputFrame['held']): InputFrame {
  const frame = emptyInput()
  frame.held[button] = true
  frame.pressed[button] = true
  return frame
}

/** Whether the host's line on screen is one of `cue`'s. */
function saying(g: Inner, cue: Cue): boolean {
  return !!g.cutIn && HOST_LINES[cue].includes(g.cutIn.text)
}

function stubContext(): CanvasRenderingContext2D {
  const gradient = { addColorStop: () => {} }
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'createLinearGradient' || prop === 'createRadialGradient')
          return () => gradient
        return () => {}
      },
      set: () => true,
    },
  ) as CanvasRenderingContext2D
}
const g2d = stubContext()

// --- the lines: original, in the pixel font, short enough for the panel ------------------------
{
  const all = [...Object.values(HOST_LINES).flat(), ...COHOST_LINES]
  for (const cue of Object.keys(HOST_LINES) as Cue[])
    assert.ok(HOST_LINES[cue].length >= 2, `${cue}: more than one line`)
  assert.ok(COHOST_LINES.length >= 6)
  for (const line of all) {
    for (const char of line)
      assert.ok(
        char === '?' || glyphFor(char) !== glyphFor('?'),
        `"${line}": no glyph for ${char}`,
      )
    assert.ok(wrapLine(line, 28).length <= 3, `"${line}" fits the panel`)
    for (const phrase of BORROWED_PHRASES)
      assert.ok(!line.includes(phrase), `"${line}" is our own writing`)
  }
  assert.deepEqual(wrapLine('ONE TWO THREE', 7), ['ONE TWO', 'THREE'])

  // Bleep-speak: a note a syllable, the same every time, the co-host lower and flatter.
  const host = bleepSpeak('LIGHTS UP! HERE THEY COME!', 'host')
  assert.deepEqual(host, bleepSpeak('LIGHTS UP! HERE THEY COME!', 'host'))
  assert.ok(host.length >= 4 && host.length <= 12)
  assert.ok(host.every((n) => n.type === 'square'))
  const last = host[host.length - 1]!
  assert.ok(last.to! > last.freq, 'an exclamation rises')
  const dry = bleepSpeak('RATINGS: ADEQUATE.', 'cohost')
  assert.ok(dry.every((n) => n.type === 'triangle'))
  const avg = (notes: Note[]) =>
    notes.reduce((a, n) => a + n.freq, 0) / notes.length
  assert.ok(avg(dry) < avg(host) * 0.75, 'LENS speaks low')
  assert.ok(
    dry[dry.length - 1]!.to! < dry[dry.length - 1]!.freq,
    'a full stop falls',
  )
}

// --- the cues ----------------------------------------------------------------------------------
{
  // Room start: the host cuts in and speaks in bleeps through the cabinet's notes.
  const g = fresh()
  assert.ok(g.cutIn && g.cutIn.voice === 'host', 'the host opens the show')
  assert.ok(g.heard.notes.length > 0, 'bleep-speak through playNotes')
  // A cabinet without playNotes: a plain blip instead.
  const plain = fresh(3, false)
  assert.ok(plain.heard.plays.includes('blip'))
  for (let t = 0; t < 600; t++) plain.update(emptyInput())

  // Boss intro.
  const b = fresh()
  b.modifiers.set('parade-float', null)
  b.enterRoom('parade-float', 3)
  assert.ok(saying(b, 'boss-intro'))
  assert.equal(
    b.cutQueue[0]!.text,
    roomById(EPISODE_1, 'parade-float').script.boss!.line,
    "then the boss's own introduction",
  )

  // Low time, once a room.
  const lt = stage()
  lt.roomTimer = 605
  safe(lt, 8)
  assert.ok(saying(lt, 'low-time'))
  lt.cutIn = null
  safe(lt, 8)
  assert.equal(lt.cutIn, null, 'only once a room')

  // A death.
  const d = stage()
  d.invuln = 0
  const grabber = d.makeCrasher('grabber', d.px, d.py)
  grabber.t = 1
  d.update(emptyInput())
  assert.ok(d.lives < 3)
  assert.ok(saying(d, 'death'))

  // A near miss: a shot that grazes past counts once.
  const n = stage()
  const r0 = n.ratings
  n.invuln = 0
  n.streamers.push({
    x: n.px + 8,
    y: n.py - 30,
    vx: 0,
    vy: 1.8,
    life: 60,
    style: 'streamer',
  })
  for (let t = 0; t < 30; t++) {
    n.update(emptyInput())
    n.invuln = 0
  }
  assert.equal(n.lives, 3, 'it missed')
  assert.ok(n.ratings > r0, 'the near miss lifts the ratings')
  assert.ok(saying(n, 'near-miss'))

  // A big prize, a golden ticket, a clean clear.
  const p = stage()
  p.prizes.push({ x: p.px, y: p.py, kind: 'car', life: 100, lift: 0 })
  safe(p)
  assert.ok(saying(p, 'big-prize'))
  assert.equal(p.wallet.car, 1, 'the car goes in the wallet')
  const c = stage()
  c.waves = []
  const before = c.ratings
  safe(c)
  assert.ok(c.cleared)
  assert.ok(saying(c, 'no-damage'))
  assert.ok(c.ratings >= before + RATINGS.noDamageClear - 1)
  assert.ok(c.audienceCheer > 0, 'the audience cheers')

  // The risky route: taking the more dangerous door.
  const m = fresh(5)
  m.openMap(0)
  for (let t = 0; t < 40; t++) m.update(emptyInput())
  const map = (
    m as unknown as { map: { options: Array<{ id: string }>; cursor: number } }
  ).map
  const rich = map.options.findIndex((o) => o.id === 'whoopee-alley')
  map.cursor = rich
  m.update(press('a'))
  assert.ok(saying(m, 'risky-route'))

  // LENS joins on episode 3, Countdown Concert, and answers now and then.
  let replies = 0
  const late = fresh(11)
  late.beginEpisode(COHOST_FROM_EPISODE - 1)
  for (let i = 0; i < 40; i++) {
    late.modifiers.set('sound-check', null)
    late.enterRoom('sound-check', 3)
    if (late.cutQueue.some((q) => q.voice === 'cohost')) replies++
  }
  assert.ok(
    replies > 4 && replies < 36,
    `LENS chimes in sometimes (${replies}/40)`,
  )
  // ...and stays for every encore, Opening Night included.
  let encoreReplies = 0
  const encore = fresh(12)
  encore.loop = 2
  for (let i = 0; i < 40; i++) {
    encore.modifiers.set('opening-act', null)
    encore.enterRoom('opening-act', 3)
    if (encore.cutQueue.some((q) => q.voice === 'cohost')) encoreReplies++
  }
  assert.ok(encoreReplies > 4, `LENS on the encore (${encoreReplies}/40)`)
  const early = fresh(1)
  for (let t = 0; t < 3000; t++) {
    early.update(emptyInput())
    assert.ok(
      !early.cutIn || early.cutIn.voice === 'host',
      'not before episode 3',
    )
    if (early.over || early.map) break
  }
}

// --- the ratings meter ----------------------------------------------------------------------------
{
  assert.equal(TIERS.length, 4)
  assert.equal(TIERS[0]!.name, 'OFF AIR')
  assert.equal(TIERS[3]!.name, 'PRIME TIME')
  for (let i = 1; i < TIERS.length; i++) {
    assert.ok(TIERS[i]!.from > TIERS[i - 1]!.from)
    assert.ok(
      TIERS[i]!.multiplier > TIERS[i - 1]!.multiplier,
      'each tier pays more',
    )
  }
  assert.equal(tierOf(0), 0)
  assert.equal(tierOf(100), 3)

  // Idle drains it; a hit knocks it down; style fills it.
  const g = stage()
  const start = g.ratings
  safe(g, RATINGS.idleAfter + 100)
  assert.ok(g.ratings < start, 'standing about drains the ratings')
  const h = stage()
  h.invuln = 0
  h.makeCrasher('grabber', h.px, h.py).t = 1
  h.update(emptyInput())
  assert.ok(h.ratings <= start + RATINGS.hit + 1, 'a hit costs ratings')

  // The tier multiplies the score.
  const s = stage()
  s.ratings = 0
  const low = s.multiplier(false)
  s.ratings = 100
  assert.equal(s.multiplier(false) / low, TIERS[3]!.multiplier)
  const plain = stage()
  plain.ratings = 0
  const rich = stage()
  rich.ratings = 100
  for (const g2 of [plain, rich]) {
    const c = g2.makeCrasher('grabber', 60, 60)
    g2.cheer(c)
  }
  assert.ok(rich.score > plain.score * 2, 'Prime Time cheers pay more')

  // Prime Time: a sponsor's care package drops, and lands as prizes.
  const pt = stage()
  pt.ratings = 100
  pt.packageClock = 0
  safe(pt)
  assert.equal(pt.packages.length, 1, 'a care package')
  const prizes = pt.prizes.length
  safe(pt, 200)
  assert.ok(pt.prizes.length >= prizes + 3, 'it bursts into prizes')

  // Off Air: the producer's plot twist brings extra trouble, then waits.
  const off = stage()
  off.ratings = 0
  off.twistClock = 0
  off.roomTick = RATINGS.twistGrace + 1
  safe(off)
  assert.ok(off.crashers.length > 0, 'a plot twist')
  assert.ok(
    off.crashers.every((c) => c.extra),
    'extra to the script',
  )
  const n = off.crashers.length
  off.crashers = []
  safe(off, 60)
  assert.equal(off.crashers.length, 0, 'and not another straight away')
  assert.ok(n >= 1)
}

// --- cheer chains -----------------------------------------------------------------------------------
{
  assert.equal(chainMultiplier(1), 1)
  assert.equal(chainMultiplier(CHAIN_STEP), 2)
  assert.equal(chainMultiplier(1000), CHAIN_CAP)
  assert.ok(chainMilestone(CHAIN_STEP) && !chainMilestone(CHAIN_STEP + 1))

  const g = stage()
  for (let i = 0; i < CHAIN_STEP; i++) {
    g.cheer(g.makeCrasher('grabber', 60 + i * 20, 60))
    safe(g, 10)
  }
  assert.equal(g.chain, CHAIN_STEP, 'quick cheers chain')
  assert.ok(
    g.cutIn && g.cutIn.text.includes(`${CHAIN_STEP} IN A ROW`),
    'the host counts it out',
  )
  assert.ok(g.multiplier() >= 2 * g.multiplier(false))
  assert.ok(g.applause > 0, 'the APPLAUSE sign is lit')
  safe(g, CHAIN_WINDOW + 5)
  assert.equal(g.chain, 0, 'too slow and the chain breaks')
  assert.equal(g.bestChain, CHAIN_STEP)
  g.cheer(g.makeCrasher('grabber', 60, 60))
  safe(g)
  g.invuln = 0
  g.makeCrasher('grabber', g.px, g.py).t = 1
  g.update(emptyInput())
  assert.equal(g.chain, 0, 'a hit breaks it too')
}

// --- the prize tally and the Prize Swap ------------------------------------------------------------
{
  const won = { cash: 3, toaster: 1, car: 1 }
  const rows = tallyRows(won, 2, 3, 1)
  assert.deepEqual(
    rows.map((r) => r.icon),
    ['cash', 'toaster', 'car', 'ticket', 'ratings', 'bonus'],
    'prizes, tickets, ratings, then the episode bonus',
  )
  assert.equal(rows[0]!.count, 3)
  assert.equal(rows[0]!.points, 0, 'prizes paid on pickup')
  assert.ok(rows[3]!.points > 0 && rows[5]!.points > 0)
  assert.equal(seasonRows(won, 2, 17).at(-1)!.count, 17)

  // The finale's wrap opens the tally; it counts up, pays its rows, and opens the swap.
  const g = fresh(4)
  g.modifiers.set('grand-finale', null)
  g.enterRoom('grand-finale', 3)
  g.episodeWon = { cash: 2, toaster: 1, car: 1 }
  g.wallet = { cash: 4, toaster: 1, car: 1 }
  ;(g as unknown as { waves: Array<{ left: number }> }).waves.forEach(
    (w) => (w.left = 0),
  )
  g.boss = null
  g.crashers = []
  for (let t = 0; t < 300 && !g.tally; t++) {
    g.crashers = []
    safe(g)
  }
  assert.ok(g.tally, 'the haul is tallied')
  const ticksBefore = g.heard.plays.filter((p) => p === 'blip').length
  const score = g.score
  for (let t = 0; t < 150; t++) g.update(emptyInput())
  assert.ok(
    g.heard.plays.filter((p) => p === 'blip').length > ticksBefore + 10,
    'a tick a count',
  )
  for (let t = 0; t < 600 && g.tally; t++) g.update(emptyInput())
  assert.equal(g.tally, null)
  assert.ok(g.score > score, 'the bonus rows pay')
  assert.ok(g.swap, 'then the Prize Swap')
  g.render(g2d)

  // What the prizes buy.
  for (const offer of SWAP_OFFERS)
    assert.ok(Object.keys(offer.cost).length === 1)
  assert.ok(
    !affordable(SWAP_OFFERS[0]!, emptyWallet(), 0),
    'nothing for nothing',
  )
  const lives = g.lives
  g.swap!.ticks = 30
  g.swap!.cursor = 0
  g.update(press('a'))
  assert.equal(g.lives, lives + 1, 'a car buys a contestant')
  assert.equal(g.wallet.car, 0)
  g.update(press('a'))
  assert.equal(g.lives, lives + 1, 'no car, no deal')
  g.update(press('down'))
  g.update(press('a'))
  assert.ok(g.perks.power, 'a toaster buys a starting power-up')
  assert.ok(!g.canBuy('power'), 'one a swap')
  g.update(press('down'))
  g.update(press('a'))
  g.update(press('a'))
  assert.equal(g.perks.clock, 10, 'cash buys seconds')
  assert.equal(g.wallet.cash, 0)
  g.tickets = ['e1-showcase']
  g.update(press('down'))
  g.update(press('a'))
  assert.ok(g.perks.secret, 'a golden ticket reveals a secret')
  assert.equal(g.tickets.length, 0, 'and is spent')
  const perks = { ...g.perks }
  g.update(press('down'))
  g.update(press('a'))
  assert.equal(g.swap, null, 'DONE moves the show on')
  assert.ok(g.commercial, 'to a commercial break')
  for (let t = 0; t < 6000 && g.commercial; t++) g.update(emptyInput())
  assert.equal(g.episodeIndex, 1, 'then episode 2')
  assert.ok(g.powers[perks.power!] > 0, 'the episode opens with the power-up')
  assert.ok(
    g.roomTimer > 40 * 60 * 0.9 + 9 * 60,
    'and extra seconds on the clock',
  )
  g.modifiers.set('flour-power', null)
  g.enterRoom('flour-power', 3)
  assert.equal(g.crack!.hp, 0, 'and the secret wall already open')

  // Left alone, the swap moves on by itself.
  const idle = fresh(4)
  idle.openSwap()
  for (let t = 0; t < 60 * 16 && idle.swap; t++) idle.update(emptyInput())
  assert.equal(idle.swap, null)
}

// --- the studio -------------------------------------------------------------------------------
{
  const g = stage('parade-float')
  g.modifiers.set('parade-float', null)
  g.enterRoom('parade-float', 3)
  const b = g.boss!
  ;(g as unknown as { shots: unknown[] }).shots.push({
    x: b.x,
    y: b.y,
    vx: 0,
    vy: 0,
    life: 5,
    hue: 0,
    kind: 'confetti',
    foamy: false,
    damage: 1,
    pierce: 0,
    hits: [],
  })
  safe(g)
  assert.ok(g.camFlash > 0, 'camera flashes on a boss hit')
  g.render(g2d)
}

// --- game over: the season haul ------------------------------------------------------------------
{
  const g = fresh(7)
  g.seasonWon = { cash: 5, toaster: 2, car: 1 }
  g.bestChain = 12
  g.lives = 1
  g.invuln = 0
  g.makeCrasher('grabber', g.px, g.py).t = 1
  for (let t = 0; t < 300 && !g.over; t++) {
    g.update(emptyInput())
    g.invuln = 0
    if (!g.crashers.length) g.makeCrasher('grabber', g.px, g.py).t = 1
  }
  assert.ok(g.over)
  assert.deepEqual(
    g.finalRows!.map((r) => r.count),
    [5, 2, 1, g.tickets.length, 12],
    'the season haul, counted on the way out',
  )
  assert.ok(saying(g, 'game-over'))
  for (let t = 0; t < 200; t++) {
    g.update(emptyInput())
    if (t % 20 === 0) g.render(g2d)
  }
}

// --- the show doesn't touch the game's dice -------------------------------------------------------
{
  const play = (seed: number, withNotes: boolean) => {
    const g = fresh(seed, withNotes)
    const trace: number[] = []
    for (let t = 0; t < 60 * 60 * 3 && !g.over; t++) {
      const frame = emptyInput()
      frame.aim = { x: Math.cos(t / 50), y: Math.sin(t / 70) }
      frame.held.right = t % 240 < 60
      frame.held.down = t % 300 > 200
      frame.pressed.a = t % 45 === 0
      g.update(frame)
      if (t % 120 === 0)
        trace.push(g.score, g.lives, Math.round(g.ratings), g.chain)
    }
    return trace
  }
  assert.deepEqual(play(9, true), play(9, true), 'replays exactly')
  assert.deepEqual(play(9, true), play(9, false), 'with or without a voice')

  // The attract pilot gets through the tally and the swap on its own.
  const demo = create({
    rng: mulberry32(7),
    sound: { play: () => {} },
    demo: true,
    hiScore: 0,
  }) as unknown as Inner
  let tallied = false
  for (let t = 0; t < 60 * 60 * 12 && demo.episodeIndex === 0; t++) {
    demo.lives = 99
    demo.update(emptyInput())
    if (demo.tally) tallied = true
  }
  assert.ok(tallied, 'the pilot sees the tally')
  assert.equal(demo.episodeIndex, 1, 'and swaps its way into the next episode')
  assert.equal(demo.score, 0, 'the attract demo still never scores')
}

console.log('verifyPrizeShowPanicShow: ok')
