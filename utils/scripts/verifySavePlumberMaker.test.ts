import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { emptyInput } from '../arcade/types'
import {
  MAKER_GROUPS,
  MAKER_MAX_COLS,
  MAKER_SAVE_KEY,
  MAKER_TILES,
  decodeMakerLevel,
  encodeMakerLevel,
  makerId,
  newMakerLevel,
  paintMakerTile,
  toMakerStage,
  validateMakerLevel,
} from '../arcade/games/savePlumberMaker'
import { STAGE_GLYPHS, parseStage } from '../arcade/games/savePlumberLevels'
import { createSavePlumberPreview } from '../arcade/games/savePlumberPreview'

const source = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8')

const supported = new Set(STAGE_GLYPHS)
assert.deepEqual(
  [...MAKER_TILES].sort(),
  [...supported].sort(),
  'Every parser symbol must be available in the Maker, including every new runtime mechanic',
)
assert.equal(MAKER_GROUPS.length, 5)
assert.ok(MAKER_GROUPS.every((group) => group.tiles.every((tile) => tile.icon && tile.label)))
assert.ok(!MAKER_SAVE_KEY.includes('arcade:saves'), 'Maker must use its own storage namespace')

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
  assert.equal(makerId(level), makerId(decodeMakerLevel(encodeMakerLevel(level))))
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

const moved = paintMakerTile(initial, 10, 19, '@')
assert.equal((moved.rows.join('').match(/@/g) ?? []).length, 1)
assert.equal(parseStage(toMakerStage(moved)).start.col, 10)
assert.equal(moved.rows[20]![3], '.')
assert.equal(initial.rows[20]![3], '@', 'painting never mutates a previous undo state')

const movedGoal = paintMakerTile(moved, 15, 20, 'G')
assert.equal((movedGoal.rows.join('').match(/G/g) ?? []).length, 1)
assert.equal(parseStage(toMakerStage(movedGoal)).spawns.filter((spawn) => spawn.kind === 'goal').length, 1)

const invalid = (level: unknown, pattern: RegExp) =>
  assert.throws(() => validateMakerLevel(level), pattern)
invalid(null, /Not a/)
invalid({ ...initial, v: 27 }, /version/)
invalid({ ...initial, theme: 9 }, /world/)
invalid({ ...initial, rows: ['@G'] }, /24/)
invalid({ ...initial, rows: initial.rows.map((line) => line.slice(0, 31)) }, /32 to 96/)
invalid({ ...initial, rows: initial.rows.map((line, i) => i === 0 ? line.slice(1) : line) }, /uneven/)
invalid({ ...initial, rows: initial.rows.map((line, i) => i === 0 ? 'A' + line.slice(1) : line) }, /invalid/)
invalid({ ...initial, rows: initial.rows.map((line) => line.replace('@', '.')) }, /exactly one heroine/)
invalid({ ...initial, rows: initial.rows.map((line) => line.replace('G', '.')) }, /exactly one finish/)
invalid({ ...initial, rows: initial.rows.map((line, i) => i === 0 ? 'D' + line.slice(1) : line) }, /Pair every pipe/)
assert.throws(() => decodeMakerLevel('javascript:alert(1)'), /share code/)
assert.throws(() => decodeMakerLevel('X'.repeat(12001)), /share code/)
assert.throws(() => decodeMakerLevel('xxxx'), /Cannot open course/)
assert.equal(newMakerLevel(99999).rows[0]!.length, MAKER_MAX_COLS)

const played = createSavePlumberPreview(
  { rng: () => 0.5, sound: { play: () => undefined }, demo: false, hiScore: 0 },
  { customLevel: toMakerStage(unicode) },
)
assert.equal(played.mode, 'play', 'Shared levels start directly in the actual physics engine')
assert.equal(played.stage.name, unicode.title)
assert.equal(played.stage.dark, true)
assert.equal(played.save, undefined, 'Custom levels cannot overwrite campaign saves')
for (let i = 0; i < 30; i++) played.update(emptyInput())
assert.equal(played.save, undefined)

const makerPage = source('../../pages/play/save-the-plumber.vue')
const makerComponent = source('../../components/arcade/plumber-level-maker.vue')
const makerStore = source('../../stores/savePlumberMakerStore.ts')
assert.match(makerPage, /LEVEL MAKER/)
assert.match(makerPage, /ArcadePlumberLevelMaker/)
for (const required of [
  'maker-console', 'maker-grid', 'maker-groups', 'maker-tiles',
  'maker-play-stage', 'maker-draft', 'maker-share-field', 'maker-stars',
  'requestAnimationFrame', 'createSavePlumberPreview',
]) assert.ok(makerComponent.includes(required), 'Maker needs ' + required)
assert.match(makerStore, /localStorage\.setItem\(MAKER_SAVE_KEY/)
assert.match(makerStore, /decodeMakerLevel/)
assert.match(makerStore, /encodeMakerLevel/)
assert.doesNotMatch(makerComponent, /localStorage|\$fetch/, 'Components do not own persistence')
console.log('Save the Plumber Maker: parser parity, unsafe imports, isolated playtest, links and UI contracts verified')
