import assert from 'node:assert/strict'
import {
  MAX_SAVE_BYTES,
  sanitizeSaves,
  serializedSaveBytes,
  withSave,
} from '../arcade/saves'
import {
  RAINBOW_SAVE_GAME,
  rainbowSlotKey,
  rainbowSlotSaveFits,
} from '../arcade/games/rainbowSaveSlots'

const ascii = { checkpoint: 'a'.repeat(200) }
const unicode = { checkpoint: '🌈'.repeat(2100) }
const cyclic: { self?: unknown } = {}
cyclic.self = cyclic

assert.equal(serializedSaveBytes(ascii), JSON.stringify(ascii).length)
assert.ok(JSON.stringify(unicode).length < MAX_SAVE_BYTES)
assert.ok(serializedSaveBytes(unicode)! > MAX_SAVE_BYTES)
assert.equal(rainbowSlotSaveFits(ascii), true)
assert.equal(rainbowSlotSaveFits(unicode), false)
assert.equal(rainbowSlotSaveFits(cyclic), false)
assert.equal(rainbowSlotSaveFits(undefined), false)
assert.equal(rainbowSlotSaveFits(() => 1), false)
assert.equal(rainbowSlotSaveFits({ count: 1n }), false)
assert.equal(rainbowSlotSaveFits({ checkpoint: 'a'.repeat(MAX_SAVE_BYTES) }), false)

for (const slot of [0, 1, 2]) {
  const key = rainbowSlotKey(slot)
  assert.ok(key)
  assert.ok(key!.length <= 40)
  assert.equal(rainbowSlotSaveFits(ascii), true)
  assert.deepEqual(sanitizeSaves({ [key!]: ascii }), { [key!]: ascii })
  assert.deepEqual(sanitizeSaves({ [key!]: unicode }), {})
  assert.deepEqual(withSave({}, key!, unicode), {})
  assert.deepEqual(withSave({}, key!, ascii), { [key!]: ascii })
}
assert.equal(rainbowSlotKey(0), RAINBOW_SAVE_GAME)
assert.equal(rainbowSlotKey(-1), null)
assert.equal(rainbowSlotKey(3), null)
assert.deepEqual(sanitizeSaves({ [RAINBOW_SAVE_GAME]: cyclic }), {})
assert.deepEqual(withSave({}, RAINBOW_SAVE_GAME, cyclic), {})

console.log('Rainbow slots: UTF-8 capacity, serialization and three-slot storage passed')
