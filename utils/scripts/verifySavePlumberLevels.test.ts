import assert from 'node:assert/strict'
import {
  FOE_ANIMATION,
  createSavePlumberPreview,
} from '../arcade/games/savePlumberPreview'
import { ENEMY_ANIMATIONS } from '../arcade/games/savePlumberAnimations'
import {
  CAMPAIGN,
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
import { PLUMBER_ROSTER, rosterIndex } from '../arcade/games/savePlumberRoster'
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
  assert.equal(stage.rows, 17, `${def.code} is 17 rows tall`)
  assert.ok(stage.cols >= 96, `${def.code} is a full stage, not a screen`)
  const kinds = new Set(stage.spawns.map((s) => s.kind))
  assert.ok(kinds.has('token'), `${def.code} has tokens`)
  assert.ok(kinds.has('checkpoint'), `${def.code} has a checkpoint`)
  assert.ok(
    kinds.has('goal') !== kinds.has('boss'),
    `${def.code} ends at a goal valve or a boss`,
  )
}
const first = parseStage(WORLD_ONE[0]!)
assert.equal(first.doors.length, 2, '1-1 hides a pipe-door secret room')
assert.ok(parseStage(WORLD_ONE[2]!).solid.includes(SOLID_GATE))
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
for (const kind of ['minnow', 'cork-crab', 'glass-gull', 'raft'] as const)
  assert.ok(kindsIn(2).has(kind), `World 2 has ${kind}`)
for (const kind of ['moss-lantern', 'spring-hare'] as const)
  assert.ok(kindsIn(3).has(kind), `World 3 has ${kind}`)
for (const kind of ['gasket-golem', 'rivet-roller', 'piston', 'lift'] as const)
  assert.ok(kindsIn(4).has(kind), `World 4 has ${kind}`)
for (const kind of ['paper-kite', 'umbrella-mite', 'wind', 'cargo'] as const)
  assert.ok(kindsIn(5).has(kind), `World 5 has ${kind}`)
for (const kind of ['puddle-mimic', 'siphon-sprite', 'valve'] as const)
  assert.ok(kindsIn(6).has(kind), `World 6 has ${kind}`)
for (const kind of [
  'chimney-spirit',
  'tea-kettle-knight',
  'springstep',
] as const)
  assert.ok(kindsIn(7).has(kind), `World 7 has ${kind}`)
assert.ok(
  WORLD_SIX.slice(0, 3).every((d) =>
    parseStage(d).solid.includes(SOLID_BRIDGE),
  ),
  'the Underworks stages cross crystal bridges',
)
assert.ok(
  WORLD_SIX.some((d) => d.dark),
  'the Underworks has unlit stages',
)
for (const kind of [
  'gasket-golem',
  'siphon-sprite',
  'pumpbug',
  'raft',
  'valve',
  'wind',
  'cargo',
  'lift',
] as const)
  assert.ok(kindsIn(8).has(kind), `the Citadel brings back ${kind}`)
assert.ok(
  WORLD_FOUR.every((d) => {
    const solid = parseStage(d).solid
    return solid.includes(SOLID_BELT_LEFT) || solid.includes(SOLID_BELT_RIGHT)
  }),
  'every Clockwork Fair stage has conveyor belts',
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

// Every stage is finishable: the predictive autopilot plays each one through.
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
  let ticks = 0
  while (!game.cleared.length && ticks < 60 * 120) {
    game.update(input)
    ticks++
  }
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

// Controls: A jumps, B swings the wrench.
const play = createSavePlumberPreview(options(), { stage: 0 })
play.loadStage(0)
play.mode = 'play'
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
step([], ['b'])
assert.ok(play.ground, 'B does not jump')
assert.ok(play.swing > 0, 'B swings the wrench')
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
assert.equal(fresh.mode, 'intro')
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
faller.hero.y = 17 * TILE + 60
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
const marina = lab(4)
const gull = marina.foes.find((f) => f.kind === 'glass-gull')!
marina.tokens = 9
marina.immune = 0
marina.hero.x = gull.x
marina.hero.y = gull.y - 20
marina.hero.vy = 0
marina.update(emptyInput())
assert.ok(gull.carry > 0, 'a glass gull steals tokens')
assert.equal(marina.hearts, 3, 'a steal costs tokens, not hearts')
const minnow = marina.foes.find((f) => f.kind === 'minnow')!
let leapt = false
for (let i = 0; i < 400 && !leapt; i++) {
  marina.update(emptyInput())
  leapt = minnow.y < minnow.homeY - 40
}
assert.ok(leapt, 'a clockwork minnow leaps out of the water')
const sink = lab(4)
sink.hero.x = 20 * TILE
sink.hero.y = 15 * TILE - 20
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
    14 * fair.stage.cols,
  ) % fair.stage.cols
fair.foes.length = 0
fair.hero.x = beltCol * TILE + 40
fair.hero.y = 14 * TILE - 26
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
let fastest = 0
for (let i = 0; i < 600; i++) {
  ropeway.immune = 99
  ropeway.update(emptyInput())
  fastest = Math.max(fastest, mite.vy)
}
assert.ok(fastest > 0.5, 'an umbrella mite walks off its ledge')
assert.ok(fastest <= 1.1, 'an umbrella mite floats down slowly')
const kite = ropeway.foes.find((f) => f.kind === 'paper-kite')!
const kiteYs = new Set<number>()
for (let i = 0; i < 120; i++) {
  ropeway.update(emptyInput())
  kiteYs.add(Math.round(kite.y))
}
assert.ok(kiteYs.size > 10, 'a paper kite rides the air')

const windmill = lab(17)
const windCol = windmill.windy.indexOf(1)
assert.ok(windCol > 0, '5-2 has a wind corridor')
assert.ok(windmill.windAt(windCol * TILE + 4, 10) < 0, 'gusts blow a headwind')
assert.equal(windmill.windAt(windCol * TILE + 4, 200), 0, 'and then calm')
assert.equal(windmill.windAt(2 * TILE, 10), 0, 'outside the corridor is still')

const yard = lab(18)
const crate = yard.cargo[0]!
for (let i = 0; i < 800 && crate.state !== 'landed'; i++) {
  yard.immune = 99
  yard.update(emptyInput())
}
assert.equal(crate.state, 'landed', 'falling cargo lands')
assert.ok(yard.platforms.includes(crate.pad!), 'landed cargo is a step')

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
