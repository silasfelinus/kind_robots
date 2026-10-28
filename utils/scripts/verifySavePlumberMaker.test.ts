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
assert.equal(MAKER_GROUPS.length, 6)
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
assert.equal(initial.rows[17]![10], '.', 'rectangle must not mutate an earlier state')
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
const shifted = makerPaste(initial, 8, 17, makerCopy(initial, { x1: 3, y1: 20, x2: 3, y2: 20 }))
assert.equal(parseStage(toMakerStage(shifted)).start.col, 8)
assert.equal(parseStage(toMakerStage(shifted)).start.row, 17)
assert.equal(shifted.rows[20]![3], '.')
assert.deepEqual(decodeMakerLevel(encodeMakerLevel(stamped)), stamped)
assert.equal('snow' in decodeMakerLevel(encodeMakerLevel(initial)), false)
for (const name of ['harbor', 'snowfield', 'skybridge'] as const) {
  const course = makerTemplate(name)
  assert.deepEqual(decodeMakerLevel(encodeMakerLevel(course)), course)
  const parsed = parseStage(toMakerStage(course))
  assert.equal(parsed.start.col, 3)
  assert.ok(parsed.spawns.some((spawn) => spawn.kind === 'goal'))
  const run = createSavePlumberPreview(
    { rng: () => 0.5, sound: { play: () => undefined }, demo: false, hiScore: 0 },
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
assert.ok(winter.spawns.some((spawn) => spawn.giant))
const icyRun = createSavePlumberPreview(
  { rng: () => 0.5, sound: { play: () => undefined }, demo: false, hiScore: 0 },
  { customLevel: toMakerStage(makerTemplate('snowfield')) },
)
assert.equal(icyRun.stage.snow, true)
assert.equal(icyRun.save, undefined)

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
    rows: initial.rows.map((line, i) => (i === 0 ? 'A' + line.slice(1) : line)),
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
