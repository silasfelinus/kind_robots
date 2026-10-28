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
assert.ok(cosmosTools?.tiles.some((tile) => tile.key === ';'))
assert.ok(cosmosTools?.tiles.some((tile) => tile.key === '%'))
const spaceRun = createSavePlumberPreview(
  { rng: () => 0.5, sound: { play: () => undefined }, demo: false, hiScore: 0 },
  { customLevel: toMakerStage(spaceCourse) },
)
assert.equal(spaceRun.gravityWells.length, 2)
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
const spaceSupply = createSavePlumberPreview(
  { rng: () => 0.5, sound: { play: () => undefined }, demo: false, hiScore: 0 },
  { customLevel: toMakerStage(spaceCourse) },
)
assert.equal(spaceSupply.airRemaining, 100)
assert.ok(spaceSupply.airCanisters.length >= 2)
assert.equal(spaceSupply.airDocks.length, 1)
const firstCell = spaceSupply.airCanisters[0]!
spaceSupply.airRemaining = 22
spaceSupply.hero.x = firstCell.x
spaceSupply.hero.y = firstCell.y - 11
spaceSupply.hero.vx = 0
spaceSupply.hero.vy = 0
spaceSupply.update(emptyInput())
assert.equal(
  firstCell.taken,
  true,
  'Canisters are collectible in the real engine',
)
assert.ok(spaceSupply.airRemaining >= 67, 'Canister restores 45 units of air')
const afterCell = spaceSupply.airRemaining
spaceSupply.update(emptyInput())
assert.ok(
  spaceSupply.airRemaining < afterCell + 2,
  'Each canister can only be collected once',
)
const dock = spaceSupply.airDocks[0]!
spaceSupply.airRemaining = 10
spaceSupply.hero.x = dock.x
spaceSupply.hero.y = dock.y - 11
spaceSupply.hero.vx = 0
spaceSupply.hero.vy = 0
spaceSupply.update(emptyInput())
assert.equal(spaceSupply.airDockActive, true)
assert.ok(
  spaceSupply.airRemaining > 12,
  'Refill docks recharge near the heroine',
)
spaceSupply.hero.x = 8 * 16
spaceSupply.hero.y = 16 * 16
spaceSupply.hero.vx = 0
spaceSupply.hero.vy = 0
spaceSupply.airRemaining = 0
spaceSupply.airCooldown = 0
const emptyJet = emptyInput()
emptyJet.held.right = true
emptyJet.held.x = true
spaceSupply.update(emptyJet)
assert.equal(spaceSupply.hero.vx, 0, 'Empty tank cannot fire the jet')
assert.ok(
  spaceSupply.airRemaining > 0,
  'Empty tank recharges very slowly to avoid softlocks',
)
for (let i = 0; i < 110; i++) spaceSupply.update(emptyInput())
assert.ok(
  spaceSupply.airRemaining >= 8,
  'Passive recharge ultimately restores one emergency burst',
)
spaceSupply.update(emptyJet)
assert.ok(
  spaceSupply.hero.vx > 0,
  'Emergency recovered air can propel the heroine',
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
assert.equal(boundedSpace.hero.x, 32 * 16 - 9, 'Right boundary remains inside the map')
boundedSpace.hero.x = 128
boundedSpace.hero.y = 24 * 16 - 20 - 0.5
boundedSpace.hero.vy = 4
boundedSpace.update(emptyInput())
assert.equal(boundedSpace.hero.y, 24 * 16 - 20, 'Bottom boundary is traversable, not instant death')
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
