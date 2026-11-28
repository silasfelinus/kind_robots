// Save the Plumber Gen-2 world maps and save slots (conductor save-the-plumber
// t-002, t-011, t-024; projects/kr-arcade/GEN2-STANDARD.md sections 1 and 3):
// the GEN2-WORLDS.md graph as walkable painted maps whose paths open as nodes
// are cleared, nodes not built yet that never block the road, three save
// slots keyed by node, and every older save carried forward.
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { PlumberCloud } from '../../stores/helpers/plumberCloud'
import { emptyInput } from '../arcade/types'
import { createSavePlumberPreview } from '../arcade/games/savePlumberPreview'
import {
  CAMPAIGN,
  CHAPEL_COURSES,
  GEAR_COURSE_CODES,
  DRIP_PARLOUR,
  RUSTBOLT_KEEP,
  SLUICEGATE_STEPS,
  optionalCourse,
  optionalCourseAtNode,
  HUSH_DOOR_OFFSETS,
  HUSH_FLOOR_ROW,
  hushDestination,
  parseStage,
  SOLID_BLOCK,
  SOLID_LOCK,
  SOLID_LADDER,
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
  archivePlumberRun,
  PLUMBER_RUN_HISTORY_LIMIT,
  readPlumberFile,
  readPlumberSave,
  validPlumberCloudSave,
  reconcilePlumberSaves,
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
// The Drip Parlour is now playable. Its ordinary exit opens the main road,
// and its alternate exit opens the bonus cottage.
const h = mapNode('1-h')!
assert.equal(h.kind, 'house')
assert.equal(nodeBuilt(h), true)
const afterTwo = { done: ['1-1', '1-2'] }
assert.ok(nodeReachable('1-h', afterTwo))
assert.ok(!nodeReachable('1-3', afterTwo), 'the playable house must be cleared')
assert.ok(
  !nodeReachable('1-b', afterTwo),
  'the cottage waits for the house secret exit',
)

// Completion counts only what can be played today.
const w1 = worldCompletion(1, { done: ['1-1', '1-2'], gears: ['1-1'] })
assert.deepEqual(
  [w1.stages, w1.stagesDone, w1.gears, w1.gearsFound, w1.secrets],
  [8, 2, 5, 1, 2],
)
assert.equal(completionPercent(fresh), 0)
const everything = CAMPAIGN.map((s) => s.code)
assert.equal(
  completionPercent({
    done: [
      ...everything.map((c) => stageNode(c)!.id),
      ...CHAPEL_COURSES.map((c) => c.code),
      DRIP_PARLOUR.code,
      RUSTBOLT_KEEP.code,
      '1-4',
    ],
    gears: [...GEAR_COURSE_CODES],
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

// Cloud storage accepts the same canonical file as the cabinet, never junk
// that would silently normalize into an empty adventure.
const cloud = readPlumberFile(v2)
assert.ok(validPlumberCloudSave(cloud))
assert.ok(validPlumberCloudSave(readPlumberFile(null)))
assert.ok(
  validPlumberCloudSave({
    album: cloud.album,
    endlessBest: cloud.endlessBest,
    slots: cloud.slots,
    active: cloud.active,
    v: cloud.v,
  }),
  'JSON property order is not part of the save format',
)
assert.ok(!validPlumberCloudSave(v1), 'migrate before writing to cloud')
assert.ok(!validPlumberCloudSave({ ...cloud, active: 3 }))
assert.ok(!validPlumberCloudSave({ ...cloud, slots: [null] }))
assert.ok(!validPlumberCloudSave({ ...cloud, userId: 10 }))
assert.ok(!validPlumberCloudSave({ ...cloud, endlessBest: -1 }))
assert.ok(
  !validPlumberCloudSave({
    ...cloud,
    album: { ...cloud.album, done: ['nonexistent-node'] },
  }),
)
assert.ok(
  !validPlumberCloudSave({
    ...cloud,
    slots: [null, { ...cloud.slots[1], lives: 0 }, null],
  }),
)
assert.ok(
  !validPlumberCloudSave({
    ...cloud,
    slots: [null, { ...cloud.slots[1], power: 'unknown-power' }, null],
  }),
)
assert.ok(
  !validPlumberCloudSave({
    ...cloud,
    album: { ...cloud.album, gears: Array(9000).fill('1-1') },
  }),
)
const erasedSlot = readPlumberFile({
  ...cloud,
  slots: [null, null, null],
})
assert.ok(validPlumberCloudSave(erasedSlot))
assert.deepEqual(erasedSlot.album, cloud.album, 'album survives slot erasure')

const otherDevice = readPlumberFile({
  ...cloud,
  slots: [migrated.slots[0], cloud.slots[1], null],
  endlessBest: 85,
})
const independent = reconcilePlumberSaves(erasedSlot, otherDevice, cloud)
assert.equal(independent.status, 'merged')
if (independent.status === 'merged') {
  assert.deepEqual(independent.save.slots, [migrated.slots[0], null, null])
  assert.equal(independent.save.endlessBest, 85)
  assert.ok(independent.save.album.gears.includes('1-1'))
  assert.ok(independent.save.album.gears.includes('1-4'))
  assert.ok(validPlumberCloudSave(independent.save))
}
const progressed = readPlumberFile({
  ...cloud,
  slots: [null, { ...cloud.slots[1], score: 500 }, null],
})
assert.deepEqual(reconcilePlumberSaves(erasedSlot, progressed, cloud), {
  status: 'conflict',
  slots: [1],
})
assert.deepEqual(reconcilePlumberSaves(cloud, progressed, null), {
  status: 'conflict',
  slots: [1],
})
const firstSync = reconcilePlumberSaves(migrated, cloud, null)
assert.equal(firstSync.status, 'merged')
if (firstSync.status === 'merged') {
  assert.deepEqual(firstSync.save.slots, [
    migrated.slots[0],
    cloud.slots[1],
    null,
  ])
  assert.ok(validPlumberCloudSave(firstSync.save))
}
const sameReset = reconcilePlumberSaves(erasedSlot, erasedSlot, cloud)
assert.equal(sameReset.status, 'merged')
if (sameReset.status === 'merged') assert.deepEqual(sameReset.save, erasedSlot)
const remoteOnly = reconcilePlumberSaves(cloud, progressed, cloud)
assert.equal(remoteOnly.status, 'merged')
if (remoteOnly.status === 'merged')
  assert.deepEqual(remoteOnly.save, progressed)

const memoryId = (n: number) =>
  '00000000-0000-4000-8000-' + n.toString(16).padStart(12, '0')
const memorySlot = cloud.slots[1]!
const recorded = archivePlumberRun(
  cloud.album,
  memorySlot,
  'game-over',
  memoryId(1),
  100,
)
const archived = readPlumberFile({
  ...cloud,
  slots: [null, null, null],
  album: recorded,
})
assert.equal(archived.album.runs?.length, 1)
assert.equal(archived.album.runs?.[0]?.score, memorySlot.score)
assert.ok(validPlumberCloudSave(archived))
assert.deepEqual(
  archivePlumberRun(recorded, memorySlot, 'game-over', memoryId(1), 100),
  recorded,
)
const remoteHistory = readPlumberFile({
  ...archived,
  album: archivePlumberRun(
    cloud.album,
    memorySlot,
    'rivers-run-home',
    memoryId(2),
    200,
  ),
})
const combinedHistory = reconcilePlumberSaves(archived, remoteHistory, null)
assert.equal(combinedHistory.status, 'merged')
if (combinedHistory.status === 'merged') {
  assert.deepEqual(
    combinedHistory.save.album.runs?.map((memory) => memory.id),
    [memoryId(2), memoryId(1)],
  )
  assert.ok(validPlumberCloudSave(combinedHistory.save))
}
let fullHistory = recorded
for (let i = 2; i <= PLUMBER_RUN_HISTORY_LIMIT + 3; i++)
  fullHistory = archivePlumberRun(
    fullHistory,
    memorySlot,
    'game-over',
    memoryId(i),
    i + 100,
  )
assert.equal(fullHistory.runs?.length, PLUMBER_RUN_HISTORY_LIMIT)
assert.equal(fullHistory.runs?.[0]?.id, memoryId(PLUMBER_RUN_HISTORY_LIMIT + 3))
assert.ok(
  validPlumberCloudSave(readPlumberFile({ ...cloud, album: fullHistory })),
)
assert.ok(
  !validPlumberCloudSave({
    ...archived,
    album: { ...archived.album, runs: [{ id: 'invalid' }] },
  }),
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

// A new adventure: file select, heroine, name, story, map, 1-1, and back to the map.
const game = createSavePlumberPreview(options())
assert.equal(game.save, null, 'nothing is saved before a file exists')
press(game, 'start')
assert.equal(game.mode, 'files')
press(game, 'down')
press(game, 'a')
assert.equal(game.mode, 'select', 'file 2 starts a new adventure')
press(game, 'a')
assert.equal(game.mode, 'name', 'then she is named')
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
press(game, 'a')
assert.equal(game.stage.code, DRIP_PARLOUR.code)
assert.equal(game.mode, 'play')
const rooms = DRIP_PARLOUR.mazeRooms!
const useHouseDoor = (run: Game, room: number, side: 'left' | 'right') => {
  run.hero = {
    x: (rooms[room]!.col + HUSH_DOOR_OFFSETS[side]) * TILE + TILE / 2,
    y: HUSH_FLOOR_ROW * TILE - 20,
    vx: 0,
    vy: 0,
  }
  run.ground = true
  press(run, 'down')
}
assert.equal(hushDestination(rooms, 0, 'left'), 0)
useHouseDoor(game, 0, 'left')
assert.equal(game.hero.x, 12 * TILE + TILE / 2)
useHouseDoor(game, 0, 'right')
assert.equal(game.hero.x, 36 * TILE + TILE / 2)
assert.ok(game.checkpoints[0]!.reached)
const musicCamera = game.camera
useHouseDoor(game, 1, 'right')
assert.equal(game.hero.x, 12 * TILE + TILE / 2)
assert.ok(game.camera < musicCamera, 'false door loops back')
useHouseDoor(game, 0, 'right')
useHouseDoor(game, 1, 'left')
assert.equal(game.hero.x, 60 * TILE + TILE / 2)
useHouseDoor(game, 2, 'right')
assert.equal(game.mode, 'clear')
for (let i = 0; i < 200 && game.modeTimer; i++) game.update(input)
assert.equal(game.mode, 'map')
settle(game)
assert.ok(game.done.has('1-h'))
assert.ok(!game.secrets.has('1-h'))
assert.ok(nodeReachable('1-3', game.progress))
assert.ok(!nodeReachable('1-b', game.progress))
// Re-enter and find the higher hidden door, without changing normal progress.
press(game, 'a')
press(game, 'a')
useHouseDoor(game, 0, 'right')
useHouseDoor(game, 1, 'left')
const houseSecret = game.secretGoal!
game.hero = { x: houseSecret.x, y: houseSecret.y - 20, vx: 0, vy: 0 }
game.ground = true
press(game, 'down')
assert.equal(game.mode, 'clear')
for (let i = 0; i < 200 && game.modeTimer; i++) game.update(input)
settle(game)
assert.ok(game.secrets.has('1-h'))
assert.ok(nodeReachable('1-b', game.progress))
assert.ok(readPlumberFile(game.save).slots[1]!.secrets?.includes('1-h'))
walk(game, 'up')
assert.equal(game.mapNodeId, '1-3', 'the cleared house opens the road')

// The file remembers the map, the clears and the slot.
const saved = readPlumberFile(game.save)
assert.equal(saved.v, 3)
assert.equal(saved.active, 1)
assert.equal(saved.slots[0], null, 'file 1 untouched')
assert.deepEqual(saved.slots[1]!.done, ['1-1', '1-2', '1-h'])
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
const meterRoom = parseStage(CAMPAIGN.find((stage) => stage.code === '1-3')!)
assert.equal(meterRoom.doors.length, 2)
assert.deepEqual(meterRoom.doors, [
  { col: 9, row: 21, to: 1 },
  { col: 38, row: 4, to: 0 },
])
for (let row = 4; row <= 8; row++)
  assert.equal(hidden.solidAt(45, row), SOLID_LADDER)

function walkMeterTo(col: number) {
  const target = col * TILE + TILE / 2
  for (
    let frame = 0;
    frame < 180 && Math.abs(hidden.hero.x - target) > 3;
    frame++
  ) {
    const movement = emptyInput()
    if (hidden.hero.x < target) movement.held.right = true
    else movement.held.left = true
    hidden.update(movement)
    assert.equal(hidden.mode, 'play')
  }
  assert.ok(Math.abs(hidden.hero.x - target) <= 3, 'meter route is reachable')
}

walkMeterTo(9)
assert.ok(hidden.ground)
press(hidden, 'down')
assert.equal(hidden.hero.x, 38 * TILE + TILE / 2)
assert.ok(hidden.activePipeRoom)
const meterTokens = hidden.tokens
walkMeterTo(55)
for (let i = 0; i < 20; i++) hidden.update(emptyInput())
assert.equal(hidden.hero.y + 20, 9 * TILE, 'descent reaches the meter floor')
assert.equal(hidden.tokens, meterTokens + 2)
walkMeterTo(45)
const climbInput = emptyInput()
climbInput.held.up = true
hidden.update(climbInput)
assert.ok(hidden.climbing, 'the shaft ladder is reachable from below')
for (let i = 0; i < 100 && hidden.climbing; i++) hidden.update(climbInput)
assert.ok(hidden.ground)
assert.equal(hidden.hero.y + 20, 4 * TILE)
walkMeterTo(38)
press(hidden, 'down')
assert.equal(hidden.hero.x, 9 * TILE + TILE / 2)
assert.equal(hidden.activePipeRoom, undefined)
assert.equal(hidden.deaths, 0)
assert.equal(hidden.mode, 'play')
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
assert.equal(worldCompletion(1, hidden.progress).secretsFound, 2)
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

// Rustbolt's main road is gated by two real keys, not a map bypass.
const keep = createSavePlumberPreview(
  options({
    v: 3,
    active: 0,
    slots: [
      {
        heroine: 3,
        stage: 2,
        node: '1-f',
        done: ['1-1', '1-2', '1-h', '1-3'],
        score: 0,
        lives: 3,
        tokens: 0,
      },
      null,
      null,
    ],
  }),
)
assert.ok(nodeBuilt(mapNode('1-f')))
assert.ok(!nodeReachable('1-4', keep.progress))
press(keep, 'start')
press(keep, 'a')
assert.equal(keep.mapNodeId, '1-f')
press(keep, 'a')
press(keep, 'a')
assert.equal(keep.stage.code, RUSTBOLT_KEEP.code)
assert.equal(keep.mode, 'play')
assert.equal(keep.keys.length, 2)
assert.equal(keep.solidAt(28, 20), SOLID_LOCK)
assert.equal(keep.solidAt(64, 20), SOLID_LOCK)
const keepInput = emptyInput()
keepInput.held.right = true
for (let i = 0; i < 2000 && !keep.locked; i++) keep.update(keepInput)
assert.equal(keep.mode, 'play', 'both key chambers are walkable')
assert.ok(keep.locked, 'the arena locks behind the player')
assert.equal(keep.boss?.name, 'Foreman Flange')
assert.equal(keep.boss?.hp, 3)
assert.ok(!nodeReachable('1-4', keep.progress))
// Approach the axle, stun incoming rollers, then kick them back. This
// exercises actual input and collision rather than calling hitBoss directly.
for (let i = 0; i < 5000 && keep.mode === 'play'; i++) {
  const frame = emptyInput()
  const boss = keep.boss!
  const roller = keep.foes.find(
    (foe) =>
      foe.kind === 'rivet-roller' &&
      !foe.fade &&
      (foe.state === 'walk' || foe.state === 'stunned'),
  )
  if (boss.hp > 0 && boss.state !== 'hurt') {
    const target = boss.x - 120
    if (keep.hero.x < target - 6) frame.held.right = true
    else if (keep.hero.x > target + 6) frame.held.left = true
    if (roller && Math.abs(roller.x - keep.hero.x) <= 42) {
      frame.held.right = roller.x > keep.hero.x
      frame.held.left = roller.x < keep.hero.x
      if (!keep.cooldown) frame.pressed.x = true
    }
  }
  keep.update(frame)
}
assert.equal(keep.boss?.hp, 0, 'roller counters defeat Foreman Flange')
assert.equal(keep.mode, 'clear')
assert.equal(keep.deaths, 0)
assert.ok(!keep.done.has('1-castle'))
assert.equal(keep.boltsOpened, 2)
assert.ok(keep.checkpoints[0]!.reached)
assert.ok(keep.keys.every((key) => key.state === 'used'))
for (let i = 0; i < 200 && keep.modeTimer; i++) keep.update(input)
assert.equal(keep.mode, 'map')
assert.ok(keep.done.has('1-f'))
assert.ok(nodeReachable('1-4', keep.progress))
const keepReload = createSavePlumberPreview(options(keep.save))
assert.ok(keepReload.done.has('1-f'))
assert.ok(nodeReachable('1-4', keepReload.progress))

// The dam has a separate runtime identity from the legacy castle stage.
assert.equal(stageNode('1-4')?.id, '1-castle')
assert.equal(stageNode(SLUICEGATE_STEPS.code)?.id, '1-4')
assert.equal(optionalCourse('1-4'), undefined)
assert.equal(optionalCourseAtNode('1-4'), SLUICEGATE_STEPS)
assert.equal(optionalCourseAtNode('1-castle'), undefined)
assert.ok(!nodeReachable('1-castle', keep.progress))
const sluice = createSavePlumberPreview(
  options({
    v: 3,
    active: 0,
    slots: [
      {
        heroine: 3,
        stage: 2,
        node: '1-4',
        done: ['1-1', '1-2', '1-h', '1-3', '1-f'],
        score: 0,
        lives: 3,
        tokens: 0,
      },
      null,
      null,
    ],
  }),
)
press(sluice, 'start')
press(sluice, 'a')
press(sluice, 'a')
press(sluice, 'a')
assert.equal(sluice.stage.code, SLUICEGATE_STEPS.code)
assert.equal(sluice.mode, 'play')
assert.equal(sluice.boss, null)
for (let row = 13; row <= 20; row++)
  assert.equal(sluice.solidAt(29, row), SOLID_LADDER)
const damInput = emptyInput()
damInput.held.right = true
for (let i = 0; i < 260; i++) sluice.update(damInput)
assert.equal(Math.floor(sluice.hero.x / TILE), 29)
const lowerCamera = sluice.cameraY
damInput.held.right = false
damInput.held.up = true
sluice.update(damInput)
assert.ok(sluice.climbing)
for (let i = 0; i < 100 && sluice.climbing; i++) sluice.update(damInput)
assert.ok(sluice.hero.y + 20 <= 13 * TILE + 1)
assert.ok(sluice.cameraY < lowerCamera)
damInput.held.up = false
damInput.held.right = true
for (let i = 0; i < 200 && !sluice.checkpoints[0]!.reached; i++)
  sluice.update(damInput)
assert.ok(sluice.checkpoints[0]!.reached)
const damRoom = parseStage(SLUICEGATE_STEPS)
assert.deepEqual(damRoom.doors, [
  { col: 47, row: 13, to: 1 },
  { col: 10, row: 5, to: 0 },
])

function walkDamTo(col: number) {
  const target = col * TILE + TILE / 2
  for (
    let frame = 0;
    frame < 180 && Math.abs(sluice.hero.x - target) > 3;
    frame++
  ) {
    const movement = emptyInput()
    if (sluice.hero.x < target) movement.held.right = true
    else movement.held.left = true
    sluice.update(movement)
    assert.equal(sluice.mode, 'play')
  }
  assert.ok(Math.abs(sluice.hero.x - target) <= 3)
}

walkDamTo(47)
press(sluice, 'down')
assert.equal(sluice.hero.x, 10 * TILE + TILE / 2)
assert.ok(sluice.activePipeRoom)
const inspectionTokens = sluice.tokens
walkDamTo(22)
for (let i = 0; i < 20; i++) sluice.update(emptyInput())
assert.equal(sluice.hero.y + 20, 10 * TILE)
assert.equal(sluice.tokens, inspectionTokens + 2)
assert.ok(sluice.gears.has(SLUICEGATE_STEPS.code))
assert.ok(!sluice.gears.has('1-4'))
assert.equal(worldCompletion(1, sluice.progress).gearsFound, 1)
walkDamTo(15)
const damClimb = emptyInput()
damClimb.held.up = true
sluice.update(damClimb)
assert.ok(sluice.climbing)
for (let i = 0; i < 100 && sluice.climbing; i++) sluice.update(damClimb)
assert.ok(sluice.ground)
walkDamTo(10)
press(sluice, 'down')
assert.equal(sluice.hero.x, 47 * TILE + TILE / 2)
assert.equal(sluice.activePipeRoom, undefined)
assert.equal(sluice.deaths, 0)
const damLives = sluice.lives
sluice.hero.y = sluice.stage.rows * TILE + 60
for (let i = 0; i < 600 && sluice.lives === damLives; i++) sluice.update(input)
assert.equal(sluice.stage.code, SLUICEGATE_STEPS.code)
assert.equal(sluice.mode, 'play')
assert.equal(sluice.hero.x, sluice.checkpoint.x)
assert.ok(sluice.checkpoints[0]!.reached)
for (let i = 0; i < 1000 && sluice.mode === 'play'; i++) sluice.update(damInput)
assert.equal(sluice.mode, 'clear')
for (let i = 0; i < 200 && sluice.modeTimer; i++) sluice.update(input)
assert.equal(sluice.mode, 'map')
assert.ok(sluice.done.has('1-4'))
assert.ok(!sluice.done.has('1-castle'))
assert.ok(nodeReachable('1-castle', sluice.progress))
const damReload = createSavePlumberPreview(options(sluice.save))
assert.ok(damReload.done.has('1-4'))
assert.ok(!damReload.done.has('1-castle'))
assert.ok(damReload.gears.has(SLUICEGATE_STEPS.code))
assert.ok(!damReload.gears.has('1-4'))
assert.ok(readPlumberFile(sluice.save).album.gears.includes('1-sluice'))

// Deaths are remembered on the slot.
press(next, 'a')
press(next, 'a')
const before = next.deaths
next.hero.y = next.stage.rows * 16 + 60
for (let i = 0; i < 600 && next.deaths === before; i++) next.update(input)
assert.equal(next.deaths, before + 1, 'a lost life is counted')
next.lives = 1
next.score = 12345
next.hero.y = next.stage.rows * TILE + 60
for (let i = 0; i < 600 && String(next.mode) !== 'over'; i++) next.update(input)
assert.equal(next.mode, 'over')
const lostAdventure = readPlumberFile(next.save)
assert.equal(lostAdventure.album.runs?.[0]?.outcome, 'game-over')
assert.equal(lostAdventure.album.runs?.[0]?.score, 12345)
assert.equal(lostAdventure.slots[lostAdventure.active]?.score, 0)
assert.ok(validPlumberCloudSave(lostAdventure))

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

async function verifyAccountSync() {
  type File = ReturnType<typeof readPlumberFile>
  const cache = new Map<string, unknown>()
  const remote = new Map<string, { save: File; revision: number }>()
  let displayed = readPlumberFile(null)
  const displayedSlot = () => displayed.slots[0]
  let status = ''
  let conflict: import('../../stores/helpers/plumberCloud').PlumberCloudConflict | null =
    null
  const getConflict = () => {
    assert.ok(conflict)
    return conflict
  }
  const cloud = new PlumberCloud({
    read: (owner) => cache.get(owner),
    write: (owner, entry) => void cache.set(owner, entry),
    get: async (token) => remote.get(token) ?? null,
    put: async (token, save, revision) => {
      const old = remote.get(token)
      if ((old?.revision ?? null) !== revision) {
        throw Object.assign(new Error('Save conflict'), { statusCode: 409 })
      }
      const next = (old?.revision ?? -1) + 1
      remote.set(token, { save, revision: next })
      return next
    },
    changed: (save, next, details) => {
      displayed = save
      status = next
      conflict = details
    },
  })
  const first = readPlumberFile({
    v: 3,
    active: 0,
    slots: [{ heroine: 3, stage: 0, score: 12, lives: 3, tokens: 0 }],
  })
  cloud.select('guest', first)
  assert.equal(displayedSlot()?.score, 12)
  await cloud.sync('41', '41', first)
  assert.equal(displayedSlot(), null, 'guest progress stays private')
  cloud.record('41', '41', first)
  await cloud.sync('41', '41', first)
  assert.equal(remote.get('41')?.save.slots[0]?.score, 12)
  await cloud.sync('42', '42', first)
  assert.equal(displayedSlot(), null, 'second account cannot see first')
  cloud.record('41', '41', first)
  assert.equal(displayedSlot(), null, 'old cabinet cannot write new owner')
  await cloud.sync('41', '41', first)
  assert.equal(displayedSlot()?.score, 12)
  const before = remote.get('41')!
  const other = readPlumberFile({
    ...before.save,
    slots: [{ ...before.save.slots[0], score: 99 }, null, null],
  })
  remote.set('41', { save: other, revision: before.revision + 1 })
  const local = readPlumberFile({
    ...before.save,
    slots: [{ ...before.save.slots[0], score: 24 }, null, null],
  })
  cloud.record('41', '41', local)
  await cloud.sync('41', '41', first)
  assert.equal(status, 'conflict')
  assert.equal(displayedSlot()?.score, 24, 'local conflicting run survives')
  assert.equal(remote.get('41')?.save.slots[0]?.score, 99)
  const stale = getConflict()
  remote.set('41', {
    save: readPlumberFile({
      ...other,
      slots: [{ ...other.slots[0], score: 101 }, null, null],
    }),
    revision: before.revision + 2,
  })
  await cloud.resolve('41', '41', 'device', stale)
  assert.equal(status, 'conflict', 'stale choice cannot overwrite new progress')
  assert.equal(displayedSlot()?.score, 24)
  assert.equal(remote.get('41')?.save.slots[0]?.score, 101)
  const refreshed = getConflict()
  await cloud.resolve('42', '42', 'device', refreshed)
  assert.equal(status, 'conflict', 'another owner cannot resolve this save')
  await cloud.resolve('41', '41', 'device', refreshed)
  assert.equal(status, 'synced')
  assert.equal(remote.get('41')?.save.slots[0]?.score, 24)
  assert.equal(displayedSlot()?.score, 24)

  const current = remote.get('41')!
  remote.set('41', {
    save: readPlumberFile({
      ...current.save,
      slots: [{ ...current.save.slots[0], score: 75 }, null, first.slots[0]],
    }),
    revision: current.revision + 1,
  })
  cloud.record(
    '41',
    '41',
    readPlumberFile({
      ...current.save,
      slots: [{ ...current.save.slots[0], score: 55 }, first.slots[0], null],
    }),
  )
  await cloud.sync('41', '41', first)
  assert.equal(status, 'conflict')
  await cloud.resolve('41', '41', 'account', getConflict())
  assert.equal(status, 'synced')
  assert.equal(displayedSlot()?.score, 75)
  assert.equal(displayed.slots[1]?.score, 12, 'independent local file survives')
  assert.equal(displayed.slots[2]?.score, 12, 'independent remote file survives')
  assert.deepEqual(displayed, remote.get('41')?.save)
  remote.delete('41')
  await cloud.sync('41', '41', first)
  assert.equal(status, 'conflict', 'missing account save requires a choice')
  const missing = getConflict()
  assert.equal(missing.revision, null)
  assert.deepEqual(missing.slots, [0, 1, 2])
  await cloud.resolve('41', '41', 'device', missing)
  assert.equal(status, 'synced')
  assert.equal(remote.get('41')?.save.slots[0]?.score, 75)
  cloud.select('guest', null)
  assert.equal(displayedSlot()?.score, 12, 'guest save survives sign-in')
}
await verifyAccountSync()
