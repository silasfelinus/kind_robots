// Pipe Pals depth pass (conductor kr-arcade/t-023, t-024). Slice 1: recovery tiers, the
// last-critter rush, kick chains, kick bowling, walkers turning round, the shell knight, spring
// fleas, ember hazards and the tool belt. Slice 2: the Day Shift districts (boards, rosters,
// vines, the lift, soap), the special phases and golden valves, the bonus twists, the lint moth
// and sock puppet, the Big Shell and the Workshop. Each rule is pinned on a staged board.
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import {
  CHAIN_POINTS,
  DISTRICTS,
  chainPoints,
  create,
  readPipeSave,
  rosterFor,
  walkersMeet,
} from '../arcade/games/pipePals'
import type { Kind, ToolKind } from '../arcade/games/pipePals'
import {
  PHASES_PER_DISTRICT,
  SHOP_ITEMS,
  SPECIAL_PHASE,
  districtSteps,
  GOLDEN_MAIN,
} from '../arcade/pipePals/districts'

type Critter = {
  kind: Kind
  x: number
  y: number
  vx: number
  vy: number
  dir: number
  onGround: boolean
  flipped: number
  angry: boolean
  armored: boolean
  tier: number
  rush: boolean
  kicked: boolean
  slide: number
  hits: number
  hop: number
  squash: number
  trapped: number
  flying: boolean
  size: number
  mode: number
}
type Boss = {
  x: number
  y: number
  hp: number
  state: string
  tipHits: number
  seg: { x0: number; x1: number; y: number }
}
type Inner = {
  score: number
  level: number
  lives: number
  over: boolean
  critters: Critter[]
  queue: Kind[]
  coins: Array<{ x: number; y: number; float?: number }>
  pickups: Array<{ x: number; y: number; kind: ToolKind; life: number }>
  embers: Array<{
    kind: string
    x: number
    y: number
    life: number
    tell: number
  }>
  bubbles: Array<{ x: number; y: number; vy: number }>
  tool: { kind: ToolKind; ticks: number; charges: number } | null
  chain: number
  kicks: number
  kindBlockUses: number
  kindMax: number
  invuln: number
  phaseDelay: number
  cardTicks: number
  wallet: number
  valves: string[]
  stepIndex: number
  districtIndex: number
  district: { id: string; number: number }
  boss: Boss | null
  workshop: { cursor: number; t: number; bought: string[] } | null
  leaks: Array<{ x: number; y: number; sealed: boolean; t: number }>
  seedlings: Array<{ x: number; y: number; state: string }>
  socks: Array<{ x: number; y: number; colour: string; life: number }>
  heldSock: string | null
  pairs: number
  bonusRound: number
  bonusFeed: number
  bonusTotal: number
  vines: Map<number, { sag: number; down: number }>
  boardNow: Array<{ x0: number; x1: number; y: number; kind?: string }>
  player: {
    x: number
    y: number
    vx: number
    vy: number
    face: number
    onGround: boolean
  }
  frozen: Map<unknown, number>
  crumbles: Map<unknown, { landings: number; down: number }>
  icicles: Array<{
    x: number
    y: number
    grow: number
    state: string
    fy: number
    vy: number
    t: number
  }>
  blocks: Array<{ x: number; y: number; hits: number; freed: boolean }>
  gauges: Array<{ x: number; y: number; p: number; burst: boolean }>
  wheels: Array<{ x: number; y: number }>
  route: number
  bestChain: number
  thermo: { hp: number; target: number; targetT: number; mode: string } | null
  waterY: number
  pumpNext: number
  pumpsDone: boolean
  flooded: boolean
  eel: { side: number; state: string; t: number; len: number } | null
  jellies: Array<{ x: number; y: number; t: number }>
  platforms: Array<{ x0: number; x1: number; y: number; life: number }>
  lamps: Array<{ x: number; y: number; lit: boolean }>
  slicks: Map<unknown, number>
  mimics: Array<{ x: number; y: number; t: number; stunned: number }>
  king: {
    phase: number
    segs: Array<{ x: number; y: number; cracked: boolean; dents: number }>
    plates: Array<{ x: number; y: number; state: string }>
    kicksLeft: number
    coreHits: number
  } | null
  flush: number
  ending: { t: number; trueEnding: boolean } | null
  inGolden: boolean
  offer: unknown
  save: { district: number; score: number; continued: boolean } | null
  lap: number
  phaseTicks: number
  kick(c: unknown, dir: number): void
  tick: number
  liftLefts: number[]
  release(): void
  thermoLedges(): Array<{ x0: number; x1: number; y: number }>
  update(input: InputFrame, players?: InputFrame[]): void
  bumpAt(x: number, floorY: number): void
  moveCritters(): void
  startPhase(phase: number): void
  beginDistrict(index: number): void
  advance(): void
  demoInput(): InputFrame
  refreshBoard(): void
  menu: {
    row: number
    mode: number
    pal: number
    district: number
    board: boolean
  } | null
  pals: Array<{
    kind: string
    body: { x: number; y: number; vx: number; vy: number; onGround: boolean }
    alive: boolean
    invuln: number
    stun: number
    points: number
    tool: unknown
  }>
  cur: number
  mode: string
  result: { t: number; title: string; lines: string[] } | null
  medals: Record<string, number>
  times: Record<string, number>
  reached: number
  trialTicks: number
  phaseFell: boolean
  phaseChain: number
  phaseCount: number
  steps: Array<{ kind: string }>
  alive: boolean
  bumpReach(): number
  loseLife(): void
  awardMedals(phase: number): void
}

const quiet = { play: () => {} }
function game(seed = 3): Inner {
  const g = create({
    rng: mulberry32(seed),
    sound: quiet,
    demo: false,
    hiScore: 0,
  }) as unknown as Inner
  // Straight past the mode menu into the campaign.
  g.menu = null
  return g
}

/** A game on a district's board with nothing in play and a pal who can't be hurt. */
function fresh(seed = 3, district = 0): Inner {
  const g = game(seed)
  if (district) g.beginDistrict(district)
  g.cardTicks = 0
  g.queue = []
  g.critters = []
  g.embers = []
  g.invuln = 100_000
  return g
}

function critter(
  kind: Kind,
  x: number,
  y: number,
  extra: Partial<Critter> = {},
): Critter {
  return {
    kind,
    x,
    y,
    vx: 0,
    vy: 0,
    dir: 1,
    onGround: true,
    flipped: 0,
    angry: false,
    armored: kind === 'knight',
    tier: 0,
    rush: false,
    kicked: false,
    slide: 0,
    hits: 0,
    hop: 40,
    squash: 0,
    trapped: 0,
    flying: false,
    size: 6,
    mode: 0,
    ...extra,
  }
}

function press(button: keyof InputFrame['held']): InputFrame {
  const f = emptyInput()
  f.held[button] = true
  f.pressed[button] = true
  return f
}

// --- pure rules ---------------------------------------------------------------------------

const [rooftop, greenhouse, suds, cold, boiler, clock, flooded, storm] =
  DISTRICTS
assert.equal(DISTRICTS.length, 8, 'three shifts: eight districts')
assert.equal(rosterFor(storm!, 1).debut, 'beetle')
assert.deepEqual(
  districtSteps(storm!)
    .slice(-4)
    .map((s) => s.kind),
  ['boss', 'bonus', 'ending', 'workshop'],
  'the Clog King, a bonus, then the ending',
)
assert.deepEqual(
  districtSteps(GOLDEN_MAIN).slice(-2),
  [{ kind: 'ending', trueEnding: true }, { kind: 'workshop' }],
  'the Golden Main ends in the true ending',
)
assert.ok(flooded!.water && flooded!.eels && flooded!.jellies)
assert.ok(storm!.dark && storm!.lamps!.length === 4)
assert.equal(rosterFor(cold!, 1).debut, 'frost')
assert.equal(rosterFor(cold!, 2).debut, 'snowball')
assert.equal(rosterFor(clock!, 1).debut, 'gearbug')
assert.equal(
  districtSteps(clock!).at(-3)!.kind,
  'boss',
  'the Thermostat ends the Swing Shift',
)
for (const d of DISTRICTS) {
  // Every special prop and vent stands on a ledge that a pal can bump from the row below.
  for (const spot of [
    ...(d.spots ?? []),
    ...(d.icicles ?? []),
    ...(d.lamps ?? []),
  ]) {
    assert.ok(
      d.segments.some(
        (s) => s.y === spot.y && s.x0 <= spot.x && s.x1 >= spot.x,
      ),
      `${d.id}: a ledge under the prop at ${spot.x},${spot.y}`,
    )
    if (d.spots?.includes(spot) || d.lamps?.includes(spot))
      assert.ok(
        d.segments.some(
          (s) => s.y === spot.y + 66 && s.x0 <= spot.x && s.x1 >= spot.x,
        ),
        `${d.id}: a ledge to bump the prop at ${spot.x},${spot.y} from`,
      )
  }
}
assert.deepEqual(rosterFor(rooftop!, 1), {
  kinds: ['crawler'],
  debut: 'crawler',
})
assert.equal(rosterFor(rooftop!, 2).debut, 'crab')
assert.equal(rosterFor(greenhouse!, 1).debut, 'flea')
assert.equal(rosterFor(greenhouse!, 2).debut, 'knight')
assert.equal(rosterFor(suds!, 1).debut, 'moth')
assert.equal(rosterFor(suds!, 2).debut, 'puppet')
assert.equal(rosterFor(suds!, 4).debut, null)
for (const d of DISTRICTS) {
  const steps = districtSteps(d)
  assert.equal(
    steps.filter((s) => s.kind === 'phase').length,
    PHASES_PER_DISTRICT,
  )
  assert.equal(steps.at(-1)!.kind, 'workshop', `${d.id} ends at the Workshop`)
  assert.ok(
    steps.some((s) => s.kind === 'bonus'),
    `${d.id} has a bonus round`,
  )
  // Every board: a full floor, ledges under both top pipes, a gap over the KIND block.
  assert.ok(d.segments.some((s) => s.y === 310 && s.x0 === 0 && s.x1 === 448))
  for (const x of [18, 430])
    assert.ok(
      d.segments.some((s) => s.y === 112 && s.x0 <= x && s.x1 >= x),
      `${d.id}: a ledge under the pipe at ${x}`,
    )
  assert.ok(
    !d.segments.some(
      (s) => s.y === 244 && s.x1 > d.kindBlock.x && s.x0 < d.kindBlock.x + 24,
    ),
    `${d.id}: the KIND block sits under a gap`,
  )
}
assert.equal(
  districtSteps(suds!).at(-3)!.kind,
  'boss',
  'the Big Shell ends the Day Shift',
)
assert.deepEqual(
  [1, 2, 3, 4, 5, 6].map(chainPoints),
  [800, 1600, 2400, 3200, 5000, 5000],
  'kick chains climb, then cap',
)
assert.equal(CHAIN_POINTS.length, 5)
assert.ok(walkersMeet({ x: 100, y: 310, dir: 1 }, { x: 110, y: 310, dir: -1 }))
assert.ok(
  !walkersMeet({ x: 100, y: 310, dir: -1 }, { x: 110, y: 310, dir: 1 }),
  'walking apart',
)
assert.ok(
  !walkersMeet({ x: 100, y: 310, dir: 1 }, { x: 110, y: 244, dir: -1 }),
  'other floor',
)

// --- the campaign runs in order --------------------------------------------------------------

{
  const g = game()
  assert.equal(g.level, 1, 'games start on level 1')
  assert.equal(g.district.id, 'rooftop')
  assert.ok(g.cardTicks > 0, 'a district opens on its title card')
  g.update(press('a'))
  assert.equal(g.cardTicks, 0, 'A skips the card')
  for (let i = 1; i < PHASES_PER_DISTRICT; i++) g.advance()
  assert.equal(g.level, PHASES_PER_DISTRICT)
  g.advance()
  assert.ok(g.bonusRound > 0, 'the bonus round follows the fifth phase')
  g.advance()
  assert.ok(g.workshop, 'then the Workshop')
  const levelAtShop = g.level
  g.workshop!.t = 30
  g.workshop!.cursor = SHOP_ITEMS.findIndex((s) => s.item === 'done')
  g.update(press('a'))
  assert.equal(g.workshop, null)
  assert.equal(
    g.district.id,
    'greenhouse',
    'BACK TO WORK opens the next district',
  )
  assert.equal(g.level, levelAtShop + 1)
  assert.equal(g.queue[0], 'flea', 'the greenhouse opens with its newcomer')
}

// --- walkers turn round when they meet ----------------------------------------------------

{
  const g = fresh()
  const a = critter('crawler', 200, 310, { dir: 1 })
  const b = critter('crawler', 214, 310, { dir: -1 })
  g.critters = [a, b]
  g.moveCritters()
  assert.equal(a.dir, -1)
  assert.equal(b.dir, 1)
}

// --- tiers and the last-critter rush -------------------------------------------------------

{
  const g = fresh()
  const c = critter('crawler', 200, 310, { flipped: 1 })
  const other = critter('crawler', 400, 244)
  g.critters = [c, other]
  g.moveCritters()
  assert.equal(c.tier, 1, 'a recovered critter comes back cross')
  g.player.x = 40
  g.player.y = 112
  other.kicked = true
  other.y = 1000
  g.update(emptyInput())
  assert.ok(c.rush, 'the last critter of a phase sprints')
  assert.equal(c.tier, 2, 'and turns furious')
}

// --- shell knights, fleas, lint moths and sock puppets --------------------------------------

{
  const g = fresh()
  const knight = critter('knight', 120, 244)
  g.critters = [knight]
  g.bumpAt(120, 244)
  assert.equal(knight.armored, false, 'the first bump knocks the armour off')
  assert.equal(knight.flipped, 0)
  knight.onGround = true
  g.bumpAt(120, 244)
  assert.ok(knight.flipped > 0, 'the second bump flips the bare knight')

  const flea = critter('flea', 340, 244, { onGround: false })
  g.critters = [flea]
  g.bumpAt(340, 244)
  assert.equal(flea.flipped, 0, 'a flea in mid-hop shrugs off a bump')
  flea.onGround = true
  g.bumpAt(340, 244)
  assert.ok(flea.flipped > 0, 'a landed flea flips')

  const moth = critter('moth', 340, 244, { flying: true, onGround: true })
  g.critters = [moth]
  g.bumpAt(340, 244)
  assert.equal(moth.flipped, 0, 'a lint moth on the wing shrugs off a bump')
  moth.flying = false
  g.bumpAt(340, 244)
  assert.ok(moth.flipped > 0, 'a resting moth flips')

  const puppet = critter('puppet', 340, 244)
  g.critters = [puppet]
  g.bumpAt(340, 244)
  const socks = g.critters.filter((c) => c.kind === 'sock')
  assert.equal(socks.length, 2, 'a sock puppet comes apart into two socks')
  assert.ok(
    socks.every((s) => s.flipped > 0),
    'both socks land flipped',
  )
  assert.ok(puppet.kicked, 'the puppet itself is gone')
}

// --- kick bowling and chains ----------------------------------------------------------------

{
  const g = fresh()
  const first = critter('crawler', 200, 310, { flipped: 500 })
  const second = critter('crawler', 240, 310, { flipped: 500 })
  g.critters = [first, second]
  Object.assign(g.player, { x: 192, y: 310, face: 1, onGround: true })
  const before = g.score
  const wallet = g.wallet
  for (let t = 0; t < 30; t++) g.update(emptyInput())
  assert.ok(first.kicked, 'touching a flipped critter kicks it')
  assert.ok(
    second.kicked,
    'the kicked shell bowls the next flipped critter along',
  )
  assert.equal(g.chain, 2)
  assert.ok(
    g.score - before >= CHAIN_POINTS[0] + CHAIN_POINTS[1],
    'the second kick in the chain pays more',
  )
  assert.ok(
    g.coins.length + (g.wallet - wallet) >= 2,
    'every kick sends a coin out of a pipe',
  )

  const g2 = fresh()
  const shell = critter('crawler', 200, 310, { flipped: 500 })
  const upright = critter('crawler', 236, 310, { dir: 1 })
  g2.critters = [shell, upright]
  Object.assign(g2.player, { x: 192, y: 310, face: 1, onGround: true })
  for (let t = 0; t < 30; t++) g2.update(emptyInput())
  assert.ok(
    upright.flipped > 0 && !upright.kicked,
    'a bowled shell flips an upright critter',
  )
}

// --- embers -------------------------------------------------------------------------------

{
  const g = fresh()
  g.embers = [{ kind: 'spark', x: 120, y: 236, life: 500, tell: 0 }]
  g.bumpAt(120, 244)
  assert.equal(
    g.embers[0]!.life,
    0,
    'bumping the ledge under an ember snuffs it',
  )
  const lingering = fresh()
  lingering.level = 2
  lingering.startPhase(2)
  lingering.queue = ['crawler']
  lingering.invuln = 100_000
  let lurked = false
  for (let t = 0; t < 60 * 45 && !lurked; t++) {
    lingering.update(emptyInput())
    lurked = lingering.embers.some((e) => e.kind === 'lurker')
  }
  assert.ok(lurked, 'a lurker ember comes for a pal who stands still')
}

// --- the tool belt --------------------------------------------------------------------------

{
  const g = fresh()
  g.critters = [critter('crawler', 100, 244), critter('crawler', 160, 244)]
  g.tool = { kind: 'wrench', ticks: 600, charges: 0 }
  g.bumpAt(130, 244)
  assert.ok(
    g.critters.every((c) => c.flipped > 0),
    'the Wide Wrench bumps a whole stretch of ledge',
  )

  const wand = fresh()
  const walker = critter('crawler', 230, 310, { dir: -1 })
  wand.critters = [walker, critter('crawler', 40, 112)]
  Object.assign(wand.player, { x: 200, y: 310, face: 1, onGround: true })
  wand.tool = { kind: 'wand', ticks: 600, charges: 3 }
  wand.update(press('b'))
  assert.equal(wand.tool?.charges, 2)
  for (let t = 0; t < 20 && walker.trapped === 0; t++) wand.update(emptyInput())
  assert.ok(walker.trapped > 0, 'a wand bubble traps a walker')

  const kicker = fresh()
  kicker.kicks = 5
  kicker.critters = [
    critter('crawler', 200, 310, { flipped: 500 }),
    critter('crawler', 40, 112),
  ]
  Object.assign(kicker.player, { x: 192, y: 310, face: 1, onGround: true })
  for (let t = 0; t < 5; t++) kicker.update(emptyInput())
  assert.equal(kicker.pickups.length, 1, 'the sixth kick rolls out a tool')
}

// --- district boards: vines sag, the lift carries, soap blows bubbles ------------------------

{
  const g = fresh(3, 1)
  assert.equal(g.district.id, 'greenhouse')
  g.critters = [critter('crawler', 40, 112)]
  const vine = g.boardNow.find((s) => s.kind === 'vine' && s.y === 244)!
  Object.assign(g.player, {
    x: vine.x0 + 30,
    y: 244,
    vx: 0,
    vy: 0,
    onGround: true,
  })
  let fell = false
  for (let t = 0; t < 200 && !fell; t++) {
    g.update(emptyInput())
    fell = g.player.y > 250
  }
  assert.ok(fell, 'a pal who lingers on a vine drops through it')

  const lifted = fresh(3, 1)
  lifted.critters = [critter('crawler', 40, 112)]
  lifted.refreshBoard()
  const lift = lifted.boardNow.at(-1)!
  Object.assign(lifted.player, {
    x: (lift.x0 + lift.x1) / 2,
    y: lift.y,
    vx: 0,
    vy: 0,
    onGround: true,
  })
  const x0 = lifted.player.x
  for (let t = 0; t < 90; t++) lifted.update(emptyInput())
  assert.ok(Math.abs(lifted.player.x - x0) > 5, 'the lift carries its rider')
  assert.equal(lifted.player.y, lift.y, 'and the rider stays on it')

  const soapy = fresh(3, 2)
  assert.equal(soapy.district.id, 'suds')
  soapy.bumpAt(100, 244)
  assert.ok(
    soapy.bubbles.some((b) => b.vy < 0),
    'a bump under a soapy ledge blows a bubble up',
  )
}

// --- special phases and golden valves ---------------------------------------------------------

{
  // First Fix: knock all three leaky joints shut for the valve.
  const g = fresh()
  for (let i = 1; i < SPECIAL_PHASE; i++) g.advance()
  g.cardTicks = 0
  g.invuln = 100_000
  assert.equal(g.leaks.length, 3)
  for (const leak of [...g.leaks]) g.bumpAt(leak.x, leak.y)
  assert.ok(g.leaks.every((l) => l.sealed))
  g.queue = []
  g.critters = [critter('crawler', 200, 310, { kicked: true, y: 1000 })]
  Object.assign(g.player, { x: 40, y: 112, onGround: true })
  g.update(emptyInput())
  assert.ok(
    g.valves.includes('rooftop'),
    'a perfect First Fix earns the golden valve',
  )

  // Seedling Rescue: touch to rescue; a walker tramples one.
  const s = fresh(3, 1)
  for (let i = 1; i < SPECIAL_PHASE; i++) s.advance()
  s.cardTicks = 0
  s.invuln = 100_000
  s.queue = []
  const pot = s.seedlings[0]!
  const doomed = s.seedlings[1]!
  s.critters = [critter('crawler', doomed.x - 4, doomed.y, { dir: 1 })]
  Object.assign(s.player, { x: pot.x, y: pot.y, vx: 0, vy: 0, onGround: true })
  s.update(emptyInput())
  assert.equal(pot.state, 'rescued', 'touching a seedling rescues it')
  assert.equal(doomed.state, 'trampled', 'a walker tramples a seedling')

  // Lost Socks: a matching pair counts; an odd sock replaces the one held.
  const k = fresh(3, 2)
  for (let i = 1; i < SPECIAL_PHASE; i++) k.advance()
  k.cardTicks = 0
  k.invuln = 100_000
  k.queue = []
  k.critters = [critter('crawler', 40, 112)]
  Object.assign(k.player, { x: 200, y: 310, vx: 0, vy: 0, onGround: true })
  k.socks = [
    { x: 200, y: 304, vx: 0, vy: 0, colour: 'pink', life: 500 } as never,
  ]
  k.update(emptyInput())
  assert.equal(k.heldSock, 'pink')
  k.socks = [
    { x: 200, y: 304, vx: 0, vy: 0, colour: 'pink', life: 500 } as never,
  ]
  k.update(emptyInput())
  assert.equal(k.pairs, 1, 'two pink socks make a pair')
  assert.equal(k.heldSock, null)
}

// --- bonus twists ---------------------------------------------------------------------------

{
  for (const [index, twist] of [
    [1, 'sprinkler'],
    [2, 'bubbles'],
  ] as const) {
    const g = fresh(3, index)
    while (g.bonusRound === 0) g.advance()
    g.cardTicks = 0
    assert.equal(g.bonusTotal, 24, `${twist}: 24 coins fed in`)
    for (let t = 0; t < 80; t++) g.update(emptyInput())
    const drifting = g.coins.filter((c) => c.float !== undefined)
    assert.ok(drifting.length > 0, `${twist}: coins drift in`)
    if (twist === 'bubbles')
      assert.ok(
        drifting.every((c) => c.float! < 0),
        'bubble coins rise',
      )
  }
}

// --- the Big Shell ---------------------------------------------------------------------------

{
  const g = fresh(3, 2)
  while (!g.boss) g.advance()
  g.cardTicks = 0
  g.invuln = 100_000
  const b = g.boss!
  // Let it land.
  for (let t = 0; t < 200 && b.state === 'leap'; t++) g.update(emptyInput())
  assert.equal(b.state, 'walk', 'the Big Shell lands on a ledge')
  Object.assign(g.player, { x: 40, y: 310, onGround: true })
  for (let i = 0; i < 3; i++) g.bumpAt(b.x, b.y)
  assert.equal(b.state, 'tipped', 'three bumps under it tip it over')
  g.invuln = 0
  Object.assign(g.player, { x: b.x, y: b.y, vx: 0, vy: 0, onGround: true })
  g.update(emptyInput())
  assert.equal(b.hp, 2, 'a kick to the tipped shell takes a hit point')
  // Two more tip-and-kicks beat it.
  for (let round = 0; round < 2; round++) {
    b.state = 'walk'
    b.y = b.seg.y
    for (let i = 0; i < 3; i++) g.bumpAt(b.x, b.y)
    g.invuln = 0
    Object.assign(g.player, { x: b.x, y: b.y, vx: 0, vy: 0, onGround: true })
    g.update(emptyInput())
  }
  assert.equal(g.boss, null, 'three kicks beat the Big Shell')
  assert.ok(g.phaseDelay > 0, 'and the run moves on')
}

// --- the Workshop ---------------------------------------------------------------------------

{
  const g = fresh()
  while (!g.workshop) g.advance()
  g.wallet = 100
  const lives = g.lives
  g.workshop!.t = 30
  g.workshop!.cursor = SHOP_ITEMS.findIndex((s) => s.item === 'pal')
  g.update(press('a'))
  assert.equal(g.lives, lives + 1, 'an extra pal')
  assert.ok(g.wallet < 100, 'paid for in coins')
  const left = g.wallet
  g.update(press('a'))
  assert.equal(g.wallet, left, 'each item once per visit')
  g.workshop!.cursor = SHOP_ITEMS.findIndex((s) => s.item === 'kind')
  g.update(press('a'))
  assert.equal(g.kindMax, 4)
  g.workshop!.cursor = SHOP_ITEMS.findIndex((s) => s.item === 'done')
  g.update(press('a'))
  assert.equal(
    g.kindBlockUses,
    4,
    'the next district starts with four KIND charges',
  )
}

// --- the Swing Shift ----------------------------------------------------------------------------

function swing(index: number, step = 0): Inner {
  const g = fresh(3, index)
  for (let i = 0; i < step; i++) g.advance()
  g.cardTicks = 0
  g.invuln = 100_000
  g.queue = []
  g.critters = [critter('crawler', 40, 112)]
  g.embers = []
  return g
}

{
  // Ice: a pal coasts much further before stopping.
  const slide = (index: number) => {
    const g = swing(index)
    g.icicles = []
    Object.assign(g.player, {
      x: 40,
      y: 244,
      vx: 2.1,
      vy: 0,
      onGround: true,
      face: 1,
    })
    const x0 = g.player.x
    for (let t = 0; t < 60; t++) g.update(emptyInput())
    return g.player.x - x0
  }
  assert.ok(slide(3) > slide(0) * 2, 'Cold Storage ice: a pal slides on')

  // Frost bots: they ice the ledge they walk, and one bump shatters them.
  const g = swing(3)
  g.icicles = []
  const frost = critter('frost', 100, 244, { dir: 1 })
  g.critters.push(frost)
  for (let t = 0; t < 5; t++) g.update(emptyInput())
  assert.ok(
    [...g.frozen.values()].some((v) => v > 0),
    'a frost bot ices its ledge',
  )
  g.bumpAt(frost.x, 244)
  assert.ok(frost.kicked, 'one bump shatters a frost bot')

  // Snowballs: shatter while small, shrug off a bump once grown.
  const small = critter('snowball', 120, 244, { size: 7 })
  const big = critter('snowball', 380, 244, { size: 13 })
  g.critters = [small, big, critter('crawler', 40, 112)]
  g.bumpAt(120, 244)
  g.bumpAt(380, 244)
  assert.ok(small.kicked, 'a small snowball shatters')
  assert.ok(!big.kicked, 'a big one is too big')
}

{
  // Gear bugs only flip while paused.
  const g = swing(5)
  const bug = critter('gearbug', 60, 244, { mode: 0 })
  g.critters = [bug]
  g.bumpAt(60, 244)
  assert.equal(bug.flipped, 0, 'a winding gear bug shrugs off a bump')
  bug.mode = 1
  bug.onGround = true
  g.bumpAt(60, 244)
  assert.ok(bug.flipped > 0, 'a paused gear bug flips')
}

{
  // Icicles grow, shake, fall; a falling one fells a pal; a bump shatters one early.
  const g = swing(3)
  const ice = g.icicles[0]!
  assert.ok(ice, 'Cold Storage grows icicles')
  ice.grow = 410
  for (let t = 0; t < 20; t++) g.update(emptyInput())
  assert.equal(ice.state, 'shake', 'a grown icicle shakes first (the tell)')
  for (let t = 0; t < 80 && ice.state === 'shake'; t++) g.update(emptyInput())
  assert.equal(ice.state, 'fall')
  g.invuln = 0
  Object.assign(g.player, {
    x: ice.x,
    y: ice.y + 66,
    vx: 0,
    vy: 0,
    onGround: true,
  })
  const lives = g.lives
  for (let t = 0; t < 60 && g.lives === lives; t++) g.update(emptyInput())
  assert.equal(g.lives, lives - 1, 'a falling icicle fells a pal underneath')

  const h = swing(3)
  const early = h.icicles[1]!
  early.grow = 300
  h.bumpAt(early.x, early.y)
  assert.equal(early.state, 'gone', 'a bump shatters a growing icicle')
}

{
  // Boiler Works: vents launch, the crumble ledge gives way, embers come thicker.
  const g = swing(4)
  const vent = boiler!.vents![0]!
  Object.assign(g.player, {
    x: vent.x,
    y: vent.y,
    vx: 0,
    vy: 0,
    onGround: true,
  })
  let launched = false
  for (let t = 0; t < 220 && !launched; t++) {
    Object.assign(g.player, { x: vent.x })
    g.update(emptyInput())
    launched = g.player.vy < -4
  }
  assert.ok(launched, 'a vent puff throws a pal upward')

  const c = swing(4)
  const crumble = boiler!.segments.find((s) => s.kind === 'crumble')!
  for (let i = 0; i < 3; i++) {
    Object.assign(c.player, {
      x: (crumble.x0 + crumble.x1) / 2,
      y: crumble.y - 20,
      vx: 0,
      vy: 1,
      onGround: false,
    })
    for (let t = 0; t < 20; t++) c.update(emptyInput())
  }
  assert.ok(
    (c.crumbles.get(crumble)?.down ?? 0) > 0,
    'the crumble ledge falls after three landings',
  )
}

{
  // The clock: conveyors carry riders, the cuckoo comes out on the hour.
  const g = swing(5)
  const belt = clock!.segments.find((s) => s.kind === 'conveyor')!
  Object.assign(g.player, {
    x: belt.x0 + 30,
    y: belt.y,
    vx: 0,
    vy: 0,
    onGround: true,
  })
  const x0 = g.player.x
  for (let t = 0; t < 60; t++) g.update(emptyInput())
  assert.ok(Math.abs(g.player.x - x0) > 15, 'a conveyor carries a standing pal')
  let cuckoo = false
  for (let t = 0; t < 60 * 15 && !cuckoo; t++) {
    g.update(emptyInput())
    cuckoo = g.embers.some((e) => e.kind === 'cuckoo')
  }
  assert.ok(cuckoo, 'the cuckoo swoops out of the clock')
}

{
  // Thaw Run: three bumps free a pal; Pressure Valves: bumps vent, neglect bursts.
  const g = swing(3, SPECIAL_PHASE - 1)
  assert.equal(g.blocks.length, 3)
  for (const b of g.blocks) for (let i = 0; i < 3; i++) g.bumpAt(b.x, b.y)
  assert.ok(
    g.blocks.every((b) => b.freed),
    'three bumps free each frozen pal',
  )

  const p = swing(4, SPECIAL_PHASE - 1)
  assert.equal(p.gauges.length, 4)
  p.gauges[0]!.p = 0.9
  p.bumpAt(p.gauges[0]!.x, p.gauges[0]!.y)
  assert.equal(p.gauges[0]!.p, 0, 'a bump vents a gauge')
  p.gauges[1]!.p = 0.999
  p.update(emptyInput())
  assert.ok(p.gauges[1]!.burst, 'a neglected gauge bursts')

  // Valve Routing: a wheel switches the pipe critters use.
  const r = swing(5, SPECIAL_PHASE - 1)
  assert.equal(r.route, 0)
  r.bumpAt(r.wheels[0]!.x, r.wheels[0]!.y)
  assert.equal(r.route, 1)
  r.queue = ['crawler']
  r.release()
  assert.ok(r.critters.at(-1)!.x > 400, 'released through the right pipe')
}

{
  // The Thermostat: bump the ledge its needle lights while it glows.
  const g = fresh(3, 5)
  while (!g.thermo) g.advance()
  g.cardTicks = 0
  g.invuln = 100_000
  const t = g.thermo!
  assert.equal(t.hp, 9)
  const seg = g.thermoLedges()[t.target]!
  t.targetT = 200
  g.bumpAt((seg.x0 + seg.x1) / 2, seg.y)
  assert.equal(t.hp, 9, 'a bump before the needle glows does nothing')
  t.targetT = 10
  g.bumpAt((seg.x0 + seg.x1) / 2, seg.y)
  assert.equal(t.hp, 8, 'a bump under the lit ledge lands')
  for (let i = 0; i < 8; i++) {
    const th = g.thermo!
    th.targetT = 10
    const s2 = g.thermoLedges()[th.target]!
    g.bumpAt((s2.x0 + s2.x1) / 2, s2.y)
  }
  assert.equal(g.thermo, null, 'nine hits fix the Thermostat')
  assert.ok(g.phaseDelay > 0)
}

{
  // Swing Shift bonus twists.
  const ice = fresh(3, 3)
  while (ice.bonusRound === 0) ice.advance()
  assert.ok(ice.coins.length > 10, 'ice bonus: coins on every ledge')
  const steam = fresh(3, 4)
  while (steam.bonusRound === 0) steam.advance()
  steam.cardTicks = 0
  for (let t = 0; t < 40; t++) steam.update(emptyInput())
  assert.ok(
    steam.coins.some((c) => (c as unknown as { vy: number }).vy < 0),
    'steam bonus: coins thrown up from vents',
  )
  const gears = fresh(3, 5)
  while (gears.bonusRound === 0) gears.advance()
  gears.cardTicks = 0
  const rider = gears.coins.find((c) => (c as { ride?: unknown }).ride)!
  const rx = rider.x
  for (let t = 0; t < 40; t++) gears.update(emptyInput())
  assert.ok(rider.x !== rx, 'gears bonus: coins ride the gear ledges')
}

// --- the Night Shift ---------------------------------------------------------------------------

{
  // Flooded Mains: the tide rises and falls; underwater a pal is slow and floaty.
  const g = swing(6)
  const w = flooded!.water!
  g.phaseTicks = Math.round(w.period * 0.6)
  g.update(emptyInput())
  assert.ok(Math.abs(g.waterY - w.high) < 1, 'the tide comes in')
  g.phaseTicks = 1
  g.update(emptyInput())
  assert.ok(g.waterY >= w.low - 1, 'and goes out')

  // A flipped critter underwater bobs up and rights itself at the surface.
  const h = swing(6)
  h.phaseTicks = Math.round(w.period * 0.5) + 1
  const bob = critter('crawler', 120, 244, { flipped: 500 })
  h.critters = [bob, critter('crawler', 40, 112)]
  const y0 = bob.y
  for (let t = 0; t < 30; t++) h.update(emptyInput())
  assert.ok(bob.y < y0 - 5, 'a flipped critter floats up off its ledge')
  for (let t = 0; t < 120 && bob.flipped > 0; t++) h.update(emptyInput())
  assert.equal(bob.flipped, 0, 'and rights itself at the surface')
}

{
  // Pump Station: 1-2-3 in order drains the flood; out of order starts over.
  const g = swing(6, SPECIAL_PHASE - 1)
  const spots = flooded!.spots!
  g.bumpAt(spots[1]!.x, spots[1]!.y)
  assert.equal(g.pumpNext, 0, 'out of order does nothing')
  g.bumpAt(spots[0]!.x, spots[0]!.y)
  g.bumpAt(spots[2]!.x, spots[2]!.y)
  assert.equal(g.pumpNext, 0, 'a wrong button starts over')
  for (const spot of spots) g.bumpAt(spot.x, spot.y)
  assert.ok(g.pumpsDone, 'in order, the pumps come on')
  const late = swing(6, SPECIAL_PHASE - 1)
  late.phaseTicks = 60 * 90
  late.update(emptyInput())
  assert.ok(late.flooded, 'left too long, the board floods')
}

{
  // Eels strike from the top pipes; a bump on the ledge by the pipe sends one back.
  const g = swing(6)
  g.eel = { side: 0, state: 'hold', t: 50, len: 96 }
  g.bumpAt(50, 112)
  assert.equal(g.eel!.state, 'back', 'a bump by the pipe sends the eel back')
  const h = swing(6)
  h.invuln = 0
  h.eel = { side: 0, state: 'hold', t: 50, len: 96 }
  Object.assign(h.player, { x: 60, y: 112, vx: 0, vy: 0, onGround: true })
  const lives = h.lives
  h.update(emptyInput())
  assert.equal(h.lives, lives - 1, 'an eel strike fells a pal on the top ledge')

  // Jellies pop into bubble platforms.
  const j = swing(6)
  j.jellies = [{ x: 120, y: 230, t: 5 }]
  j.bumpAt(120, 244)
  assert.equal(j.jellies.length, 0)
  assert.equal(j.platforms.length, 1, 'a popped jelly leaves a bubble platform')
}

{
  // Storm Drain: lamps relit by bumps (Lights Out), beetles grease ledges, mimics bite.
  const g = swing(7, SPECIAL_PHASE - 1)
  assert.ok(
    g.lamps.every((l) => !l.lit),
    'Lights Out starts in the dark',
  )
  for (const lamp of [...g.lamps]) g.bumpAt(lamp.x, lamp.y)
  assert.ok(
    g.lamps.every((l) => l.lit),
    'a bump from below relights a lamp',
  )

  const b = swing(7)
  const beetle = critter('beetle', 100, 244, { dir: 1 })
  b.critters = [beetle, critter('crawler', 40, 112)]
  for (let t = 0; t < 5; t++) b.update(emptyInput())
  assert.ok(b.slicks.size > 0, 'a grease beetle leaves a slick')
  b.bumpAt(beetle.x, 244)
  const x0 = beetle.x
  for (let t = 0; t < 20; t++) b.update(emptyInput())
  assert.ok(
    beetle.flipped > 0 && Math.abs(beetle.x - x0) > 3,
    'a flipped beetle skids along',
  )

  const m = swing(7, 1)
  m.invuln = 0
  m.mimics = [{ x: 200, y: 310, t: 0, stunned: 0 }]
  Object.assign(m.player, { x: 200, y: 310, vx: 0, vy: 0, onGround: true })
  const lives = m.lives
  m.update(emptyInput())
  assert.equal(m.lives, lives - 1, 'grab a mimic coin and it bites')
  const n = swing(7, 1)
  n.mimics = [{ x: 120, y: 244, t: 0, stunned: 0 }]
  n.bumpAt(120, 244)
  assert.equal(n.mimics.length, 0, 'a bump from below clears a mimic')
}

{
  // The Clog King: crack its six plates, kick six of its critters, kick the plates into its core,
  // then race the flush to the roof hatch.
  const g = fresh(3, 7)
  while (!g.king) g.advance()
  g.cardTicks = 0
  g.invuln = 100_000
  const k = g.king!
  for (const seg of k.segs) Object.assign(seg, { x: seg.x, y: 244 })
  k.segs.forEach((seg, i) => Object.assign(seg, { x: 40 + i * 20 }))
  for (const seg of [...k.segs]) {
    g.bumpAt(seg.x, 244)
    assert.ok(!seg.cracked, 'the first bump only dents a plate')
    g.bumpAt(seg.x, 244)
  }
  assert.ok(
    k.segs.every((s) => s.cracked),
    'bumps crack every plate',
  )
  assert.equal(k.phase, 2, 'then it sheds critters')
  for (let i = 0; i < 6; i++)
    g.kick(critter('crawler', 300, 310, { flipped: 100 }), 1)
  g.update(emptyInput())
  assert.equal(k.phase, 3, 'six kicks and it coils round the main')
  for (const plate of k.plates) {
    Object.assign(g.player, {
      x: plate.x,
      y: plate.y,
      vx: 0,
      vy: 0,
      onGround: true,
    })
    g.update(emptyInput())
  }
  for (let t = 0; t < 120 && g.king; t++) g.update(emptyInput())
  assert.equal(g.king, null, 'six plates into the core beat the Clog King')
  assert.ok(g.flush > 0, 'and the flush begins')
  Object.assign(g.player, { x: 40, y: 112, vx: 0, vy: 0, onGround: true })
  g.update(emptyInput())
  assert.equal(g.flush, 0, 'reaching the hatch ends the flush')
  assert.ok(g.phaseDelay > 0)
}

{
  // The ending, then Night Shift Overtime; with all eight valves, the Golden Main first.
  const g = fresh(3, 7)
  while (
    g.stepIndex < districtSteps(storm!).findIndex((s) => s.kind === 'ending')
  )
    g.advance()
  assert.ok(
    g.ending && !g.ending.trueEnding,
    'the Clog King leads to the ending',
  )
  g.ending!.t = 60 * 17
  g.update(emptyInput())
  assert.equal(g.ending, null)
  assert.ok(g.workshop, 'then the Workshop, and Overtime')

  const gold = fresh(3, 7)
  gold.valves = DISTRICTS.map((d) => d.id)
  while (!gold.inGolden) gold.advance()
  assert.equal(
    gold.district.id,
    'golden',
    'all eight valves open the Golden Main',
  )
  while (!gold.ending) gold.advance()
  assert.ok(gold.ending!.trueEnding, 'the Golden Main ends in the true ending')
}

{
  // Saves: each district start is kept; a new game offers to continue.
  const g = fresh(3, 4)
  assert.equal(g.save?.district, 4, 'the run is saved at the district start')
  const resumed = create({
    rng: mulberry32(9),
    sound: quiet,
    demo: false,
    hiScore: 0,
    resume: g.save,
  }) as unknown as Inner
  assert.ok(resumed.offer, 'a saved run is offered')
  resumed.update(press('a'))
  assert.equal(resumed.district.id, 'boiler', 'CONTINUE picks the run back up')
  const fresher = create({
    rng: mulberry32(9),
    sound: quiet,
    demo: false,
    hiScore: 0,
    resume: g.save,
  }) as unknown as Inner
  fresher.update(press('b'))
  assert.equal(fresher.district.id, 'rooftop', 'NEW RUN starts over')
  const demo = create({
    rng: mulberry32(9),
    sound: quiet,
    demo: true,
    hiScore: 0,
    resume: g.save,
  }) as unknown as Inner
  assert.equal(demo.offer, null, 'demos never offer a save')
}

// --- two pals, co-op, Versus, Overtime, Time Trial and medals (slice 5) ----------------------

function seated(players: number, resume?: unknown): Inner {
  return create({
    rng: mulberry32(5),
    sound: quiet,
    demo: false,
    hiScore: 0,
    players,
    resume,
  }) as unknown as Inner
}

/** Pick a mode on the menu: rows of mode, pal (solo) and district, then A. */
function choose(
  g: Inner,
  mode: number,
  opts: { pal?: number; district?: number } = {},
) {
  assert.ok(g.menu, 'a real game opens on the mode menu')
  for (let i = 0; i < mode; i++) g.update(press('right'))
  if (opts.pal) {
    g.update(press('down'))
    g.update(press('right'))
    g.update(press('up'))
  }
  if (opts.district) {
    const rows = g.pals.length > 1 ? 1 : 2
    for (let i = 0; i < rows; i++) g.update(press('down'))
    for (let i = 0; i < opts.district; i++) g.update(press('right'))
  }
  g.update(press('a'))
  assert.equal(g.menu, null)
  g.cardTicks = 0
}

{
  // The pink pal jumps higher and floats; the teal pal's bump reaches further.
  const apex = (pal: number) => {
    const g = game(3)
    g.pals[0]!.kind = pal ? 'pink' : 'teal'
    g.cardTicks = 0
    g.queue = []
    g.critters = [critter('crawler', 40, 112)]
    g.invuln = 100_000
    // From the top ledge, with nothing overhead.
    Object.assign(g.player, { x: 100, y: 112, vx: 0, vy: 0, onGround: true })
    g.update(press('a'))
    let top = 112
    let air = 0
    for (let t = 0; t < 80 && !g.player.onGround; t++) {
      g.update(emptyInput())
      top = Math.min(top, g.player.y)
      air++
    }
    return { top, air: 112 - top, hang: air }
  }
  const teal = apex(0)
  const pink = apex(1)
  assert.ok(
    pink.air > teal.air + 4,
    `pink jumps higher (${pink.air} vs ${teal.air})`,
  )
  const t = game(3)
  const reachTeal = t.bumpReach()
  t.pals[0]!.kind = 'pink'
  assert.ok(reachTeal > t.bumpReach(), 'teal bumps reach further')

  // Solo: the pal is picked on the menu.
  const solo = seated(1)
  choose(solo, 0, { pal: 1 })
  assert.equal(solo.pals.length, 1)
  assert.equal(
    solo.pals[0]!.kind,
    'pink',
    'a solo player can pick the pink pal',
  )
  assert.equal(solo.mode, 'campaign')
}

{
  // Same-device co-op: two pals, each on its own player's frame, sharing a pool of pals.
  const g = seated(2)
  assert.equal(g.pals.length, 2)
  assert.deepEqual(
    g.pals.map((p) => p.kind),
    ['teal', 'pink'],
  )
  assert.ok(g.lives >= 2, 'two seated, two in play')
  choose(g, 0)
  g.queue = []
  g.critters = [critter('crawler', 40, 112)]
  g.embers = []
  for (const p of g.pals) p.invuln = 100_000
  const [teal, pink] = g.pals as [Inner['pals'][0], Inner['pals'][0]]
  const x0 = [teal.body.x, pink.body.x]
  assert.ok(x0[0]! < x0[1]!, 'the pals start either side of the middle')
  const right = emptyInput()
  right.held.right = true
  const left = emptyInput()
  left.held.left = true
  for (let t = 0; t < 20; t++) g.update(right, [right, left])
  assert.ok(teal.body.x > x0[0]!, 'player 1 steers the teal pal')
  assert.ok(pink.body.x < x0[1]!, 'player 2 steers the pink pal')

  // A felled pal waits out its respawn while the other plays on.
  const lives = g.lives
  g.cur = 1
  g.loseLife()
  g.cur = 0
  assert.equal(g.lives, lives - 1, 'pals come from one shared pool')
  assert.ok(teal.alive && !pink.alive)
  const before = teal.body.x
  for (let t = 0; t < 10; t++) g.update(right, [right, left])
  assert.ok(teal.body.x > before, 'the board keeps going while one pal is down')
  for (let t = 0; t < 120; t++)
    g.update(emptyInput(), [emptyInput(), emptyInput()])
  assert.ok(pink.alive, 'and the felled pal comes back')

  // A bump under the other pal bonks it, dizzy for a moment.
  Object.assign(pink.body, { x: 120, y: 244, vx: 0, vy: 0, onGround: true })
  g.cur = 0
  g.bumpAt(120, 244)
  assert.ok(pink.stun > 0 && pink.body.vy < 0, 'a bump under a pal bonks it')
  const sx = pink.body.x
  g.update(emptyInput(), [emptyInput(), left])
  assert.equal(pink.body.x, sx, 'a dizzy pal does not steer')

  // Out of pals with one pal still up: that pal plays on alone; then the game ends.
  const end = seated(2)
  choose(end, 0)
  end.queue = []
  end.critters = [critter('crawler', 40, 112)]
  end.embers = []
  end.pals[0]!.invuln = 100_000
  end.lives = 1
  end.cur = 1
  end.loseLife()
  assert.equal(end.lives, 0)
  for (let t = 0; t < 200; t++)
    end.update(emptyInput(), [emptyInput(), emptyInput()])
  assert.ok(!end.pals[1]!.alive, 'with the pool empty a felled pal stays out')
  assert.ok(!end.over, 'but the other pal is still playing')
  end.cur = 0
  end.pals[0]!.invuln = 0
  end.loseLife()
  for (let t = 0; t < 200 && !end.over; t++)
    end.update(emptyInput(), [emptyInput(), emptyInput()])
  assert.ok(end.over, 'with both pals out, the game is over')
}

{
  // Versus: one district, each pal's own tally, steals and falls; the winner is called.
  const solo = seated(1)
  assert.notEqual(
    (solo as unknown as { modes(): Array<{ id: string }> })
      .modes()
      .slice(-1)[0]!.id,
    'versus',
    'Versus needs two players',
  )
  const g = seated(2)
  choose(g, 3)
  assert.equal(g.mode, 'versus')
  assert.ok(
    g.steps.every((s) => s.kind === 'phase' || s.kind === 'boss'),
    'a match is the board: no Workshop, no bonus',
  )
  g.queue = []
  g.embers = []
  const c = critter('crawler', 200, 310)
  g.critters = [c, critter('crawler', 40, 112)]
  g.cur = 0
  g.bumpAt(200, 310)
  assert.ok(c.flipped > 0)
  const pinkBefore = g.pals[1]!.points
  g.cur = 1
  g.kick(c, 1)
  g.cur = 0
  assert.ok(
    g.pals[1]!.points >= pinkBefore + 500 + CHAIN_POINTS[0]!,
    'kicking a critter the other pal flipped steals it',
  )
  const lives = g.lives
  g.pals[1]!.points = 2000
  g.cur = 1
  g.loseLife()
  g.cur = 0
  assert.equal(g.lives, lives, 'Versus never runs out of pals')
  assert.equal(g.pals[1]!.points, 500, 'a fall costs points instead')
  g.pals[0]!.points = 9000
  while (!g.result) g.advance()
  assert.match(g.result!.lines[0]!, /TEAL PAL WINS/)
  for (let t = 0; t < 100; t++) g.update(press('a'))
  assert.ok(g.over, 'the result card ends the match')
}

{
  // Overtime: an endless score attack from a lap up, with no Workshop or endings.
  const g = seated(1)
  choose(g, 1)
  assert.equal(g.mode, 'overtime')
  assert.equal(g.lap, 1, 'Overtime starts a lap harder')
  assert.equal(g.level, 1)
  assert.ok(g.steps.every((s) => s.kind !== 'workshop' && s.kind !== 'ending'))
  for (let i = 0; i < 80; i++) g.advance()
  assert.ok(!g.result && !g.workshop, 'it never stops for a break')
  assert.equal(g.save?.district ?? 0, 0, 'and it never moves the campaign save')
}

{
  // Time Trial: districts the campaign has reached; the clock runs, a fall costs 5 seconds.
  const g = seated(1)
  g.reached = 3
  choose(g, 2, { district: 2 })
  assert.equal(g.mode, 'trial')
  assert.equal(g.district.id, DISTRICTS[2]!.id, 'the chosen district')
  const capped = seated(1)
  choose(capped, 2, { district: 5 })
  assert.equal(
    capped.district.id,
    'rooftop',
    'only reached districts can be picked',
  )
  g.queue = []
  g.critters = [critter('crawler', 40, 112)]
  g.embers = []
  g.invuln = 100_000
  for (let t = 0; t < 60; t++) g.update(emptyInput())
  assert.equal(g.trialTicks, 60, 'the clock runs while the pal plays')
  const lives = g.lives
  g.loseLife()
  assert.equal(g.lives, lives)
  assert.equal(g.trialTicks, 60 + 300)
  while (!g.result) g.advance()
  assert.match(g.result!.lines[0]!, /^TIME 0:06$/)
  assert.equal(g.times[DISTRICTS[2]!.id], 360, 'the best time is kept')
  const saved = readPipeSave(g.save)
  assert.equal(saved?.times?.[DISTRICTS[2]!.id], 360, 'in the save')
  const again = seated(1, g.save)
  assert.equal(again.times[DISTRICTS[2]!.id], 360, 'and read back')
}

{
  // Medals: Clean Sweep, Chain Master and Swift Fix per phase, saved, worth Workshop coins.
  const g = fresh(3, 0)
  g.phaseFell = false
  g.phaseChain = 4
  g.phaseCount = 5
  g.phaseTicks = 60 * 30
  const wallet = g.wallet
  g.awardMedals(1)
  assert.equal(g.medals['rooftop:1'], 7, 'all three medals')
  assert.equal(g.wallet, wallet + 6, 'two coins for each new medal')
  g.awardMedals(1)
  assert.equal(g.wallet, wallet + 6, 'a medal pays out once')
  g.phaseFell = true
  g.phaseChain = 1
  g.phaseTicks = 60 * 600
  g.awardMedals(2)
  assert.equal(g.medals['rooftop:2'], undefined, 'nothing earned, nothing kept')
  // Clearing a phase awards them for real; a fall spoils the Clean Sweep.
  const h = fresh(3, 0)
  h.critters = [critter('crawler', 200, 310, { flipped: 100 })]
  h.phaseChain = 0
  h.kick(h.critters[0]!, 1)
  for (let t = 0; t < 200 && !h.medals['rooftop:1']; t++) h.update(emptyInput())
  assert.equal(
    h.medals['rooftop:1']! & 1,
    1,
    'a phase cleared without a fall: Clean Sweep',
  )
  const saved = readPipeSave(h.save)
  assert.equal(
    saved?.medals?.['rooftop:1'],
    h.medals['rooftop:1'],
    'medals ride in the save',
  )
  const back = readPipeSave({
    ...h.save,
    medals: { 'rooftop:1': 99, 'nowhere:1': 1 },
  })
  assert.deepEqual(
    back?.medals,
    {},
    'a save with nonsense medals keeps none of them',
  )
  // B on the menu shows the medal board; B again goes back.
  const m = seated(1)
  m.update(press('b'))
  assert.ok(m.menu?.board)
  m.update(press('b'))
  assert.ok(m.menu && !m.menu.board)
}

// --- seeded runs repeat exactly, and the pilot keeps playing ---------------------------------

function pilotRun(seed: number, minutes: number, endless: boolean) {
  const g = game(seed)
  for (let t = 0; t < 60 * 60 * minutes && !g.over; t++) {
    if (endless) g.lives = 9
    g.update(g.demoInput())
  }
  return g
}
const a = pilotRun(4, 3, false)
const b = pilotRun(4, 3, false)
assert.equal(a.score, b.score, 'a seed replays tick for tick')
assert.equal(a.level, b.level)
for (const seed of [1, 2, 3]) {
  const run = pilotRun(seed, 12, true)
  assert.ok(
    run.level >= 7,
    `seed ${seed}: the pilot works through the districts (reached ${run.level})`,
  )
  assert.ok(Number.isFinite(run.score) && run.score > 0)
}
for (const seed of [1, 2, 3]) {
  const run = pilotRun(seed, 30, false)
  assert.ok(run.over, `seed ${seed}: a run without endless lives ends`)
}

console.log('verifyPipePals: ok')
