// Pipe Pals depth slice 1 (conductor kr-arcade/t-023): recovery tiers, the last-critter rush,
// kick chains, kick bowling, walkers turning round, the shell knight, spring fleas, ember
// hazards, the tool belt and the KIND block refill, each pinned on a staged board.
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import {
  CHAIN_POINTS,
  chainPoints,
  create,
  PIPE_ROSTER,
  rosterFor,
  walkersMeet,
} from '../arcade/games/pipePals'
import type { Kind, ToolKind } from '../arcade/games/pipePals'

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
}
type Inner = {
  score: number
  level: number
  lives: number
  over: boolean
  critters: Critter[]
  queue: Kind[]
  coins: unknown[]
  pickups: Array<{ x: number; y: number; kind: ToolKind; life: number }>
  embers: Array<{
    kind: string
    x: number
    y: number
    life: number
    tell: number
  }>
  bubbles: unknown[]
  tool: { kind: ToolKind; ticks: number; charges: number } | null
  chain: number
  kicks: number
  kindBlockUses: number
  invuln: number
  phaseDelay: number
  player: {
    x: number
    y: number
    vx: number
    vy: number
    face: number
    onGround: boolean
  }
  update(input: InputFrame): void
  bumpAt(x: number, floorY: number): void
  moveCritters(): void
  startPhase(phase: number): void
  demoInput(): InputFrame
}

function fresh(seed = 3): Inner {
  const game = create({
    rng: mulberry32(seed),
    sound: { play: () => {} },
    demo: false,
    hiScore: 0,
  }) as unknown as Inner
  // Stage the board by hand: no queue, no hazards, a pal who can't be hurt.
  game.queue = []
  game.critters = []
  game.embers = []
  game.invuln = 100_000
  return game
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
    ...extra,
  }
}

// --- pure rules ---------------------------------------------------------------------------

assert.deepEqual(rosterFor(1), { kinds: ['crawler'], debut: 'crawler' })
assert.equal(rosterFor(2).debut, 'flea', 'spring fleas debut in phase 2')
assert.equal(rosterFor(3).debut, 'crab')
assert.equal(rosterFor(4).debut, 'knight')
assert.equal(rosterFor(9).debut, null)
assert.deepEqual(
  rosterFor(9).kinds,
  PIPE_ROSTER.map((r) => r.kind),
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

// --- the newcomer leads its debut phase ---------------------------------------------------

{
  const game = create({
    rng: mulberry32(5),
    sound: { play: () => {} },
    demo: false,
    hiScore: 0,
  }) as unknown as Inner
  game.startPhase(4)
  assert.equal(game.queue[0], 'knight', 'phase 4 opens with a shell knight')
}

// --- walkers turn round when they meet ----------------------------------------------------

{
  const game = fresh()
  const a = critter('crawler', 200, 310, { dir: 1 })
  const b = critter('crawler', 214, 310, { dir: -1 })
  game.critters = [a, b]
  game.moveCritters()
  assert.equal(a.dir, -1)
  assert.equal(b.dir, 1)
}

// --- tiers and the last-critter rush -------------------------------------------------------

{
  const game = fresh()
  const c = critter('crawler', 200, 310, { flipped: 1 })
  const other = critter('crawler', 400, 244)
  game.critters = [c, other]
  game.moveCritters()
  assert.equal(c.tier, 1, 'a recovered critter comes back cross')
  game.player.x = 40
  game.player.y = 112
  other.kicked = true
  other.y = 1000
  game.update(emptyInput())
  assert.ok(c.rush, 'the last critter of a phase sprints')
  assert.equal(c.tier, 2, 'and turns furious')
}

// --- shell knights lose their armour first; fleas only flip when landed -------------------

{
  const game = fresh()
  const knight = critter('knight', 200, 244)
  game.critters = [knight]
  game.bumpAt(200, 244)
  assert.equal(knight.armored, false, 'the first bump knocks the armour off')
  assert.equal(knight.flipped, 0)
  knight.onGround = true
  game.bumpAt(200, 244)
  assert.ok(knight.flipped > 0, 'the second bump flips the bare knight')

  const flea = critter('flea', 300, 244, { onGround: false })
  game.critters = [flea]
  game.bumpAt(300, 244)
  assert.equal(flea.flipped, 0, 'a flea in mid-hop shrugs off a bump')
  flea.onGround = true
  game.bumpAt(300, 244)
  assert.ok(flea.flipped > 0, 'a landed flea flips')
}

// --- kick bowling and chains ----------------------------------------------------------------

{
  const game = fresh()
  // Two flipped crawlers in a row on the bottom floor; the pal kicks the first to the right.
  const first = critter('crawler', 200, 310, { flipped: 500 })
  const second = critter('crawler', 240, 310, { flipped: 500 })
  game.critters = [first, second]
  Object.assign(game.player, { x: 192, y: 310, face: 1, onGround: true })
  const before = game.score
  for (let t = 0; t < 30; t++) game.update(emptyInput())
  assert.ok(first.kicked, 'touching a flipped critter kicks it')
  assert.ok(
    second.kicked,
    'the kicked shell bowls the next flipped critter along',
  )
  assert.equal(game.chain, 2)
  assert.ok(
    game.score - before >= CHAIN_POINTS[0] + CHAIN_POINTS[1],
    'the second kick in the chain pays more',
  )
  assert.equal(
    game.coins.length >= 2,
    true,
    'every kick sends a coin out of a pipe',
  )

  // An upright critter stops the shell and is flipped by it.
  const game2 = fresh()
  const shell = critter('crawler', 200, 310, { flipped: 500 })
  const upright = critter('crawler', 236, 310, { dir: 1 })
  game2.critters = [shell, upright]
  Object.assign(game2.player, { x: 192, y: 310, face: 1, onGround: true })
  for (let t = 0; t < 30; t++) game2.update(emptyInput())
  assert.ok(
    upright.flipped > 0 && !upright.kicked,
    'a bowled shell flips an upright critter',
  )
}

// --- embers are snuffed from below ----------------------------------------------------------

{
  const game = fresh()
  game.embers = [{ kind: 'spark', x: 120, y: 236, life: 500, tell: 0 }]
  game.bumpAt(120, 244)
  assert.equal(
    game.embers[0]!.life,
    0,
    'bumping the ledge under an ember snuffs it',
  )
  // A pal who lingers is hunted by a lurker ember (phase 2 on).
  const lingering = fresh()
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
  const game = fresh()
  game.critters = [critter('crawler', 120, 244), critter('crawler', 180, 244)]
  game.tool = { kind: 'wrench', ticks: 600, charges: 0 }
  game.bumpAt(150, 244)
  assert.ok(
    game.critters.every((c) => c.flipped > 0),
    'the Wide Wrench bumps a whole stretch of ledge',
  )

  const wand = fresh()
  const walker = critter('crawler', 230, 310, { dir: -1 })
  wand.critters = [walker, critter('crawler', 40, 112)]
  Object.assign(wand.player, { x: 200, y: 310, face: 1, onGround: true })
  wand.tool = { kind: 'wand', ticks: 600, charges: 3 }
  const blow = emptyInput()
  blow.held.b = true
  blow.pressed.b = true
  wand.update(blow)
  assert.equal(wand.tool?.charges, 2)
  for (let t = 0; t < 20 && walker.trapped === 0; t++) wand.update(emptyInput())
  assert.ok(walker.trapped > 0, 'a wand bubble traps a walker')

  // Every sixth kick rolls a tool out of a pipe.
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

// --- the KIND block refills every fifth phase ----------------------------------------------

{
  const game = fresh()
  game.kindBlockUses = 0
  game.startPhase(6)
  assert.equal(game.kindBlockUses, 3)
  game.kindBlockUses = 1
  game.startPhase(7)
  assert.equal(game.kindBlockUses, 1)
}

// --- seeded runs repeat exactly, and the pilot keeps playing ---------------------------------

function pilotRun(seed: number, minutes: number, endless: boolean) {
  const game = create({
    rng: mulberry32(seed),
    sound: { play: () => {} },
    demo: false,
    hiScore: 0,
  }) as unknown as Inner
  for (let t = 0; t < 60 * 60 * minutes && !game.over; t++) {
    if (endless) game.lives = 9
    game.update(game.demoInput())
  }
  return game
}
const a = pilotRun(4, 3, false)
const b = pilotRun(4, 3, false)
assert.equal(a.score, b.score, 'a seed replays tick for tick')
assert.equal(a.level, b.level)
for (const seed of [1, 2, 3]) {
  const run = pilotRun(seed, 8, true)
  assert.ok(
    run.level >= 5,
    `seed ${seed}: the pilot clears phases (reached ${run.level})`,
  )
  assert.ok(Number.isFinite(run.score) && run.score > 0)
}
for (const seed of [1, 2, 3]) {
  const run = pilotRun(seed, 30, false)
  assert.ok(run.over, `seed ${seed}: a run without endless lives ends`)
}

console.log('verifyPipePals: ok')
