// Save the Plumber Gen-2 world maps and save slots (conductor save-the-plumber
// t-002, t-011, t-024; projects/kr-arcade/GEN2-STANDARD.md sections 1 and 3):
// the GEN2-WORLDS.md graph as walkable painted maps whose paths open as nodes
// are cleared, nodes not built yet that never block the road, three save
// slots keyed by node, and every older save carried forward.
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { emptyInput } from '../arcade/types'
import { createSavePlumberPreview } from '../arcade/games/savePlumberPreview'
import { CAMPAIGN } from '../arcade/games/savePlumberLevels'
import {
  OVERWORLD,
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
  [4, 2, 4, 1, 0],
)
assert.equal(completionPercent(fresh), 0)
const everything = CAMPAIGN.map((s) => s.code)
assert.equal(
  completionPercent({
    done: everything.map((c) => stageNode(c)!.id),
    gears: everything,
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
  { v: 3, active: 0, slots: [null, null, null], endlessBest: 0 },
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
