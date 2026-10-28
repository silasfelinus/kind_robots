import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { emptyInput } from '../arcade/types'
import {
  MAKER_GROUPS,
  MAKER_MAX_COLS,
  MAKER_MIN_ROWS,
  MAKER_MAX_ROWS,
  resizeMakerLevel,
  MAKER_SAVE_KEY,
  MAKER_TILES,
  makerRectangle,
  makerFloodFill,
  makerCopy,
  makerPaste,
  makerTemplate,
  decodeMakerLevel,
  encodeMakerLevel,
  makerId,
  newMakerLevel,
  paintMakerTile,
  toMakerStage,
  validateMakerLevel,
} from '../arcade/games/savePlumberMaker'
import {
  GIANT_FOES,
  SOLID_ICE,
  SOLID_FRAGILE_ICE,
  SOLID_SNOWBANK,
  SOLID_WATER,
  STAGE_GLYPHS,
  parseStage,
} from '../arcade/games/savePlumberLevels'
import { createSavePlumberPreview } from '../arcade/games/savePlumberPreview'

const source = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8')

const supported = new Set(STAGE_GLYPHS)
assert.deepEqual(
  [...MAKER_TILES].sort(),
  [...supported].sort(),
  'Every parser symbol must be available in the Maker, including every new runtime mechanic',
)
assert.equal(MAKER_GROUPS.length, 8)
assert.ok(
  MAKER_GROUPS.every((group) =>
    group.tiles.every((tile) => tile.icon && tile.label),
  ),
)
assert.ok(
  !MAKER_SAVE_KEY.includes('arcade:saves'),
  'Maker must use its own storage namespace',
)

const initial = newMakerLevel()
assert.equal(initial.rows.length, 24)
assert.equal(initial.rows[0]!.length, 64)
assert.equal(parseStage(toMakerStage(initial)).start.col, 3)
assert.equal((initial.rows.join('').match(/G/g) ?? []).length, 1)
assert.deepEqual(validateMakerLevel(initial), initial)

for (const cols of [32, 33, 64, MAKER_MAX_COLS]) {
  const level = newMakerLevel(cols)
  assert.equal(level.rows[0]!.length, cols)
  assert.deepEqual(decodeMakerLevel(encodeMakerLevel(level)), level)
  assert.equal(
    makerId(level),
    makerId(decodeMakerLevel(encodeMakerLevel(level))),
  )
}
const unicode = validateMakerLevel({
  ...initial,
  title: 'The ♡ of Moonlight',
  author: 'Möbius',
  dark: true,
  theme: 7,
})
assert.deepEqual(decodeMakerLevel(encodeMakerLevel(unicode)), unicode)
assert.notEqual(makerId(unicode), makerId(initial))

const giants = MAKER_GROUPS.find((group) => group.name === 'Giants')
assert.equal(giants?.tiles.length, Object.keys(GIANT_FOES).length)
assert.equal(giants?.tiles.length, 14)
for (const [glyph, kind] of Object.entries(GIANT_FOES)) {
  const variant = paintMakerTile(initial, 9, 20, glyph)
  const parsed = parseStage(toMakerStage(variant))
  assert.ok(
    parsed.spawns.some(
      (spawn) => spawn.col === 9 && spawn.kind === kind && spawn.giant,
    ),
  )
  const playable = createSavePlumberPreview(
    {
      rng: () => 0.5,
      sound: { play: () => undefined },
      demo: false,
      hiScore: 0,
    },
    { customLevel: toMakerStage(variant) },
  )
  assert.ok(
    playable.foes.some(
      (foe) => foe.kind === kind && foe.giant && foe.giantHits === 0,
    ),
  )
  assert.equal(playable.save, undefined)
}
const longer = resizeMakerLevel(initial, 72, 24)
assert.equal(longer.rows[0]!.length, 72)
assert.equal(
  longer.rows[23]!.slice(64),
  '#'.repeat(8),
  'Extending width continues the original ground',
)
assert.equal(parseStage(toMakerStage(longer)).start.col, 3)
const taller = resizeMakerLevel(longer, 72, 32)
assert.equal(taller.rows.length, 32)
assert.equal(parseStage(toMakerStage(taller)).start.row, 28)
assert.deepEqual(
  resizeMakerLevel(taller, 64, 24),
  initial,
  'Unused extension can be removed without losing authored tiles',
)
const tallPlayed = createSavePlumberPreview(
  { rng: () => 0.5, sound: { play: () => undefined }, demo: false, hiScore: 0 },
  { customLevel: toMakerStage(taller) },
)
assert.equal(tallPlayed.stage.rows, 32)
assert.equal(tallPlayed.stage.cols, 72)
assert.equal(tallPlayed.save, undefined)
assert.equal(
  resizeMakerLevel(initial, 64, MAKER_MIN_ROWS).rows.length,
  MAKER_MIN_ROWS,
)
assert.equal(
  resizeMakerLevel(initial, 64, MAKER_MAX_ROWS).rows.length,
  MAKER_MAX_ROWS,
)
assert.throws(() => resizeMakerLevel(initial, 24, 24), /width/)
assert.throws(() => resizeMakerLevel(initial, 64, 60), /height/)
assert.throws(() => resizeMakerLevel(initial, 48, 24), /right edge/)
assert.throws(
  () => resizeMakerLevel(paintMakerTile(initial, 7, 0, 'p'), 64, 16),
  /top/,
)
const editedEdge = paintMakerTile(longer, 71, 18, 'p')
assert.throws(() => resizeMakerLevel(editedEdge, 64, 24), /right edge/)
assert.deepEqual(decodeMakerLevel(encodeMakerLevel(taller)), taller)

const built = makerRectangle(initial, { x1: 10, y1: 17, x2: 14, y2: 19 }, 'B')
assert.equal(built.rows[17]!.slice(10, 15), 'BBBBB')
assert.equal(
  initial.rows[17]![10],
  '.',
  'rectangle must not mutate an earlier state',
)
assert.throws(
  () => makerRectangle(initial, { x1: 10, y1: 17, x2: 11, y2: 17 }, '@'),
  /one tile/,
)
const hollow = paintMakerTile(built, 12, 18, '.')
const filled = makerFloodFill(hollow, 12, 18, 'f')
assert.equal(filled.rows[18]![12], 'f')
assert.equal(filled.rows[18]![11], 'B')
assert.equal(makerFloodFill(filled, 12, 18, 'f'), filled)
assert.throws(() => makerFloodFill(initial, -1, 0, 'B'), /inside/)
const stamp = makerCopy(filled, { x1: 10, y1: 17, x2: 14, y2: 19 })
assert.equal(stamp.width, 5)
assert.equal(stamp.height, 3)
const stamped = makerPaste(filled, 22, 15, stamp)
assert.equal(stamped.rows[16]!.slice(22, 27), 'BBfBB')
assert.equal(filled.rows[16]![22], '.')
assert.throws(() => makerPaste(initial, 63, 23, stamp), /does not fit/)
const shifted = makerPaste(
  initial,
  8,
  17,
  makerCopy(initial, { x1: 3, y1: 20, x2: 3, y2: 20 }),
)
assert.equal(parseStage(toMakerStage(shifted)).start.col, 8)
assert.equal(parseStage(toMakerStage(shifted)).start.row, 17)
assert.equal(shifted.rows[20]![3], '.')
assert.deepEqual(decodeMakerLevel(encodeMakerLevel(stamped)), stamped)
assert.equal('snow' in decodeMakerLevel(encodeMakerLevel(initial)), false)
for (const name of [
  'harbor',
  'snowfield',
  'skybridge',
  'spacewalk',
  'orbital-salvage',
] as const) {
  const course = makerTemplate(name)
  assert.deepEqual(decodeMakerLevel(encodeMakerLevel(course)), course)
  const parsed = parseStage(toMakerStage(course))
  assert.equal(parsed.start.col, 3)
  assert.ok(parsed.spawns.some((spawn) => spawn.kind === 'goal'))
  const run = createSavePlumberPreview(
    {
      rng: () => 0.5,
      sound: { play: () => undefined },
      demo: false,
      hiScore: 0,
    },
    { customLevel: toMakerStage(course) },
  )
  assert.equal(run.mode, 'play')
  assert.equal(run.save, undefined)
}
const harbor = parseStage(toMakerStage(makerTemplate('harbor')))
assert.ok([...harbor.solid].includes(SOLID_WATER))
assert.ok(harbor.spawns.some((spawn) => spawn.kind === 'raft'))
const winter = parseStage(toMakerStage(makerTemplate('snowfield')))
assert.equal(winter.snow, true)
assert.ok([...winter.solid].includes(SOLID_ICE))
assert.ok([...winter.solid].includes(SOLID_SNOWBANK))
assert.ok([...winter.solid].includes(SOLID_FRAGILE_ICE))
assert.ok(winter.spawns.some((spawn) => spawn.kind === 'icicle'))
assert.ok(winter.spawns.some((spawn) => spawn.kind === 'snowball'))
assert.ok(winter.spawns.some((spawn) => spawn.giant))
const winterTools = MAKER_GROUPS.find((group) => group.name === 'Winter')
assert.deepEqual(
  new Set(winterTools?.tiles.map((tile) => tile.key)),
  new Set(['f', 'b', 'd', 'e', 'q']),
)
const icyRun = createSavePlumberPreview(
  { rng: () => 0.5, sound: { play: () => undefined }, demo: false, hiScore: 0 },
  { customLevel: toMakerStage(makerTemplate('snowfield')) },
)
assert.equal(icyRun.stage.snow, true)
assert.equal(icyRun.save, undefined)
assert.equal(
  icyRun.icicles.length,
  1,
  'Real engine initializes falling icicles',
)
assert.equal(
  icyRun.snowballs.length,
  1,
  'Real engine initializes moving snowballs',
)
assert.equal(icyRun.solidAt(23, 20), SOLID_SNOWBANK)
assert.equal(icyRun.solidAt(35, 22), SOLID_FRAGILE_ICE)
const obstacleVariant = makerRectangle(
  initial,
  { x1: 10, y1: 18, x2: 13, y2: 18 },
  'b',
)
const savedObstacleVariant = decodeMakerLevel(encodeMakerLevel(obstacleVariant))
assert.deepEqual(savedObstacleVariant, obstacleVariant)
assert.equal(
  parseStage(toMakerStage(savedObstacleVariant)).solid[18 * 64 + 10],
  SOLID_SNOWBANK,
)
const frozenRun = createSavePlumberPreview(
  { rng: () => 0.5, sound: { play: () => undefined }, demo: false, hiScore: 0 },
  { customLevel: toMakerStage(makerTemplate('snowfield')) },
)
frozenRun.hero.x = 35 * 16 + 8
frozenRun.hero.y = 22 * 16 - 20
frozenRun.hero.vx = 0
frozenRun.hero.vy = 0
frozenRun.ground = true
for (let i = 0; i < 44; i++) frozenRun.update(emptyInput())
assert.equal(
  frozenRun.solidAt(35, 22),
  0,
  'Fragile ice shatters under sustained weight',
)

const spaceCourse = makerTemplate('spacewalk')
const spaceStage = parseStage(toMakerStage(spaceCourse))
assert.equal(spaceStage.space, true)
assert.equal(spaceStage.snow, false)
assert.equal(spaceCourse.theme, 8)
assert.ok(spaceStage.spawns.some((spawn) => spawn.kind === 'gravity-well'))
assert.equal(
  spaceStage.spawns.filter((spawn) => spawn.kind === 'gravity-well').length,
  2,
)
assert.deepEqual(decodeMakerLevel(encodeMakerLevel(spaceCourse)), spaceCourse)
assert.notEqual(makerId(spaceCourse), makerId(initial))
assert.equal('space' in validateMakerLevel(initial), false)
const cosmosTools = MAKER_GROUPS.find((group) => group.name === 'Cosmos')
assert.ok(cosmosTools?.tiles.some((tile) => tile.key === '?'))
assert.ok(cosmosTools?.tiles.some((tile) => tile.key === '%'))
assert.ok(cosmosTools?.tiles.some((tile) => tile.key === ';'))
const spaceRun = createSavePlumberPreview(
  { rng: () => 0.5, sound: { play: () => undefined }, demo: false, hiScore: 0 },
  { customLevel: toMakerStage(spaceCourse) },
)
assert.equal(spaceRun.gravityWells.length, 2)
assert.equal(
  spaceRun.airCanisters.length,
  3,
  'Space starter has three fuel pickups',
)
assert.equal(spaceRun.airPressure, 100)
assert.equal(spaceRun.mode, 'play')
assert.equal(spaceRun.save, undefined)
const initialX = spaceRun.hero.x
const initialY = spaceRun.hero.y
const aimOnly = emptyInput()
aimOnly.held.right = true
for (let i = 0; i < 10; i++) spaceRun.update(aimOnly)
assert.equal(
  spaceRun.hero.x,
  initialX,
  'Direction alone cannot move in zero gravity',
)
assert.equal(
  spaceRun.hero.y,
  initialY,
  'Zero gravity has no hidden jump or falling',
)
const jetUp = emptyInput()
jetUp.held.up = true
jetUp.held.x = true
spaceRun.update(jetUp)
assert.ok(spaceRun.hero.vy < -0.9, 'Expelling air downward pushes upward')
assert.ok(
  spaceRun.hero.y < initialY,
  'Directional jet moves heroine vertically',
)
assert.equal(spaceRun.airAim.y, -1)
assert.ok(spaceRun.airPlume > 0)
const jetSpeed = Math.hypot(spaceRun.hero.vx, spaceRun.hero.vy)
spaceRun.update(emptyInput())
assert.ok(spaceRun.hero.vy < 0, 'Releasing the air jet preserves drift')
const brake = emptyInput()
brake.held.a = true
spaceRun.update(brake)
assert.ok(
  Math.hypot(spaceRun.hero.vx, spaceRun.hero.vy) < jetSpeed,
  'The separate brake reduces momentum',
)
const jetLeft = emptyInput()
jetLeft.held.left = true
jetLeft.held.x = true
for (let i = 0; i < 9; i++) spaceRun.update(jetLeft)
assert.ok(
  spaceRun.hero.vx < 0,
  'Firing the nozzle behind leftward motion changes x velocity',
)
assert.equal(spaceRun.save, undefined)

const spaceCorridor = validateMakerLevel({
  ...newMakerLevel(32),
  title: 'Jet-Only Clearance Test',
  space: true,
  rows: newMakerLevel(32).rows.map((row) => row.replace(/#/g, '.')),
})
const spaceClear = createSavePlumberPreview(
  { rng: () => 0.5, sound: { play: () => undefined }, demo: false, hiScore: 0 },
  { customLevel: toMakerStage(spaceCorridor) },
)
const jetRight = emptyInput()
jetRight.held.right = true
jetRight.held.x = true
for (let i = 0; i < 180 && !spaceClear.cleared.length; i++)
  spaceClear.update(jetRight)
assert.ok(
  spaceClear.cleared.length > 0,
  'A level can be cleared through air thrust alone',
)
assert.equal(spaceClear.save, undefined)
// Pressure is finite, each pulse costs propellant, and exhausted jets do not
// accelerate until the emergency trickle has restored another pulse.
const pressureRun = createSavePlumberPreview(
  { rng: () => 0.5, sound: { play: () => undefined }, demo: false, hiScore: 0 },
  { customLevel: toMakerStage(spaceCorridor) },
)
pressureRun.airPressure = 8
const pressJet = emptyInput()
pressJet.held.right = true
pressJet.held.x = true
pressureRun.update(pressJet)
assert.equal(
  pressureRun.hero.vx,
  0,
  'An empty tank must not generate free thrust',
)
assert.ok(pressureRun.airPressure > 8 && pressureRun.airPressure < 9)
for (let i = 0; i < 30 && pressureRun.hero.vx === 0; i++)
  pressureRun.update(pressJet)
assert.ok(
  pressureRun.hero.vx > 0,
  'Emergency trickle must prevent an out-of-fuel softlock',
)
assert.ok(pressureRun.airPressure < 9, 'Firing another pulse consumes pressure')
assert.ok(pressureRun.airPressure >= 0 && pressureRun.airPressure <= 100)

// A canister refuels once, refuels only in space, and survives a v1 shared link.
const canisterLevel = paintMakerTile(spaceCorridor, 6, 20, '%')
assert.deepEqual(
  decodeMakerLevel(encodeMakerLevel(canisterLevel)),
  canisterLevel,
)
const canisterStage = parseStage(toMakerStage(canisterLevel))
assert.equal(
  canisterStage.spawns.filter((spawn) => spawn.kind === 'air-canister').length,
  1,
)
const canisterRun = createSavePlumberPreview(
  { rng: () => 0.5, sound: { play: () => undefined }, demo: false, hiScore: 0 },
  { customLevel: toMakerStage(canisterLevel) },
)
const fuel = canisterRun.airCanisters[0]!
assert.equal(fuel.taken, false)
canisterRun.airPressure = 20
canisterRun.hero.x = fuel.x
canisterRun.hero.y = fuel.y - 10
canisterRun.update(emptyInput())
assert.equal(fuel.taken, true)
assert.ok(canisterRun.airPressure >= 85 && canisterRun.airPressure < 86)
const onceOnly = canisterRun.airPressure
canisterRun.update(emptyInput())
assert.ok(
  canisterRun.airPressure < onceOnly + 1,
  'The same tank cannot be collected twice',
)
canisterRun.airPressure = 98
const canisterRunMax = createSavePlumberPreview(
  { rng: () => 0.5, sound: { play: () => undefined }, demo: false, hiScore: 0 },
  { customLevel: toMakerStage(canisterLevel) },
)
canisterRunMax.hero.x = canisterRunMax.airCanisters[0]!.x
canisterRunMax.hero.y = canisterRunMax.airCanisters[0]!.y - 10
canisterRunMax.airPressure = 98
canisterRunMax.update(emptyInput())
assert.equal(canisterRunMax.airPressure, 100, 'A full tank is capped at 100%')

// Checkpoint activation must test both axes in space, not merely passing its x.
const flagLevel = paintMakerTile(spaceCorridor, 10, 6, 'K')
const flagRun = createSavePlumberPreview(
  { rng: () => 0.5, sound: { play: () => undefined }, demo: false, hiScore: 0 },
  { customLevel: toMakerStage(flagLevel) },
)
const floatingFlag = flagRun.checkpoints[0]!
flagRun.hero.x = floatingFlag.x
flagRun.airPressure = 25
flagRun.update(emptyInput())
assert.equal(
  floatingFlag.reached,
  false,
  'Flying beneath a flag is not activation',
)
flagRun.hero.y = floatingFlag.y - 20
flagRun.update(emptyInput())
assert.equal(floatingFlag.reached, true)
assert.equal(
  flagRun.airPressure,
  100,
  'A reached orbital checkpoint refills the tank',
)
assert.equal(flagRun.checkpoint.x, floatingFlag.x)
assert.equal(flagRun.checkpoint.y, floatingFlag.y - 20)

const supplyStage = parseStage(toMakerStage(spaceCourse))
assert.equal(
  supplyStage.spawns.filter((spawn) => spawn.kind === 'air-dock').length,
  1,
)
const supplyRun = createSavePlumberPreview(
  { rng: () => 0.5, sound: { play: () => undefined }, demo: false, hiScore: 0 },
  { customLevel: toMakerStage(spaceCourse) },
)
assert.equal(supplyRun.airDocks.length, 1)
const refillDock = supplyRun.airDocks[0]!
supplyRun.airPressure = 15
supplyRun.hero.x = refillDock.x
supplyRun.hero.y = refillDock.y - 10
supplyRun.hero.vx = 0
supplyRun.hero.vy = 0
supplyRun.update(emptyInput())
assert.equal(supplyRun.airDockActive, true)
assert.ok(supplyRun.airPressure > 17, 'Dock recharges propellant on proximity')
const initialPressure = supplyRun.airPressure
supplyRun.hero.x = 5 * 16
supplyRun.hero.y = 16 * 16
supplyRun.hero.vx = 0
supplyRun.hero.vy = 0
supplyRun.update(emptyInput())
assert.equal(supplyRun.airDockActive, false)
assert.ok(
  supplyRun.airPressure < initialPressure + 1,
  'Distant docks cannot instantly refill a tank',
)
const salvage = makerTemplate('orbital-salvage')
assert.equal(salvage.space, true)
assert.deepEqual(decodeMakerLevel(encodeMakerLevel(salvage)), salvage)
const salvageSpawns = parseStage(toMakerStage(salvage)).spawns
assert.equal(
  salvageSpawns.filter((spawn) => spawn.kind === 'air-dock').length,
  2,
)
assert.equal(
  salvageSpawns.filter((spawn) => spawn.kind === 'air-canister').length,
  2,
)
assert.ok(salvageSpawns.some((spawn) => spawn.kind === 'gravity-well'))
const boundedSpace = createSavePlumberPreview(
  { rng: () => 0.5, sound: { play: () => undefined }, demo: false, hiScore: 0 },
  { customLevel: toMakerStage(spaceCorridor) },
)
boundedSpace.hero.x = 9.5
boundedSpace.hero.y = 150
boundedSpace.hero.vx = -4
boundedSpace.hero.vy = 0
boundedSpace.update(emptyInput())
assert.equal(boundedSpace.hero.x, 9, 'Vacuum has a left stage boundary')
assert.equal(boundedSpace.hero.vx, 0)
boundedSpace.hero.x = 128
boundedSpace.hero.y = 0.5
boundedSpace.hero.vy = -3
boundedSpace.update(emptyInput())
assert.equal(boundedSpace.hero.y, 0, 'Astronaut cannot drift above the map')
assert.equal(boundedSpace.hero.vy, 0)
boundedSpace.hero.x = 32 * 16 - 9.5
boundedSpace.hero.y = 150
boundedSpace.hero.vx = 3
boundedSpace.update(emptyInput())
assert.equal(
  boundedSpace.hero.x,
  32 * 16 - 9,
  'Right hull keeps the astronaut inside',
)
boundedSpace.hero.x = 128
boundedSpace.hero.y = 24 * 16 - 20 - 0.5
boundedSpace.hero.vy = 4
boundedSpace.update(emptyInput())
assert.equal(
  boundedSpace.hero.y,
  24 * 16 - 20,
  'Bottom hull has no falling softlock',
)
assert.equal(boundedSpace.hero.vy, 0)

const worldStage = parseStage(toMakerStage(initial))
assert.equal(
  worldStage.space,
  false,
  'Existing campaign physics remain unchanged',
)

const moved = paintMakerTile(initial, 10, 19, '@')
assert.equal((moved.rows.join('').match(/@/g) ?? []).length, 1)
assert.equal(parseStage(toMakerStage(moved)).start.col, 10)
assert.equal(moved.rows[20]![3], '.')
assert.equal(
  initial.rows[20]![3],
  '@',
  'painting never mutates a previous undo state',
)

const movedGoal = paintMakerTile(moved, 15, 20, 'G')
assert.equal((movedGoal.rows.join('').match(/G/g) ?? []).length, 1)
assert.equal(
  parseStage(toMakerStage(movedGoal)).spawns.filter(
    (spawn) => spawn.kind === 'goal',
  ).length,
  1,
)

const invalid = (level: unknown, pattern: RegExp) =>
  assert.throws(() => validateMakerLevel(level), pattern)
invalid(null, /Not a/)
invalid({ ...initial, v: 27 }, /version/)
invalid({ ...initial, theme: 9 }, /world/)
invalid({ ...initial, rows: ['@G'] }, /16 to 48/)
invalid(
  { ...initial, rows: initial.rows.map((line) => line.slice(0, 31)) },
  /32 to 96/,
)
invalid(
  {
    ...initial,
    rows: initial.rows.map((line, i) => (i === 0 ? line.slice(1) : line)),
  },
  /uneven/,
)
invalid(
  {
    ...initial,
    rows: initial.rows.map((line, i) => (i === 0 ? '␀' + line.slice(1) : line)),
  },
  /invalid/,
)
invalid(
  { ...initial, rows: initial.rows.map((line) => line.replace('@', '.')) },
  /exactly one heroine/,
)
invalid(
  { ...initial, rows: initial.rows.map((line) => line.replace('G', '.')) },
  /exactly one finish/,
)
invalid(
  {
    ...initial,
    rows: initial.rows.map((line, i) => (i === 0 ? 'D' + line.slice(1) : line)),
  },
  /Pair every pipe/,
)
assert.throws(() => decodeMakerLevel('javascript:alert(1)'), /share code/)
assert.throws(() => decodeMakerLevel('X'.repeat(12001)), /share code/)
assert.throws(() => decodeMakerLevel('xxxx'), /Cannot open course/)
assert.equal(newMakerLevel(99999).rows[0]!.length, MAKER_MAX_COLS)

const played = createSavePlumberPreview(
  { rng: () => 0.5, sound: { play: () => undefined }, demo: false, hiScore: 0 },
  { customLevel: toMakerStage(unicode) },
)
assert.equal(
  played.mode,
  'play',
  'Shared levels start directly in the actual physics engine',
)
assert.equal(played.stage.name, unicode.title)
assert.equal(played.stage.dark, true)
assert.equal(
  played.save,
  undefined,
  'Custom levels cannot overwrite campaign saves',
)
for (let i = 0; i < 30; i++) played.update(emptyInput())
assert.equal(played.save, undefined)

const makerPage = source('../../pages/play/save-the-plumber.vue')
const makerComponent = source('../../components/arcade/plumber-level-maker.vue')
const makerStore = source('../../stores/savePlumberMakerStore.ts')
assert.match(makerPage, /LEVEL MAKER/)
assert.match(makerPage, /ArcadePlumberLevelMaker/)
for (const required of [
  'maker-console',
  'maker-grid',
  'maker-groups',
  'maker-tiles',
  'maker-play-stage',
  'maker-draft',
  'maker-share-field',
  'maker-stars',
  'editTools',
  'maker.selection',
  'maker.flood',
  'maker.rectangle',
  'maker.pasteAt',
  'loadStarterTemplate',
  'C / AIR',
  'maker.level.space',
  'requestAnimationFrame',
  'createSavePlumberPreview',
])
  assert.ok(makerComponent.includes(required), 'Maker needs ' + required)
assert.match(makerStore, /localStorage\.setItem\(MAKER_SAVE_KEY/)
assert.match(makerStore, /decodeMakerLevel/)
assert.match(makerStore, /encodeMakerLevel/)
assert.match(makerStore, /makerTemplate/)
assert.match(makerStore, /makerCopy/)
assert.doesNotMatch(
  makerComponent,
  /localStorage|\$fetch/,
  'Components do not own persistence',
)
console.log(
  'Save the Plumber Maker: parser parity, unsafe imports, isolated playtest, links and UI contracts verified',
)
