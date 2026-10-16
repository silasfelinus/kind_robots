import assert from 'node:assert/strict'
import {
  FOE_ANIMATION,
  createSavePlumberPreview,
} from '../arcade/games/savePlumberPreview'
import { ENEMY_ANIMATIONS } from '../arcade/games/savePlumberAnimations'
import {
  CAMPAIGN,
  SOLID_GATE,
  SOLID_WATER,
  TILE,
  WORLD_ONE,
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
assert.equal(CAMPAIGN.length, 12)
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
assert.ok(
  parseStage(WORLD_TWO[0]!).solid.includes(SOLID_WATER),
  'the marina has water',
)
assert.ok(
  WORLD_THREE.some((d) => d.dark),
  'the orchard has unlit stages',
)
for (const world of [WORLD_ONE, WORLD_TWO, WORLD_THREE])
  assert.notEqual(
    parseStage(world[3]!).gate,
    null,
    `${world[3]!.code} ends in a boss arena`,
  )
assert.throws(() => parseStage({ code: 'x', name: 'x', rows: ['..', '.'] }))
assert.throws(() => parseStage({ code: 'x', name: 'x', rows: ['..'] }))

// Every stage is finishable: the predictive autopilot plays each one through.
const bosses = ['Madame Pressure', 'Captain Barnaclejack', 'The Overripe Baron']
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
  'Save the Plumber World 1: four finishable stages, controls, select and saves verified',
)
