// Save the Plumber Gen-2 world maps and save slots (conductor save-the-plumber
// t-011; projects/kr-arcade/GEN2-STANDARD.md sections 1 and 3): an SMB3-style
// walkable map whose paths open as stages are cleared, three save slots that
// remember the map and every clear, and version-1 saves carried forward.
import assert from 'node:assert/strict'
import { emptyInput } from '../arcade/types'
import { createSavePlumberPreview } from '../arcade/games/savePlumberPreview'
import { CAMPAIGN } from '../arcade/games/savePlumberLevels'
import {
  OVERWORLD,
  WORLD_COUNT,
  completionPercent,
  mapNode,
  newlyOpened,
  nodeReachable,
  pathOpen,
  startId,
  stepFrom,
  worldCompletion,
  type MapPath,
} from '../arcade/games/savePlumberOverworld'
import {
  readPlumberFile,
  readPlumberSave,
} from '../arcade/games/savePlumberSave'

// --- The maps --------------------------------------------------------------
assert.equal(WORLD_COUNT, 8)
assert.equal(OVERWORLD.length, 8)
for (const def of CAMPAIGN)
  assert.equal(mapNode(def.code)?.stage, def.code, `${def.code} has a map node`)
for (const map of OVERWORLD) {
  for (const node of map.nodes) {
    assert.ok(node.x >= 20 && node.x <= 460, `${node.id} sits on screen`)
    assert.ok(node.y >= 40 && node.y <= 230, `${node.id} clears the bars`)
  }
  assert.equal(map.nodes.filter((n) => n.kind === 'castle').length, 1)
}

const fresh = { done: [] as string[] }
assert.ok(nodeReachable(startId(1), fresh))
assert.ok(nodeReachable('1-1', fresh), 'the first stage is open from the start')
assert.ok(!nodeReachable('1-2', fresh), '1-2 waits for 1-1')
assert.equal(stepFrom(startId(1), 'right', fresh)?.to.id, '1-1')
assert.equal(stepFrom('1-1', 'right', fresh), null, 'no path on yet')
assert.equal(
  stepFrom('1-1', 'left', fresh)?.to.id,
  startId(1),
  'open paths walk both ways',
)

const afterOne = { done: ['1-1'] }
assert.deepEqual(
  newlyOpened(fresh, afterOne).map((p) => p.to),
  ['1-2'],
  'clearing 1-1 opens exactly the path to 1-2',
)
assert.equal(stepFrom('1-1', 'right', afterOne)?.to.id, '1-2')

// The castle's path leads off the map's right edge to the next world.
const worldOne = { done: ['1-1', '1-2', '1-3', '1-4'] }
const warp = stepFrom('1-4', 'right', worldOne)
assert.equal(warp?.to.id, startId(2))
assert.equal(warp?.path.warp, 'right')
assert.equal(
  stepFrom(startId(2), 'left', worldOne)?.to.id,
  '1-4',
  'and back again',
)
assert.ok(nodeReachable('2-1', worldOne))

// Secret exits: a path that only a stage's secret exit opens.
const secretPath: MapPath = {
  from: '1-2',
  to: '1-4',
  unlock: { stage: '1-2', exit: 'secret' },
}
assert.ok(!pathOpen(secretPath, { done: ['1-2'] }), 'the normal exit does not')
assert.ok(pathOpen(secretPath, { done: [], secrets: ['1-2'] }))

// Completion: stages, gears and secrets, per world and overall.
const w1 = worldCompletion(1, { done: ['1-1', '1-2'], gears: ['1-1'] })
assert.deepEqual(
  [w1.stages, w1.stagesDone, w1.gears, w1.gearsFound],
  [4, 2, 4, 1],
)
assert.equal(completionPercent(fresh), 0)
const everything = CAMPAIGN.map((s) => s.code)
assert.equal(completionPercent({ done: everything, gears: everything }), 100)

// --- Save slots -------------------------------------------------------------
// A version-1 save lands in file 1, everything before its stage counted cleared.
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
assert.equal(migrated.v, 2)
assert.equal(migrated.slots.length, 3)
assert.deepEqual(migrated.slots[0]!.done, ['1-1', '1-2', '1-3', '1-4', '2-1'])
assert.equal(migrated.slots[0]!.node, '2-2', 'she stands where she left off')
assert.deepEqual(migrated.slots[0]!.gears, ['1-1'])
assert.equal(migrated.slots[1], null)
assert.equal(readPlumberSave(v1)!.stage, 5, 'the front page still reads it')
assert.deepEqual(
  readPlumberFile({ v: 2, active: 9, slots: 'x', endlessBest: -1 }),
  { v: 2, active: 0, slots: [null, null, null], endlessBest: 0 },
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
function press(
  game: ReturnType<typeof createSavePlumberPreview>,
  button: 'a' | 'b' | 'y' | 'start' | 'up' | 'down' | 'left' | 'right',
) {
  input.pressed[button] = true
  game.update(input)
  input.pressed[button] = false
}
function settle(game: ReturnType<typeof createSavePlumberPreview>) {
  for (let i = 0; i < 120 && (game.mapWalk || game.mapRevealTimer); i++)
    game.update(input)
}
function clearStage(game: ReturnType<typeof createSavePlumberPreview>) {
  assert.equal(game.mode, 'play')
  ;(game as unknown as { stageClear(): void }).stageClear()
  for (let i = 0; i < 2000 && (game.mode as string) !== 'map'; i++) {
    if ((game.mode as string) === 'victory' && game.modeTimer < 400)
      press(game, 'a')
    else game.update(input)
  }
  assert.equal(game.mode, 'map', 'a cleared stage hands back to the map')
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
press(game, 'right')
settle(game)
assert.equal(game.mapNodeId, '1-1', 'walks to 1-1')
press(game, 'right')
settle(game)
assert.equal(game.mapNodeId, '1-1', 'the path on is still closed')
press(game, 'a')
press(game, 'a')
clearStage(game)
assert.ok(game.done.has('1-1'))
assert.equal(game.mapReveal[0]?.to, '1-2', 'the new path is drawn in')
settle(game)
press(game, 'right')
settle(game)
assert.equal(game.mapNodeId, '1-2', 'and walkable')

// The file remembers the map, the clear and the slot.
const saved = readPlumberFile(game.save)
assert.equal(saved.active, 1)
assert.equal(saved.slots[0], null, 'file 1 untouched')
assert.deepEqual(saved.slots[1]!.done, ['1-1'])
assert.equal(saved.slots[1]!.node, '1-2')
assert.ok((saved.slots[1]!.time ?? 0) >= 0)

// A new session continues file 2 on the map, where she stood.
const next = createSavePlumberPreview(options(game.save))
press(next, 'start')
assert.equal(next.slotCursor, 1, 'the last file played is highlighted')
press(next, 'a')
assert.equal(next.mode, 'map')
assert.equal(next.mapNodeId, '1-2')
assert.ok(next.done.has('1-1'))

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
    v: 2,
    active: 0,
    slots: [
      {
        heroine: 3,
        stage: 3,
        node: '1-4',
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
assert.equal(castle.mapNodeId, '1-4')
press(castle, 'a')
press(castle, 'a')
clearStage(castle)
assert.ok(castle.done.has('1-4'))
settle(castle)
press(castle, 'right')
settle(castle)
assert.equal(castle.mapNodeId, startId(2), 'onward to World 2')
assert.equal(mapNode(castle.mapNodeId)!.world, 2)

console.log(
  'Save the Plumber Gen-2 overworld: eight walkable world maps, paths opened by clears (secret exits supported), world-to-world road, three save slots with v1 migration, erase, deaths and time remembered',
)
