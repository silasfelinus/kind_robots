import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  applyKeyRemap,
  isRemappableCode,
  KEY_MAP,
  REMAPPABLE_BUTTONS,
  sanitizeKeyRemap,
  withKeyRemap,
} from '../arcade/input'
import { findArcadeGame } from '../arcade/games'

// Conductor rainbow t-044 (main-game standard: settings): a player may give each face button a key of their own.

assert.deepEqual([...REMAPPABLE_BUTTONS], ['a', 'b', 'x', 'y'])
assert.equal(
  findArcadeGame('rainbow-bullet-hell-space-princess')?.remap,
  true,
  'Rainbow offers the Keys panel',
)

// Bindable: letters, digits, numpad, punctuation, space and modifiers. Reserved: movement, pause, start, browser.
for (const code of [
  'KeyQ',
  'Digit1',
  'Numpad4',
  'Space',
  'ShiftLeft',
  'ControlRight',
  'Semicolon',
  'Slash',
])
  assert.equal(isRemappableCode(code), true, code)
for (const code of [
  'ArrowUp',
  'ArrowLeft',
  'Escape',
  'KeyP',
  'Enter',
  'NumpadEnter',
  'Tab',
  'F5',
  'MetaLeft',
  '',
  'KeyAB',
])
  assert.equal(isRemappableCode(code), false, code)

// Stored choices are cleaned: unknown buttons, reserved keys and a key claimed twice are dropped.
assert.deepEqual(sanitizeKeyRemap(null), {})
assert.deepEqual(sanitizeKeyRemap(['KeyQ']), {})
assert.deepEqual(
  sanitizeKeyRemap({
    a: 'KeyQ',
    b: 'KeyQ',
    x: 'Escape',
    y: 7,
    start: 'KeyE',
  }),
  { a: 'KeyQ' },
)

// Choosing a key: it presses its button, and moves off any button that had it.
let remap = withKeyRemap({}, 'a', 'KeyQ')
assert.deepEqual(remap, { a: 'KeyQ' })
remap = withKeyRemap(remap, 'b', 'KeyE')
assert.deepEqual(remap, { a: 'KeyQ', b: 'KeyE' })
remap = withKeyRemap(remap, 'x', 'KeyQ')
assert.deepEqual(remap, { b: 'KeyE', x: 'KeyQ' }, 'a key moves, never doubles')
remap = withKeyRemap(remap, 'a', 'KeyR')
remap = withKeyRemap(remap, 'a', 'KeyT')
assert.equal(remap.a, 'KeyT', 'one chosen key per button')
assert.deepEqual(withKeyRemap(remap, 'b', null), { x: 'KeyQ', a: 'KeyT' })
assert.deepEqual(
  withKeyRemap(remap, 'y', 'Escape'),
  remap,
  'a reserved key is refused',
)

// Applied: chosen keys press their buttons; every default key that was not taken still works.
const keys = applyKeyRemap(KEY_MAP, { a: 'KeyQ', y: 'KeyX' })
assert.equal(keys.KeyQ, 'a')
assert.equal(keys.KeyX, 'y', 'a chosen key takes over what it did before')
assert.equal(keys.KeyK, 'b', 'B keeps its other keys')
assert.equal(keys.Space, 'a')
assert.equal(keys.ArrowUp, 'up')
assert.equal(keys.Enter, 'start')
assert.deepEqual(applyKeyRemap(KEY_MAP, {}), KEY_MAP)
assert.equal(KEY_MAP.KeyQ, undefined, 'the shared map is never mutated')
assert.deepEqual(
  applyKeyRemap(KEY_MAP, { a: 'ArrowUp' } as never),
  KEY_MAP,
  'movement can never be rebound',
)

// Wired: seat 1 flies on the remapped keys, the binder listens first, and the choice is saved per game.
const root = new URL('../../', import.meta.url)
const cabinet = readFileSync(
  new URL('components/arcade/arcade-cabinet.vue', root),
  'utf8',
)
const store = readFileSync(new URL('stores/arcadeStore.ts', root), 'utf8')
assert.match(
  cabinet,
  /applyKeyRemap\(base, store\.keyRemapFor\(props\.slug\)\)/,
)
assert.match(
  cabinet,
  /addEventListener\('keydown', onRemapKey, \{ capture: true \}\)/,
)
assert.match(
  cabinet,
  /removeEventListener\('keydown', onRemapKey, \{ capture: true \}\)/,
)
assert.match(cabinet, /event\.stopImmediatePropagation\(\)/)
assert.match(store, /keyRemaps: keyRemaps\.value/)
assert.match(store, /sanitizeKeyRemap\(raw\)/)
console.log('arcade key remap: ok')
