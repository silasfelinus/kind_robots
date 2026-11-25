// Save the Plumber Gen-2 world maps and save slots (conductor save-the-plumber
// t-002, t-011, t-024; projects/kr-arcade/GEN2-STANDARD.md sections 1 and 3):
// the GEN2-WORLDS.md graph as walkable painted maps whose paths open as nodes
// are cleared, nodes not built yet that never block the road, three save
// slots keyed by node, and every older save carried forward.
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { emptyInput } from '../arcade/types'
import { createSavePlumberPreview } from '../arcade/games/savePlumberPreview'
import {
  CAMPAIGN,
  CHAPEL_COURSES,
  parseStage,
  SOLID_BLOCK,
  TILE,
  VERDIGRIS_CHAPEL,
} from '../arcade/games/savePlumberLevels'
import { MAP_CLIP_WORLDS } from '../arcade/games/savePlumberMapClips'
import {
  OVERWORLD,
  SECRET_EXITS_READY,
  SKY_WORLD,
  WORLD_COUNT,
  completionPercent,
  mapNode,
  newlyOpened,
  nodeBuilt,
  nodeReachable,
  openPaths,
  stageNode,
  startId,
  stepFrom,
  worldCompletion,
} from '../arcade/games/savePlumberOverworld'
import {
  readPlumberFile,
  readPlumberSave,
} from '../arcade/games/savePlumberSave'

// --- The graph (conductor validate_gen2_worlds.py, ported) ----------------------
assert.equal(WORLD_COUNT, 8)
assert.equal(SKY_WORLD, 9, 'the Upstream Sky is the special ninth map')
const nodes = OVERWORLD.flatMap((w) => w.nodes)
assert.equal(new Set(nodes.map((n) => n.id)).size, nodes.length, 'ids unique')
for (const node of nodes) {
  assert.match(node.id, /^[a-z0-9-]+$/)
  assert.ok(node.x >= 20 && node.x <= 460, `${node.id} sits on screen`)
  assert.ok(node.y >= 40 && node.y <= 230, `${node.id} clears the bars`)
}
for (const path of OVERWORLD.flatMap((w) => w.paths)) {
  assert.ok(mapNode(path.from) && mapNode(path.to), `${path.from}->${path.to}`)
  if (path.unlock) assert.ok(mapNode(path.unlock.node), path.unlock.node)
}
for (const def of CAMPAIGN)
  assert.equal(stageNode(def.code)?.stage, def.code, `${def.code} has a node`)
assert.equal(
  nodes.filter((n) => n.stage).length,
  CAMPAIGN.length,
  'each Gen-1 stage is played from exactly one node',
)
for (const world of MAP_CLIP_WORLDS)
  assert.ok(
    existsSync(`public/save-the-plumber/maps/world-${world}.mp4`) &&
      existsSync(`public/save-the-plumber/maps/world-${world}.webm`),
    `world ${world}'s motion loop ships`,
  )
for (const map of OVERWORLD)
  assert.equal(
    map.clip !== null,
    MAP_CLIP_WORLDS.includes(map.world),
    `world ${map.world} plays a motion loop only once one has shipped`,
  )
for (const map of OVERWORLD) {
  if (map.special) continue
  assert.equal(map.nodes.filter((n) => n.kind === 'castle').length, 1)
  assert.ok(map.plate, `world ${map.world} has a painted plate`)
  assert.ok(existsSync(`public${map.plate}`), `${map.plate} ships`)
}
// With every node cleared by both exits, everything is reachable.
const all = { done: nodes.map((n) => n.id), secrets: nodes.map((n) => n.id) }
for (const node of nodes) assert.ok(nodeReachable(node.id, all), node.id)
// With normal exits alone, every castle and the last one are still reachable.
const normal = {
  done: nodes.filter((n) => n.world !== SKY_WORLD).map((n) => n.id),
}
for (const map of OVERWORLD.filter((w) => !w.special)) {
  const castle = map.nodes.find((n) => n.kind === 'castle')!
  assert.ok(nodeReachable(castle.id, normal), `${castle.id} needs no secret`)
}
assert.ok(
  OVERWORLD.find((w) => w.world === SKY_WORLD)!.nodes.every(
    (n) => !nodeReachable(n.id, normal),
  ),
  'the Upstream Sky is reached only through secret exits',
)

// --- Walking the first world -----------------------------------------------------
const fresh = { done: [] as string[] }
assert.ok(nodeReachable(startId(1), fresh))
assert.ok(nodeReachable('1-1', fresh), 'the first course is open')
assert.ok(!nodeReachable('1-2', fresh), '1-2 waits for 1-1')
assert.equal(stepFrom(startId(1), 'right', fresh)?.to.id, '1-1')
assert.equal(stepFrom('1-1', 'left', fresh)?.to.id, startId(1), 'both ways')

const afterOne = { done: ['1-1'] }
assert.deepEqual(
  newlyOpened(fresh, afterOne).map((p) => p.to),
  ['1-2'],
  'clearing 1-1 opens exactly the path to 1-2',
)
// 1-h (the Drip Parlour) is designed but not built: clearing 1-2 reaches it,
// and its normal path on opens at once, so the road never blocks.
const h = mapNode('1-h')!
assert.equal(h.kind, 'house')
assert.equal(nodeBuilt(h), false)
const afterTwo = { done: ['1-1', '1-2'] }
assert.ok(nodeReachable('1-h', afterTwo))
assert.ok(nodeReachable('1-3', afterTwo), 'walk through an unbuilt node')
assert.ok(
  !nodeReachable('1-b', afterTwo),
  'but its secret exit (the cottage) waits until the house is built',
)

// Completion counts only what can be played today.
const w1 = worldCompletion(1, { done: ['1-1', '1-2'], gears: ['1-1'] })
assert.deepEqual(
  [w1.stages, w1.stagesDone, w1.gears, w1.gearsFound, w1.secrets],
  [5, 2, 4, 1, 1],
)
assert.equal(completionPercent(fresh), 0)
const everything = CAMPAIGN.map((s) => s.code)
assert.equal(
  completionPercent({
    done: [
      ...everything.map((c) => stageNode(c)!.id),
      ...CHAPEL_COURSES.map((c) => c.code),
    ],
    gears: everything,
    secrets: [...SECRET_EXITS_READY],
  }),
  100,
)
assert.ok(openPaths(fresh).length > 0)

// --- Save files --------------------------------------------------------------
// A version-1 save lands in file 1, everything before its stage cleared, by node.
const v1 = {
  v: 1,
  heroine: 7,
  stage: 5,
  score: 4200,
  lives: 2,
  tokens: 5,
  gears: ['1-1', 'nope'],
}
const migrated = readPlumberFile(v1)
assert.equal(migrated.v, 3)
assert.deepEqual(migrated.slots[0]!.done, [
  '1-1',
  '1-2',
  '1-3',
  '1-castle',
  '2-1',
])
assert.equal(
  migrated.slots[0]!.node,
  '2-3',
  'Gen-1 stage 2-2 is node 2-3: she stands where she left off',
)
assert.deepEqual(migrated.slots[0]!.gears, ['1-1'])
assert.equal(readPlumberSave(v1)!.stage, 5, 'the front page still reads it')
// A version-2 file (Gen-1 codes on the map) moves through each node's stage.
const v2 = readPlumberFile({
  v: 2,
  active: 1,
  endlessBest: 40,
  slots: [
    null,
    {
      heroine: 2,
      stage: 4,
      node: '2-2',
      done: ['1-1', '1-2', '1-3', '1-4'],
      score: 10,
      lives: 3,
      tokens: 0,
      gears: ['1-4'],
    },
    null,
  ],
})
assert.equal(v2.active, 1)
assert.equal(v2.endlessBest, 40)
assert.deepEqual(v2.slots[1]!.done, ['1-1', '1-2', '1-3', '1-castle'])
assert.equal(v2.slots[1]!.node, '2-3')
assert.deepEqual(v2.slots[1]!.gears, ['1-4'], 'gears stay stage codes')
assert.deepEqual(
  readPlumberFile({ v: 3, active: 9, slots: 'x', endlessBest: -1 }),
  {
    v: 3,
    active: 0,
    slots: [null, null, null],
    endlessBest: 0,
    album: { done: [], secrets: [], gears: [], heroines: [], endings: [] },
  },
  'junk reads as an empty file',
)

const options = (resume?: unknown) => ({
  rng: () => 0.5,
  sound: { play() {} },
  demo: false,
  hiScore: 0,
  resume,
})
const input = emptyInput()
type Game = ReturnType<typeof createSavePlumberPreview>
function press(
  game: Game,
  button: 'a' | 'b' | 'y' | 'start' | 'up' | 'down' | 'left' | 'right',
) {
  input.pressed[button] = true
  game.update(input)
  input.pressed[button] = false
}
function settle(game: Game) {
  for (let i = 0; i < 160 && (game.mapWalk || game.mapRevealTimer); i++)
    game.update(input)
}
function walk(game: Game, dir: 'up' | 'down' | 'left' | 'right') {
  press(game, dir)
  settle(game)
}
function clearStage(game: Game) {
  assert.equal(game.mode, 'play')
  ;(game as unknown as { stageClear(): void }).stageClear()
  for (let i = 0; i < 2000 && (game.mode as string) !== 'map'; i++) {
    if ((game.mode as string) === 'victory' && game.modeTimer < 400)
      press(game, 'a')
    else game.update(input)
  }
  assert.equal(game.mode, 'map', 'a cleared stage hands back to the map')
  settle(game)
}

// A new adventure: file select, heroine, story, map, 1-1, and back to the map.
const game = createSavePlumberPreview(options())
assert.equal(game.save, null, 'nothing is saved before a file exists')
press(game, 'start')
assert.equal(game.mode, 'files')
press(game, 'down')
press(game, 'a')
assert.equal(game.mode, 'select', 'file 2 starts a new adventure')
press(game, 'a')
press(game, 'start')
assert.equal(game.mode, 'map')
assert.equal(game.mapNodeId, startId(1))
assert.equal(readPlumberFile(game.save).active, 1, 'playing file 2')
press(game, 'a')
assert.equal(game.mode, 'map', 'a trailhead is not a stage')
walk(game, 'right')
assert.equal(game.mapNodeId, '1-1', 'walks to 1-1')
press(game, 'a')
press(game, 'a')
clearStage(game)
assert.ok(game.done.has('1-1'))
walk(game, 'right')
assert.equal(game.mapNodeId, '1-2', 'the new path is walkable')
press(game, 'a')
press(game, 'a')
clearStage(game)
walk(game, 'right')
assert.equal(game.mapNodeId, '1-h', 'on to the Drip Parlour')
press(game, 'a')
assert.equal(game.mode, 'map', 'an unbuilt node says coming soon')
assert.ok(game.mapToast > 0)
walk(game, 'up')
assert.equal(game.mapNodeId, '1-3', 'and she walks on through it')

// The file remembers the map, the clears and the slot.
const saved = readPlumberFile(game.save)
assert.equal(saved.v, 3)
assert.equal(saved.active, 1)
assert.equal(saved.slots[0], null, 'file 1 untouched')
assert.deepEqual(saved.slots[1]!.done, ['1-1', '1-2'])
assert.equal(saved.slots[1]!.node, '1-3')

// A new session continues file 2 on the map, where she stood.
const next = createSavePlumberPreview(options(game.save))
press(next, 'start')
assert.equal(next.slotCursor, 1, 'the last file played is highlighted')
press(next, 'a')
assert.equal(next.mode, 'map')
assert.equal(next.mapNodeId, '1-3')
assert.ok(next.done.has('1-2'))

const hidden = createSavePlumberPreview(options(game.save))
press(hidden, 'start')
press(hidden, 'a')
press(hidden, 'a')
press(hidden, 'a')
assert.equal(hidden.stage.code, '1-3')
assert.equal(hidden.mode, 'play')
assert.ok(SECRET_EXITS_READY.has('1-3'))
assert.ok(!nodeReachable('1-c', hidden.progress))
const exit = hidden.secretGoal!
hidden.foes.length = 0
hidden.hero = { x: exit.x, y: exit.y - 64, vx: 0, vy: 0 }
hidden.ground = false
press(hidden, 'down')
assert.equal(hidden.mode, 'play', 'airborne Down cannot activate the exit')
hidden.hero = { x: exit.x, y: exit.y - 20, vx: 0, vy: 0 }
hidden.ground = true
hidden.update(input)
assert.equal(hidden.mode, 'play', 'touching the secret exit does not clear')
input.held.down = true
hidden.update(input)
input.held.down = false
assert.equal(hidden.mode, 'play', 'holding Down is not a fresh exit press')
press(hidden, 'down')
assert.equal(hidden.mode, 'clear')
for (let i = 0; i < 200 && hidden.modeTimer; i++) hidden.update(input)
assert.equal(hidden.mode, 'map')
assert.ok(hidden.secrets.has('1-3'))
assert.ok(!hidden.done.has('1-3'), 'normal clear remains a separate reward')
assert.ok(nodeReachable('1-c', hidden.progress), 'the chapel path opens')
assert.ok(!nodeReachable('1-f', hidden.progress), 'normal path stays locked')
const resumedSecret = createSavePlumberPreview(options(hidden.save))
assert.ok(resumedSecret.secrets.has('1-3'), 'secret exit survives reload')
assert.ok(nodeReachable('1-c', resumedSecret.progress))
assert.equal(worldCompletion(1, hidden.progress).secretsFound, 1)
assert.equal(exit.y, 7 * TILE)

// The secret branch leads to a real course, not a map-only reward.
assert.ok(nodeBuilt(mapNode('1-c')))
const chapel = createSavePlumberPreview(options(hidden.save))
chapel.loadStage(0)
assert.equal(chapel.solidAt(10, 18), 0, 'outlines are not collision')
press(chapel, 'start')
press(chapel, 'a')
walk(chapel, 'left')
assert.equal(chapel.mapNodeId, '1-c')
press(chapel, 'a')
press(chapel, 'a')
assert.equal(chapel.stage.code, VERDIGRIS_CHAPEL.code)
assert.equal(chapel.mode, 'play')
assert.ok(!chapel.done.has('1-c'), 'entry alone does not press the valve')
const chapelGoal = chapel.goal!
chapel.hero = { x: chapelGoal.x, y: chapelGoal.y - 20, vx: 0, vy: 0 }
chapel.ground = true
chapel.update(input)
assert.equal(chapel.mode, 'clear')
for (let i = 0; i < 200 && chapel.modeTimer; i++) chapel.update(input)
assert.equal(chapel.mode, 'map')
assert.ok(chapel.done.has('1-c'))
const powered = createSavePlumberPreview(options(chapel.save))
powered.loadStage(0)
assert.equal(powered.solidAt(10, 18), SOLID_BLOCK)
assert.equal(powered.solidAt(19, 15), SOLID_BLOCK)
powered.loadStage(1)
assert.equal(powered.solidAt(7, 17), SOLID_BLOCK)
const freshSlot = createSavePlumberPreview(options())
freshSlot.loadStage(0)
assert.equal(freshSlot.solidAt(10, 18), 0, 'new slots stay unpowered')

// Every additional built secret route uses the real stage and saved map node.
// A secret clear must open its authored branch, never silently clear the course.
for (const [code, target] of [
  ['3-2', '3-c'],
  ['3-3', 'sky-2'],
  ['4-3', '4-c'],
  ['5-2', 'sky-3'],
  ['6-2', '6-c'],
  ['7-3', 'sky-5'],
] as const) {
  const index = CAMPAIGN.findIndex((stage) => stage.code === code)
  const node = stageNode(code)!
  assert.ok(SECRET_EXITS_READY.has(node.id), code)
  const prior = CAMPAIGN.slice(0, index).map(
    (stage) => stageNode(stage.code)!.id,
  )
  const run = createSavePlumberPreview(
    options({
      v: 3,
      active: 0,
      slots: [
        {
          heroine: 3,
          stage: index,
          node: node.id,
          done: prior,
          score: 0,
          lives: 3,
          tokens: 0,
        },
        null,
        null,
      ],
    }),
  )
  press(run, 'start')
  press(run, 'a')
  assert.equal(run.mapNodeId, node.id)
  assert.ok(!nodeReachable(target, run.progress), target + ' starts locked')
  press(run, 'a')
  press(run, 'a')
  assert.equal(run.stage.code, code)
  assert.equal(run.mode, 'play')
  const exit = run.secretGoal!
  run.foes.length = 0
  run.hero = { x: exit.x, y: exit.y - 20, vx: 0, vy: 0 }
  run.ground = true
  run.update(input)
  assert.equal(run.mode, 'play', code + ': no automatic clear')
  press(run, 'down')
  assert.equal(run.mode, 'clear', code + ': deliberate secret clear')
  for (let i = 0; i < 200 && run.modeTimer; i++) run.update(input)
  assert.equal(run.mode, 'map')
  assert.ok(run.secrets.has(node.id))
  assert.ok(!run.done.has(node.id))
  assert.ok(nodeReachable(target, run.progress))
  const reload = createSavePlumberPreview(options(run.save))
  assert.ok(reload.secrets.has(node.id))
  assert.ok(nodeReachable(target, reload.progress))
  assert.equal(worldCompletion(node.world, reload.progress).secretsFound, 1)
}

// Every chapel is a playable, independently persistent optional course.
for (const course of CHAPEL_COURSES.slice(1)) {
  const target = mapNode(course.code)!
  const stage = parseStage(course)
  assert.ok(nodeBuilt(target), course.code)
  assert.equal(stage.spawns.filter((s) => s.kind === 'goal').length, 1)
  const index = CAMPAIGN.findIndex((s) => s.code === `${target.world}-1`)
  const source = CAMPAIGN[index]!
  const block = source.switchBlocks!.find((b) => b.chapel === course.code)!
  const run = createSavePlumberPreview(
    options({
      v: 3,
      active: 0,
      slots: [
        {
          heroine: 3,
          stage: index,
          node: course.code,
          done: [],
          score: 0,
          lives: 3,
          tokens: 0,
        },
        null,
        null,
      ],
    }),
  )
  run.loadStage(index)
  assert.equal(run.solidAt(block.from, block.row), 0)
  press(run, 'start')
  press(run, 'a')
  assert.equal(run.mapNodeId, course.code)
  press(run, 'a')
  press(run, 'a')
  assert.equal(run.stage.code, course.code)
  assert.equal(run.mode, 'play')
  assert.ok(!run.done.has(course.code))
  const lives = run.lives
  run.hero.y = run.stage.rows * TILE + 60
  for (let i = 0; i < 600 && run.lives === lives; i++) run.update(input)
  assert.equal(run.stage.code, course.code, 'death reloads the same chapel')
  assert.equal(run.mode, 'play')
  assert.ok(!run.done.has(course.code))
  const goal = run.goal!
  run.hero = { x: goal.x, y: goal.y - 20, vx: 0, vy: 0 }
  run.ground = true
  run.update(input)
  assert.equal(run.mode, 'clear')
  for (let i = 0; i < 200 && run.modeTimer; i++) run.update(input)
  assert.equal(run.mode, 'map')
  assert.ok(run.done.has(course.code))
  const reload = createSavePlumberPreview(options(run.save))
  reload.loadStage(index)
  for (let col = block.from; col <= block.to; col++)
    assert.equal(reload.solidAt(col, block.row), SOLID_BLOCK)
  for (const other of CHAPEL_COURSES)
    if (other.code !== course.code) assert.ok(!reload.done.has(other.code))
  const fresh = createSavePlumberPreview(options())
  fresh.loadStage(index)
  assert.equal(fresh.solidAt(block.from, block.row), 0)
}

// Deaths are remembered on the slot.
press(next, 'a')
press(next, 'a')
const before = next.deaths
next.hero.y = next.stage.rows * 16 + 60
for (let i = 0; i < 600 && next.deaths === before; i++) next.update(input)
assert.equal(next.deaths, before + 1, 'a lost life is counted')

// Erasing takes two presses of Y, and B backs out.
const eraser = createSavePlumberPreview(options(game.save))
press(eraser, 'start')
press(eraser, 'y')
assert.equal(eraser.eraseArmed, true)
press(eraser, 'b')
assert.equal(eraser.eraseArmed, false, 'B keeps the file')
assert.ok(readPlumberFile(eraser.save).slots[1])
press(eraser, 'y')
press(eraser, 'y')
assert.equal(readPlumberFile(eraser.save).slots[1], null, 'Y twice erases it')

// A world's castle opens the road to the next world.
const castle = createSavePlumberPreview(
  options({
    v: 3,
    active: 0,
    slots: [
      {
        heroine: 3,
        stage: 3,
        node: '1-castle',
        done: ['1-1', '1-2', '1-3'],
        score: 0,
        lives: 3,
        tokens: 0,
      },
      null,
      null,
    ],
    endlessBest: 0,
  }),
)
press(castle, 'start')
press(castle, 'a')
assert.equal(castle.mapNodeId, '1-castle')
press(castle, 'a')
assert.equal(castle.stage.code, '1-4', 'the castle plays Gen-1 1-4')
press(castle, 'a')
clearStage(castle)
assert.ok(castle.done.has('1-castle'))
walk(castle, 'right')
assert.equal(castle.mapNodeId, startId(2), 'onward to World 2')
assert.equal(mapNode(castle.mapNodeId)!.world, 2)
assert.equal(castle.stage.code, '2-1')

console.log(
  'Save the Plumber Gen-2 overworld: the GEN2-WORLDS graph (8 painted worlds + the Upstream Sky) validated, paths opened by clears, unbuilt nodes never block, castle roads, three node-keyed save files with v1/v2 migration, erase, deaths and time remembered',
)
