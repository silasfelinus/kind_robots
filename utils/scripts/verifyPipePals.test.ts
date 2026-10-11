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
  rosterFor,
  walkersMeet,
} from '../arcade/games/pipePals'
import type { Kind, ToolKind } from '../arcade/games/pipePals'
import {
  PHASES_PER_DISTRICT,
  SHOP_ITEMS,
  SPECIAL_PHASE,
  districtSteps,
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
  tick: number
  liftLefts: number[]
  release(): void
  thermoLedges(): Array<{ x0: number; x1: number; y: number }>
  update(input: InputFrame): void
  bumpAt(x: number, floorY: number): void
  moveCritters(): void
  startPhase(phase: number): void
  beginDistrict(index: number): void
  advance(): void
  demoInput(): InputFrame
  refreshBoard(): void
}

const quiet = { play: () => {} }
function game(seed = 3): Inner {
  return create({
    rng: mulberry32(seed),
    sound: quiet,
    demo: false,
    hiScore: 0,
  }) as unknown as Inner
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

const [rooftop, greenhouse, suds, cold, boiler, clock] = DISTRICTS
assert.equal(DISTRICTS.length, 6, 'the Day and Swing Shifts: six districts')
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
  for (const spot of [...(d.spots ?? []), ...(d.icicles ?? [])]) {
    assert.ok(
      d.segments.some(
        (s) => s.y === spot.y && s.x0 <= spot.x && s.x1 >= spot.x,
      ),
      `${d.id}: a ledge under the prop at ${spot.x},${spot.y}`,
    )
    if (d.spots?.includes(spot))
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
  assert.equal(steps.at(-2)!.kind, 'bonus')
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
