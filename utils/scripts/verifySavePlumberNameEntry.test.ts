import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createSavePlumberPreview } from '../arcade/games/savePlumberPreview'
import {
  PLUMBER_NAME_MAX,
  plumberName,
  readPlumberFile,
  readPlumberSave,
  readPlumberSlot,
} from '../arcade/games/savePlumberSave'
import { emptyInput, type ArcadeButton } from '../arcade/types'

// Save the Plumber name entry (conductor save-the-plumber t-028, main-game
// standard "customizable characters"): after heroine select the player may
// rename her on an arcade letter wheel; the name is saved on the file and used
// by the story, HUD, file select, finale and the front page.

// The name filter: letters and hyphens, at most ten, tidied, family-safe.
assert.equal(plumberName('ROSA'), 'Rosa')
assert.equal(plumberName('ji-woo'), 'Ji-Woo')
assert.equal(plumberName('  MAE--LIN- '), 'Mae-Lin')
assert.equal(plumberName(''), undefined)
assert.equal(plumberName('-'), undefined)
assert.equal(plumberName('R2D2'), undefined, 'digits are not on the wheel')
assert.equal(plumberName('A'.repeat(PLUMBER_NAME_MAX)), 'A' + 'a'.repeat(9))
assert.equal(plumberName('A'.repeat(PLUMBER_NAME_MAX + 1)), undefined)
assert.equal(plumberName('SHIT'), undefined, 'family filter on a word')
assert.equal(plumberName('BIG-ASS'), undefined, 'family filter on each part')
assert.equal(plumberName('CLASSY'), 'Classy', 'whole words only')
assert.equal(plumberName(42), undefined)

// Saved slots keep a valid name and drop anything else.
const base = { heroine: 1, stage: 0, score: 0, lives: 3, tokens: 0 }
assert.equal(readPlumberSlot({ ...base, name: 'Wren' })?.name, 'Wren')
assert.equal(readPlumberSlot({ ...base, name: '<b>hi</b>' })?.name, undefined)
assert.ok(!('name' in readPlumberSlot(base)!), 'older saves stay nameless')

const options = (extra: Record<string, unknown> = {}) => ({
  rng: () => 0.5,
  sound: { play() {} },
  demo: false,
  hiScore: 0,
  ...extra,
})

type Game = ReturnType<typeof createSavePlumberPreview> & {
  mode: string
  nameDraft: string[]
  nameCursor: number
  heroName: string | undefined
  displayName: string
  member: { name: string }
  save: unknown
}
const start = () => {
  const game = createSavePlumberPreview(options()) as unknown as Game
  const tap = (...buttons: ArcadeButton[]) => {
    for (const button of buttons) {
      const f = emptyInput()
      f.pressed[button] = true
      game.update(f)
    }
  }
  tap('start', 'a', 'a')
  assert.equal(game.mode, 'name', 'heroine select leads to name entry')
  return { game, tap }
}

// Keeping her roster name: A straight through, nothing extra saved.
{
  const { game, tap } = start()
  const roster = game.member.name
  assert.deepEqual(game.nameDraft, [...roster.toUpperCase()])
  tap('a')
  assert.equal(game.mode, 'story')
  assert.equal(game.heroName, undefined)
  assert.equal(game.displayName, roster)
  assert.equal(readPlumberSave(game.save)?.name, undefined)
}

// B from an empty name returns to the roster without starting a file.
{
  const { game, tap } = start()
  const length = game.nameDraft.length
  for (let i = 0; i < length; i++) tap('b')
  assert.deepEqual(game.nameDraft, [])
  assert.equal(game.mode, 'name')
  tap('b')
  assert.equal(game.mode, 'select')
  assert.equal(readPlumberFile(game.save).slots.filter(Boolean).length, 0)
}

// Typing a new name on the wheel: erase, then spell W-R-E-N.
{
  const { game, tap } = start()
  while (game.nameDraft.length) tap('b')
  const spell = (letter: string) => {
    const steps = letter.charCodeAt(0) - 'A'.charCodeAt(0) + 1
    for (let i = 0; i < steps; i++) tap('up')
    tap('right')
  }
  for (const letter of 'WREN') spell(letter)
  assert.equal(game.nameDraft.join(''), 'WREN')
  tap('down')
  assert.equal(
    game.nameDraft.join(''),
    'WREN-',
    'down wraps the wheel to its end',
  )
  tap('b')
  assert.equal(game.nameDraft.join(''), 'WREN', 'B rubs out the letter')
  tap('y')
  assert.equal(
    game.nameDraft.join(''),
    game.member.name.toUpperCase(),
    'Y resets',
  )
  while (game.nameDraft.length) tap('b')
  for (const letter of 'WREN') spell(letter)
  // Never past ten letters.
  for (let i = 0; i < 20; i++) tap('right')
  assert.ok(game.nameCursor <= PLUMBER_NAME_MAX - 1)
  tap('a')
  assert.equal(game.mode, 'story')
  assert.equal(game.heroName, 'Wren')
  assert.equal(game.displayName, 'Wren')
  const saved = readPlumberSave(game.save)
  assert.equal(saved?.name, 'Wren', 'the file keeps her name')

  // Continue from that file: the name comes back.
  const again = createSavePlumberPreview(
    options({ resume: game.save }),
  ) as unknown as Game
  assert.equal(again.displayName, 'Wren')
}

// A blocked name is refused with a warning and stays on name entry.
{
  const { game, tap } = start()
  game.nameDraft = [...'SHIT']
  game.nameCursor = 3
  tap('a')
  assert.equal(game.mode, 'name', 'a blocked name does not start the file')
}

// Wiring: the story, HUD and finale use the display name; the front page reads the saved name.
const source = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8')
const preview = source('../arcade/games/savePlumberPreview.ts')
assert.match(preview, /const name = this\.displayName/)
assert.match(preview, /replace\('\{name\}', this\.displayName\)/)
assert.match(preview, /\$\{this\.displayName\} {2}×\$\{this\.lives\}/)
assert.match(preview, /slot\.name \?\? member\.name/)
const store = source('../../stores/savePlumberStore.ts')
assert.match(store, /const name = progress\.value\?\.name/)

console.log('save the plumber name entry: ok')
