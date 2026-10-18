import assert from 'node:assert/strict'
import {
  FOE_ANIMATION,
  createSavePlumberPreview,
} from '../arcade/games/savePlumberPreview'
import { ENEMY_ANIMATIONS } from '../arcade/games/savePlumberAnimations'
import {
  CAMPAIGN,
  SOLID_BLOCK,
  SOLID_CRATE,
  SOLID_BELT_LEFT,
  SOLID_BELT_RIGHT,
  SOLID_BRIDGE,
  SOLID_GATE,
  SOLID_WATER,
  TILE,
  WORLD_EIGHT,
  WORLD_FIVE,
  WORLD_FOUR,
  WORLD_ONE,
  WORLD_SEVEN,
  WORLD_SIX,
  WORLD_THREE,
  WORLD_TWO,
  parseStage,
  stageWorld,
} from '../arcade/games/savePlumberLevels'
import {
  PLUMBER_ROSTER,
  rosterIndex,
  seedForRoster,
} from '../arcade/games/savePlumberRoster'
import { readPlumberSave } from '../arcade/games/savePlumberSave'
import { emptyInput, type ArcadeButton } from '../arcade/types'

const sound = { play() {} }
const options = (extra = {}) => ({
  rng: () => 0.37,
  sound,
  demo: false,
  hiScore: 0,
  ...extra,
})

assert.deepEqual(
  WORLD_ONE.map((stage) => stage.code),
  ['1-1', '1-2', '1-3', '1-4'],
)
assert.deepEqual(
  WORLD_TWO.map((stage) => stage.code),
  ['2-1', '2-2', '2-3', '2-4'],
)
assert.deepEqual(
  WORLD_THREE.map((stage) => stage.code),
  ['3-1', '3-2', '3-3', '3-4'],
)
assert.deepEqual(
  WORLD_FOUR.map((stage) => stage.code),
  ['4-1', '4-2', '4-3', '4-4'],
)
assert.deepEqual(
  WORLD_FIVE.map((stage) => stage.code),
  ['5-1', '5-2', '5-3', '5-4'],
)
assert.deepEqual(
  WORLD_SIX.map((stage) => stage.code),
  ['6-1', '6-2', '6-3', '6-4'],
)
assert.deepEqual(
  WORLD_SEVEN.map((stage) => stage.code),
  ['7-1', '7-2', '7-3', '7-4'],
)
assert.deepEqual(
  WORLD_EIGHT.map((stage) => stage.code),
  ['8-1', '8-2', '8-3', '8-4'],
)
assert.equal(CAMPAIGN.length, 32)
for (const def of CAMPAIGN) {
  const stage = parseStage(def)
  assert.equal(stage.rows, 24, `${def.code} is 24 rows tall`)
  assert.ok(stage.cols >= 96, `${def.code} is a full stage, not a screen`)
  const kinds = new Set(stage.spawns.map((s) => s.kind))
  assert.ok(kinds.has('token'), `${def.code} has tokens`)
  assert.ok(kinds.has('checkpoint'), `${def.code} has a checkpoint`)
  assert.ok(
    kinds.has('goal') !== kinds.has('boss'),
    `${def.code} ends at a goal valve or a boss`,
  )
}
assert.ok(
  parseStage(WORLD_ONE[1]!).solid.includes(SOLID_GATE),
  '1-2 has a valve gate to open on the run',
)
assert.notEqual(
  parseStage(WORLD_ONE[3]!).gate,
  null,
  '1-4 ends in a boss arena',
)
const kindsIn = (world: number) =>
  new Set(
    CAMPAIGN.filter((d) => stageWorld(d.code) === world).flatMap((d) =>
      parseStage(d).spawns.map((s) => s.kind),
    ),
  )
for (const kind of ['minnow', 'cork-crab', 'glider', 'raft'] as const)
  assert.ok(kindsIn(2).has(kind), `World 2 has ${kind}`)
for (const kind of ['moss-lantern', 'spring-hare'] as const)
  assert.ok(kindsIn(3).has(kind), `World 3 has ${kind}`)
for (const kind of ['gasket-golem', 'rivet-roller', 'valve'] as const)
  assert.ok(kindsIn(4).has(kind), `World 4 has ${kind}`)
for (const kind of ['umbrella-mite', 'wind'] as const)
  assert.ok(kindsIn(5).has(kind), `World 5 has ${kind}`)
for (const kind of ['puddle-mimic', 'valve'] as const)
  assert.ok(kindsIn(6).has(kind), `World 6 has ${kind}`)
for (const kind of [
  'chimney-spirit',
  'tea-kettle-knight',
  'power-springstep',
] as const)
  assert.ok(kindsIn(7).has(kind), `World 7 has ${kind}`)
for (let world = 1; world <= 8; world++)
  assert.ok(kindsIn(world).has('glider'), `World ${world} sends gliders`)
assert.ok(
  WORLD_SIX.every((d) => parseStage(d).solid.includes(SOLID_BRIDGE)),
  'every Underworks leg crosses a crystal bridge',
)
assert.ok(
  WORLD_SIX.some((d) => d.dark),
  'the Underworks has unlit stages',
)
for (const kind of [
  'gasket-golem',
  'rivet-roller',
  'pumpbug',
  'minnow',
  'valve',
  'wind',
  'steam-vent',
] as const)
  assert.ok(kindsIn(8).has(kind), `the Citadel brings back ${kind}`)
assert.ok(
  [...WORLD_FOUR, ...WORLD_EIGHT].every((d) => {
    const solid = parseStage(d).solid
    return solid.includes(SOLID_BELT_LEFT) || solid.includes(SOLID_BELT_RIGHT)
  }),
  'every Clockwork Fair and Citadel stage has conveyor belts',
)
assert.ok(
  WORLD_TWO.every((d) => parseStage(d).solid.includes(SOLID_WATER)),
  'every marina leg has water to jump',
)
assert.ok(
  parseStage(WORLD_TWO[0]!).solid.includes(SOLID_WATER),
  'the marina has water',
)
assert.ok(
  WORLD_THREE.some((d) => d.dark),
  'the orchard has unlit stages',
)
for (const world of [
  WORLD_ONE,
  WORLD_TWO,
  WORLD_THREE,
  WORLD_FOUR,
  WORLD_FIVE,
  WORLD_SIX,
  WORLD_SEVEN,
  WORLD_EIGHT,
])
  assert.notEqual(
    parseStage(world[3]!).gate,
    null,
    `${world[3]!.code} ends in a boss arena`,
  )
assert.throws(() => parseStage({ code: 'x', name: 'x', rows: ['..', '.'] }))
assert.throws(() => parseStage({ code: 'x', name: 'x', rows: ['..'] }))

// Every runner leg is finishable: the predictive autopilot only jumps, slides
// and swings (she runs on her own) and clears each one without losing a life.
const bosses = [
  'Madame Pressure',
  'Captain Barnaclejack',
  'The Overripe Baron',
  'Tick-Tock Duchess',
  'Admiral Gust',
  'Prism Mole',
  'The Umbrella Dragon',
  'Lady Spigot',
]
for (let index = 0; index < CAMPAIGN.length; index++) {
  const game = createSavePlumberPreview(options(), {
    stage: index,
    autopilot: true,
  })
  const input = emptyInput()
  const lives = game.lives
  let ticks = 0
  while (!game.cleared.length && ticks < 60 * 120) {
    game.update(input)
    ticks++
  }
  assert.equal(
    game.lives,
    lives,
    `${CAMPAIGN[index]!.code} is cleared without losing a life`,
  )
  assert.deepEqual(
    game.cleared,
    [CAMPAIGN[index]!.code],
    `${CAMPAIGN[index]!.code} is cleared by the autopilot`,
  )
  if (index % 4 === 3) {
    assert.equal(game.boss?.name, bosses[(index - 3) / 4])
    assert.equal(game.boss?.hp, 0, `${game.boss?.name} is beaten`)
  }
}

// Runner controls: she runs on her own; A jumps, B slides (or drops fast in
// the air), X swings the wrench, Y is the heroine's special. Tested on 1-1
// flattened into a bare track.
const track = () => {
  const g = createSavePlumberPreview(options(), { stage: 0 })
  g.loadStage(0)
  g.mode = 'play'
  g.foes.length = 0
  g.vents.length = 0
  const { cols, rows } = g.stage
  const solid = (g as unknown as { solid: Uint8Array }).solid
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      solid[r * cols + c] = r >= g.groundRow ? SOLID_BLOCK : 0
  return { g, solid, cols }
}
const play = track().g
const step = (held: ArcadeButton[] = [], pressed: ArcadeButton[] = []) => {
  const frame = emptyInput()
  for (const b of held) frame.held[b] = true
  for (const b of pressed) frame.pressed[b] = true
  play.update(frame)
}
for (let i = 0; i < 20; i++) step()
assert.ok(play.ground)
step(['a'], ['a'])
assert.ok(play.hero.vy < 0, 'A jumps')
for (let i = 0; i < 60; i++) step()
assert.ok(play.ground)
step([], ['x'])
assert.ok(play.ground, 'X does not jump')
assert.ok(play.swing > 0, 'X swings the wrench')
const runner = track().g
const startX = runner.hero.x
for (let i = 0; i < 60; i++) {
  const f = emptyInput()
  f.held.left = true
  runner.update(f)
}
assert.ok(runner.runnerOn, 'outside a boss arena she is a runner')
assert.ok(runner.hero.x > startX + 120, 'she runs forward on her own')
assert.ok(
  Math.abs(runner.hero.vx - runner.runSpeed) < 0.2,
  'at the world pace, whatever the stick says',
)
const slide = (held: boolean) => {
  const f = emptyInput()
  f.held.b = held
  runner.update(f)
}
const standingTop = runner.heroTop
slide(true)
assert.ok(runner.ducking, 'B slides')
assert.ok(runner.heroTop > standingTop + 8, 'a slide drops her head low')
assert.ok(runner.hero.vx > 2, 'and keeps her running, not sprinting')
for (let i = 0; i < 5; i++) slide(false)
assert.ok(!runner.ducking, 'letting go of B stands her back up')
assert.ok(runner.runSpeed > 0 && runner.runSpeed < 4, 'B no longer runs')

// A beam at head height: slide under it or take the hit.
const beamRun = (duck: boolean) => {
  const { g, solid, cols } = track()
  const col = Math.floor(g.hero.x / TILE) + 8
  for (let r = 1; r <= g.groundRow - 2; r++) solid[r * cols + col] = SOLID_BLOCK
  for (let i = 0; i < 60; i++) {
    const f = emptyInput()
    f.held.b = duck
    g.update(f)
  }
  return g.hero.x > (col + 1) * TILE
}
assert.ok(beamRun(true), 'sliding passes under a beam')
assert.ok(!beamRun(false), 'standing runs into it')

// Pinned against a wall she cannot clear, she loses a life.
const pinned = track()
const wallCol = Math.floor(pinned.g.hero.x / TILE) + 6
for (let r = 1; r < pinned.g.groundRow; r++)
  pinned.solid[r * pinned.cols + wallCol] = SOLID_BLOCK
const pinnedLives = pinned.g.lives
for (let i = 0; i < 160 && pinned.g.lives === pinnedLives; i++)
  pinned.g.update(emptyInput())
assert.equal(pinned.g.lives, pinnedLives - 1, 'pinned too long costs a life')

// Every heroine's special on Y does her own thing.
const withHeroine = (key: string) => {
  const g = createSavePlumberPreview(options(), { stage: 0 })
  g.heroineSeed = seedForRoster(
    PLUMBER_ROSTER.findIndex((m) => m.key === key),
    () => 0.37,
  )
  g.loadStage(0)
  g.mode = 'play'
  g.foes.length = 0
  for (let i = 0; i < 20; i++) g.update(emptyInput())
  assert.equal(
    g.specialKind,
    PLUMBER_ROSTER.find((m) => m.key === key)!.special.key,
  )
  return g
}
const frame = (held: ArcadeButton[] = [], pressed: ArcadeButton[] = []) => {
  const f = emptyInput()
  for (const b of held) f.held[b] = true
  for (const b of pressed) f.pressed[b] = true
  return f
}
const airborne = (g: ReturnType<typeof withHeroine>, ticks: number) => {
  g.update(frame(['a'], ['a']))
  for (let i = 0; i < ticks; i++) g.update(frame(['a']))
}
const dasher = withHeroine('marisol')
dasher.update(frame([], ['y']))
assert.ok(dasher.hero.vx > 6, 'Marisol dashes')
const pip = withHeroine('pip')
airborne(pip, 12)
pip.update(frame([], ['y']))
assert.ok(pip.hero.vy < -6, 'Pip jumps again in mid-air')
const tala = withHeroine('tala')
airborne(tala, 10)
tala.update(frame([], ['y']))
assert.equal(tala.hero.vy, 9, 'Tala slams down')
for (let i = 0; i < 60 && !tala.ground; i++) tala.update(emptyInput())
assert.ok(tala.ground && tala.specialCooldown > 0, 'and the pound lands')
const jiwoo = withHeroine('jiwoo')
jiwoo.update(frame([], ['y']))
assert.ok(jiwoo.hero.vx >= 5, 'Ji-woo charges')
const hearts = jiwoo.hearts
;(jiwoo as unknown as { hurt(dir: number): void }).hurt(1)
assert.equal(jiwoo.hearts, hearts, 'nothing hurts a charge')
const odette = withHeroine('odette')
airborne(odette, 30)
for (let i = 0; i < 6; i++) odette.update(frame(['y']))
assert.ok(odette.hero.vy <= 1.7, 'Odette floats down on her parasol')
const hodan = withHeroine('hodan')
hodan.update(frame([], ['y']))
assert.ok(hodan.specialTimer > 0, 'Hodan spins')
const priya = withHeroine('priya')
priya.update(frame([], ['y']))
assert.ok(priya.hero.vx > 4, 'Priya rolls')
;(priya as unknown as { hurt(dir: number): void }).hurt(1)
assert.equal(priya.hearts, 3, 'nothing hurts a roll')
const nova = withHeroine('nova')
nova.update(frame([], ['y']))
assert.ok(nova.hero.vy < -11, 'Nova vaults far higher than a jump')
const jumpTop = (hold: number) => {
  const g = createSavePlumberPreview(options(), { stage: 0 })
  g.loadStage(0)
  g.mode = 'play'
  for (let i = 0; i < 20; i++) g.update(emptyInput())
  const start = g.hero.y
  let top = start
  for (let i = 0; i < 50; i++) {
    const f = emptyInput()
    f.held.a = i < hold
    f.pressed.a = i === 0
    g.update(f)
    top = Math.min(top, g.hero.y)
  }
  return start - top
}
assert.ok(jumpTop(30) > jumpTop(2) + 30, 'holding A jumps higher')

// Opening flow: title, heroine select, then 1-1, saving the choice.
const fresh = createSavePlumberPreview(options())
const tap = (button: ArcadeButton) => {
  const f = emptyInput()
  f.pressed[button] = true
  fresh.update(f)
}
assert.equal(fresh.mode, 'title')
tap('a')
assert.equal(fresh.mode, 'select')
const startCursor = fresh.cursor
tap('right')
tap('right')
assert.equal(fresh.cursor, (startCursor + 2) % PLUMBER_ROSTER.length)
tap('b')
assert.notEqual(
  fresh.cursor,
  (startCursor + 2) % PLUMBER_ROSTER.length,
  'B surprises',
)
const picked = fresh.cursor
tap('a')
assert.equal(fresh.mode, 'story', 'a new game opens with the story')
assert.equal(fresh.storyPanel, 0)
tap('a')
assert.equal(fresh.storyPanel, 1, 'A turns the page')
for (let i = 0; i < 800 && fresh.mode === 'story'; i++)
  fresh.update(emptyInput())
assert.equal(fresh.mode, 'intro', 'the story plays through to 1-1')
assert.equal(fresh.stage.code, '1-1')
assert.equal(
  rosterIndex(fresh.heroineSeed),
  picked,
  'the run stars the picked heroine',
)
const saved = readPlumberSave(fresh.save)
assert.ok(saved, 'the run saves')
assert.equal(saved!.stage, 0)
assert.equal(rosterIndex(saved!.heroine), picked)

// Continue: a save resumes its heroine and stage.
const resumed = createSavePlumberPreview(
  options({ resume: { ...saved!, stage: 2, score: 4200, lives: 2 } }),
)
const go = (button: ArcadeButton) => {
  const f = emptyInput()
  f.pressed[button] = true
  resumed.update(f)
}
go('a')
assert.equal(resumed.mode, 'intro')
assert.equal(resumed.stage.code, '1-3')
assert.equal(resumed.score, 4200)
assert.equal(resumed.lives, 2)
assert.equal(rosterIndex(resumed.heroineSeed), picked)

assert.equal(
  readPlumberSave({
    v: 1,
    heroine: 1,
    stage: 99,
    score: 0,
    lives: 3,
    tokens: 0,
  }),
  null,
)
assert.equal(readPlumberSave({ v: 2 }), null)
assert.equal(readPlumberSave(null), null)

// Pits cost a life and return you to the checkpoint.
const faller = createSavePlumberPreview(options(), { stage: 0 })
faller.loadStage(0)
faller.mode = 'play'
faller.hero.x = 8 * TILE * 8
faller.hero.y = faller.stage.rows * TILE + 60
const before = faller.lives
for (let i = 0; i < 100; i++) faller.update(emptyInput())
assert.equal(faller.lives, before - 1)
assert.equal(faller.mode, 'play')

for (const [kind, key] of Object.entries(FOE_ANIMATION))
  assert.ok(ENEMY_ANIMATIONS[key], `${kind} has a painted animation`)

// World 2 and 3 families behave as their toy-box lines promise.
const lab = (stage: number) => {
  const g = createSavePlumberPreview(options(), { stage })
  g.loadStage(stage)
  g.mode = 'play'
  return g
}

// Gliders fly at her head: slide under them.
const gliderSource = lab(1).foes.find((f) => f.glide)!
const gliderRun = (duck: boolean) => {
  const { g } = track()
  for (let i = 0; i < 10; i++) g.update(emptyInput())
  g.foes.push({ ...gliderSource, x: g.hero.x + 120, homeY: g.hero.y + 8 })
  g.immune = 0
  for (let i = 0; i < 60; i++) {
    const f = emptyInput()
    f.held.b = duck
    g.update(f)
  }
  return g.hearts
}
assert.equal(gliderRun(true), 3, 'a glider passes over a slide')
assert.ok(gliderRun(false) < 3, 'and hits her if she stands')

// B in the air drops her fast.
const drop = (fast: boolean) => {
  const { g } = track()
  for (let i = 0; i < 10; i++) g.update(emptyInput())
  g.update(frame(['a'], ['a']))
  for (let i = 0; i < 14; i++) g.update(frame(['a']))
  let ticks = 0
  while (!g.ground && ticks < 120) {
    g.update(frame(fast ? ['b'] : []))
    ticks++
  }
  return ticks
}
assert.ok(drop(true) < drop(false) - 4, 'B in the air drops her fast')

const marina = lab(5)
const gull = marina.foes.find((f) => f.kind === 'glass-gull')!
assert.ok(gull.glide, "the marina's gliders are glass gulls")
marina.tokens = 9
marina.immune = 0
marina.hero.x = gull.x
marina.hero.y = gull.y - 20
marina.hero.vy = 0
marina.update(emptyInput())
assert.ok(gull.carry > 0, 'a glass gull steals tokens')
assert.equal(marina.hearts, 3, 'a steal costs tokens, not hearts')
const pond = lab(4)
const minnow = pond.foes.find((f) => f.kind === 'minnow')!
let leapt = false
for (let i = 0; i < 400 && !leapt; i++) {
  pond.immune = 99
  pond.hero = { x: minnow.x - 150, y: pond.hero.y, vx: 0, vy: 0 }
  pond.update(emptyInput())
  leapt = minnow.y < minnow.homeY - 40
}
assert.ok(leapt, 'a clockwork minnow leaps out of the water')
const sink = lab(4)
sink.hero.x =
  ((sink.stage.solid.indexOf(SOLID_WATER) % sink.stage.cols) + 0.5) * TILE
sink.hero.y = (sink.groundRow + 1) * TILE - 20
for (let i = 0; i < 40; i++) sink.update(emptyInput())
assert.equal(sink.mode, 'dying', 'water costs a life')

const orchard = lab(9)
const lantern = orchard.foes.find((f) => f.kind === 'moss-lantern')!
orchard.hero.x = lantern.x
orchard.hero.y = lantern.y - 60
orchard.hero.vy = 2
for (let i = 0; i < 30 && lantern.state !== 'flat'; i++)
  orchard.update(emptyInput())
assert.equal(lantern.state, 'flat', 'stomping a moss lantern flattens it')
assert.ok(
  orchard.platforms.includes(lantern.pad!),
  'a flat lantern is a platform',
)
const hop = lab(8)
const hare = hop.foes.find((f) => f.kind === 'spring-hare')!
for (let i = 0; i < 10; i++) hop.update(emptyInput())
hop.hero.x = hare.x
hop.hero.y = hare.y - 60
hop.hero.vy = 3
let launched = false
for (let i = 0; i < 30 && !launched; i++) {
  hop.update(emptyInput())
  launched = hop.hero.vy < -9
}
assert.ok(launched, 'stomping a spring hare bounces you higher')

// World 4 and 5 machinery and families.
const fair = lab(12)
const beltCol =
  parseStage(WORLD_FOUR[0]!).solid.indexOf(
    SOLID_BELT_RIGHT,
    (fair.stage.rows - 3) * fair.stage.cols,
  ) % fair.stage.cols
fair.foes.length = 0
fair.hero.x = beltCol * TILE + 40
fair.hero.y = fair.groundRow * TILE - 26
fair.update(emptyInput())
const onBelt = fair.hero.x
for (let i = 0; i < 20; i++) fair.update(emptyInput())
assert.ok(fair.hero.x > onBelt + 15, 'a right-hand belt carries you right')

const golemLab = lab(12)
const golem = golemLab.foes.find((f) => f.kind === 'gasket-golem')!
const stompGolem = () => {
  golemLab.immune = 0
  golemLab.hero.x = golem.x
  golemLab.hero.y = golem.y - 60
  golemLab.hero.vy = 3
  for (let i = 0; i < 30 && golemLab.hero.vy >= 0; i++)
    golemLab.update(emptyInput())
}
stompGolem()
assert.equal(
  golem.state,
  'stunned',
  'the first stomp knocks a golem plate loose',
)
assert.equal(golem.fade, 0, 'a gasket golem takes two hits')
stompGolem()
assert.ok(golem.fade > 0, 'the second stomp topples a gasket golem')

const ropeway = lab(16)
const mite = ropeway.foes.find((f) => f.kind === 'umbrella-mite')!
mite.y -= 96
let fastest = 0
for (let i = 0; i < 90; i++) {
  ropeway.immune = 99
  ropeway.hero = { x: mite.x - 150, y: ropeway.hero.y, vx: 0, vy: 0 }
  ropeway.update(emptyInput())
  fastest = Math.max(fastest, mite.vy)
}
assert.ok(fastest > 0.5, 'an umbrella mite in the air drifts down')
assert.ok(fastest <= 1.1, 'an umbrella mite floats down slowly')
assert.equal(
  ropeway.foes.find((f) => f.glide)!.kind,
  'paper-kite',
  'paper kites glide at her over the ropeways',
)

const windmill = lab(17)
const windCol = windmill.windy.indexOf(1)
assert.ok(windCol > 0, '5-2 has a wind corridor')
assert.ok(windmill.windAt(windCol * TILE + 4, 10) < 0, 'gusts blow a headwind')
assert.equal(windmill.windAt(windCol * TILE + 4, 200), 0, 'and then calm')
assert.equal(windmill.windAt(2 * TILE, 10), 0, 'outside the corridor is still')

const duel = (stage: number) => {
  const g = lab(stage)
  g.hero.x = (g.stage.cols - 6) * TILE
  g.update(emptyInput())
  g.boss!.state = 'tell'
  g.boss!.timer = 1
  g.update(emptyInput())
  return g
}
const duchess = duel(15)
assert.equal(duchess.boss!.kind, 'chime')
assert.equal(duchess.boss!.state, 'burst', 'the fourth chime is the swing')
const gust = duel(19)
assert.equal(gust.boss!.kind, 'gale')
gust.hero.x = gust.boss!.x - 60
const pushedFrom = gust.hero.x
for (let i = 0; i < 10; i++) gust.update(emptyInput())
assert.ok(gust.hero.x < pushedFrom - 8, 'the Admiral gale pushes you back')

// World 6 and 7 machinery, families and bosses.
const caverns = lab(21)
const bridge = caverns.stage.solid.indexOf(SOLID_BRIDGE)
const bridgeCol = bridge % caverns.stage.cols
const bridgeRow = Math.floor(bridge / caverns.stage.cols)
assert.ok(
  caverns.bridgeLit(10) && !caverns.bridgeLit(200),
  'bridges glow, then fade',
)
caverns.tick = 10
assert.equal(caverns.solidAt(bridgeCol, bridgeRow), SOLID_BRIDGE)
caverns.tick = 200
assert.equal(
  caverns.solidAt(bridgeCol, bridgeRow),
  0,
  'a dark bridge is not there',
)

const sluice = lab(20)
const mimic = sluice.foes.find((f) => f.kind === 'puddle-mimic')!
assert.equal(mimic.state, 'idle', 'a puddle mimic lies still')
sluice.hero.x = mimic.x - 60
sluice.hero.y = mimic.y - 26
sluice.immune = 99
sluice.update(emptyInput())
assert.equal(mimic.state, 'walk', 'and rises when you come close')

const roofs = lab(24)
const spirit = roofs.foes.find((f) => f.kind === 'chimney-spirit')!
roofs.hero.x = spirit.x - 100
roofs.hero.y = spirit.y - 26
let puffed = false
for (let i = 0; i < 260 && !puffed; i++) {
  roofs.immune = 99
  roofs.update(emptyInput())
  puffed = roofs.soot.length > 0
}
assert.ok(puffed, 'a chimney spirit lobs soot')
const knightLab = lab(24)
const knight = knightLab.foes.find((f) => f.kind === 'tea-kettle-knight')!
knightLab.hero.x = knight.x - 70
knightLab.hero.y = knight.y - 26
let whistled = false
let lunged = false
for (let i = 0; i < 120; i++) {
  knightLab.immune = 99
  knightLab.update(emptyInput())
  whistled ||= knight.state === 'stunned'
  lunged ||= whistled && knight.state === 'swoop'
}
assert.ok(whistled && lunged, 'a tea-kettle knight whistles, then lunges')

const mole = duel(23)
assert.equal(mole.boss!.kind, 'burrow')
assert.equal(mole.boss!.state, 'burst', 'the Prism Mole erupts after its tell')
const dragon = duel(27)
assert.equal(dragon.boss!.kind, 'dive')
assert.ok(Math.abs(dragon.boss!.vx) > 4, 'the Umbrella Dragon dives')

// Lady Spigot: the hissing valve picks the side her water jet fires from.
const spigot = duel(31)
assert.equal(spigot.boss!.kind, 'spigot')
assert.equal(spigot.boss!.state, 'burst')
spigot.immune = 0
spigot.hero.x = spigot.boss!.x + spigot.boss!.dir * 60
spigot.hero.y = spigot.boss!.y - 26
spigot.update(emptyInput())
assert.equal(spigot.hearts, 2, 'her jet soaks the hissing side')
const safe = duel(31)
safe.immune = 0
safe.hero.x = safe.boss!.x - safe.boss!.dir * 60
safe.hero.y = safe.boss!.y - 26
safe.update(emptyInput())
assert.equal(safe.hearts, 3, 'the quiet side stays dry')

// Beating Lady Spigot plays the rescue finale and marks the campaign cleared.
const finale = createSavePlumberPreview(options())
finale.loadStage(CAMPAIGN.length - 1)
finale.mode = 'play'
finale.boss!.hp = 0
finale.boss!.state = 'defeat'
finale.boss!.timer = 1
for (let i = 0; i < 200 && (finale.mode as string) !== 'victory'; i++)
  finale.update(emptyInput())
assert.equal(finale.mode, 'victory', 'the rescue finale plays')
assert.equal(
  readPlumberSave(finale.save)!.cleared,
  true,
  'the campaign is cleared',
)
assert.equal(readPlumberSave(finale.save)!.stage, 0, 'a new run starts at 1-1')
for (let i = 0; i < 1000 && !finale.over; i++) finale.update(emptyInput())
assert.equal(finale.over, true, 'the cabinet ends after the finale')

// Powerups: Springstep, Bottled Storm, Pocket Lift and water hearts.
const allKinds = new Set(
  CAMPAIGN.flatMap((d) => parseStage(d).spawns.map((sp) => sp.kind)),
)
for (const kind of [
  'power-springstep',
  'power-storm',
  'power-lift',
  'heart',
] as const)
  assert.ok(allKinds.has(kind), `the campaign places ${kind}`)
const powerLab = (code: string, kind: string) => {
  const index = CAMPAIGN.findIndex((d) => d.code === code)
  const g = lab(index)
  const pickup = g.pickups.find((p) => p.kind === kind)!
  g.foes.length = 0
  g.hero.x = pickup.x
  g.hero.y = pickup.y - 18
  g.update(emptyInput())
  assert.ok(pickup.taken, `${kind} is picked up`)
  return g
}
const jumper = powerLab('5-1', 'springstep')
assert.equal(jumper.power, 'springstep')
for (let i = 0; i < 20; i++) jumper.update(emptyInput())
const leap = emptyInput()
leap.pressed.a = true
leap.held.a = true
jumper.update(leap)
assert.ok(jumper.hero.vy < -9.5, 'Springstep jumps higher')
jumper.immune = 0
jumper.hearts = 3
jumper.mode = 'play'
;(jumper as unknown as { hurt(dir: number): void }).hurt(1)
assert.equal(jumper.power, null, 'a hit costs the power')
assert.equal(jumper.hearts, 3, 'and not a heart')

const stormy = powerLab('4-1', 'bottled-storm')
const golemTarget = lab(12).foes.find((f) => f.kind === 'gasket-golem')!
stormy.foes.push({
  ...golemTarget,
  x: stormy.hero.x + 90,
  y: stormy.hero.y + 26,
})
stormy.facing = 1
const blast = emptyInput()
blast.pressed.x = true
stormy.update(blast)
assert.equal(stormy.gusts.length, 1, 'Bottled Storm throws a gust')
for (let i = 0; i < 40; i++) stormy.update(emptyInput())
assert.equal(stormy.foes.at(-1)!.state, 'stunned', 'the gust strikes at range')

const lifter = powerLab('8-2', 'pocket-lift')
const crateAt = lifter.stage.solid.findIndex(
  (x, i) => x === SOLID_CRATE && i % lifter.stage.cols > lifter.hero.x / TILE,
)
const crateCol = crateAt % lifter.stage.cols
lifter.hero.x = crateCol * TILE - 40
lifter.hero.y = Math.floor(crateAt / lifter.stage.cols + 1) * TILE - 26
for (let i = 0; i < 200 && !lifter.carrying; i++) {
  const walk = emptyInput()
  walk.pressed.x = lifter.hero.x > crateCol * TILE - 20 && i % 25 === 0
  lifter.immune = 99
  lifter.update(walk)
}
assert.ok(lifter.carrying, 'Pocket Lift picks a crate up')
const stacked = lifter.stage.solid.filter((x) => x === SOLID_CRATE).length
const live = () =>
  (lifter as unknown as { solid: Uint8Array }).solid.filter(
    (x) => x === SOLID_CRATE,
  ).length
assert.equal(live(), stacked - 1, 'the lifted crate leaves its stack')
// Clear the rest of the stack (a thrown crate smashes crates it hits).
const liveSolid = (lifter as unknown as { solid: Uint8Array }).solid
liveSolid.forEach((x, i) => {
  if (x === SOLID_CRATE) liveSolid[i] = 0
})
for (let i = 0; i < 20; i++) lifter.update(emptyInput())
const toss = emptyInput()
toss.pressed.x = true
lifter.update(toss)
assert.equal(lifter.carrying, false)
for (let i = 0; i < 60; i++) lifter.update(emptyInput())
assert.equal(live(), 1, 'a thrown crate lands as a new step')

const mended = powerLab('1-2', 'heart')
assert.equal(mended.hearts, 3)
const mender = lab(CAMPAIGN.findIndex((d) => d.code === '1-2'))
const heart = mender.pickups.find((p) => p.kind === 'heart')!
mender.hearts = 1
mender.foes.length = 0
mender.hero.x = heart.x
mender.hero.y = heart.y - 18
mender.update(emptyInput())
assert.equal(mender.hearts, 2, 'a water heart restores a heart')

// Stages are 24 rows: on the ground the view frames the ground as before, and
// the camera follows a climb into the upper rows.
const tall = lab(0)
for (let i = 0; i < 60; i++) tall.update(emptyInput())
const lowest = tall.stage.rows * TILE - 270
assert.ok(
  Math.abs(tall.cameraY - lowest) < 1,
  'the ground view sits at the bottom',
)
tall.hero.y = 2 * TILE
tall.hero.vy = 0
for (let i = 0; i < 40; i++) {
  tall.hero.y = 2 * TILE
  tall.update(emptyInput())
}
assert.ok(tall.cameraY < lowest - 60, 'the camera follows her up')

// Beating a world's boss continues the campaign into the next world.
const boss = createSavePlumberPreview(options())
boss.loadStage(3)
boss.mode = 'play'
boss.boss!.hp = 0
boss.boss!.state = 'defeat'
boss.boss!.timer = 1
for (let i = 0; i < 200 && (boss.mode as string) !== 'victory'; i++)
  boss.update(emptyInput())
assert.equal(boss.mode, 'victory')
assert.equal(readPlumberSave(boss.save)!.stage, 4, 'the save moves on to 2-1')
const next = emptyInput()
for (let i = 0; i < 200; i++) boss.update(next)
next.pressed.a = true
boss.update(next)
assert.equal(boss.stage.code, '2-1', 'the next world begins')
assert.equal(boss.over, false)

// The attract demo plays itself and never asks for input.
const demo = createSavePlumberPreview(options({ demo: true }))
for (let i = 0; i < 60 * 20; i++) demo.update(emptyInput())
assert.equal(demo.mode === 'play' || demo.mode === 'clear', true)
assert.equal(demo.save, undefined, 'the demo never saves')

console.log(
  'Save the Plumber Worlds 1 to 8: thirty-two finishable stages, eight bosses, the rescue finale, controls, select and saves verified',
)
