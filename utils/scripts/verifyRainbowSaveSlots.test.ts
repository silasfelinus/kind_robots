import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { sanitizeSaves, withSave } from '../arcade/saves'
import {
  RAINBOW_SAVE_GAME,
  RAINBOW_SLOT_COUNT,
  rainbowSlotKey,
  rainbowSlotSaveFits,
  rainbowSlotSummary,
} from '../arcade/games/rainbowSaveSlots'

assert.equal(RAINBOW_SLOT_COUNT, 3)
assert.equal(rainbowSlotKey(0), RAINBOW_SAVE_GAME)
assert.equal(rainbowSlotKey(1), `${RAINBOW_SAVE_GAME}-s2`)
assert.equal(rainbowSlotKey(2), `${RAINBOW_SAVE_GAME}-s3`)
assert.equal(rainbowSlotKey(-1), null)
assert.equal(rainbowSlotKey(3), null)
assert.equal(rainbowSlotKey(0.5), null)
for (let index = 0; index < 3; index++)
  assert.ok(rainbowSlotKey(index)!.length <= 40)

const flight = {
  v: 1,
  checkpoint: { act: 4, frame: 1500 },
  medals: { 1: 'gold', 2: 'bronze' },
}
const original = sanitizeSaves({ [RAINBOW_SAVE_GAME]: flight })
assert.deepEqual(original[RAINBOW_SAVE_GAME], flight)
assert.equal(original[rainbowSlotKey(1)!], undefined)
const second = withSave(original, rainbowSlotKey(1)!, {
  ...flight,
  checkpoint: { act: 7, frame: 300 },
})
const third = withSave(second, rainbowSlotKey(2)!, {
  ...flight,
  checkpoint: { act: 2, frame: 0 },
})
const cleared = withSave(third, rainbowSlotKey(1)!, null)
assert.deepEqual(cleared[RAINBOW_SAVE_GAME], flight)
assert.equal(cleared[rainbowSlotKey(1)!], undefined)
const oversized = { payload: 'x'.repeat(9_000) }
assert.equal(
  withSave(third, rainbowSlotKey(1)!, oversized),
  third,
  'a rejected oversized checkpoint cannot overwrite another slot',
)
assert.equal((cleared[rainbowSlotKey(2)!] as typeof flight).checkpoint.act, 2)
assert.equal(rainbowSlotSummary(null), 'New flight')
assert.equal(rainbowSlotSummary(flight), 'Act 4 · 2 medals')
for (const invalid of [
  { checkpoint: { act: 0, frame: 0 }, medals: {} },
  { checkpoint: { act: 13, frame: 0 }, medals: {} },
  { checkpoint: { act: NaN, frame: 0 }, medals: {} },
  { checkpoint: null, medals: {} },
  { checkpoint: {}, medals: {} },
]) {
  assert.equal(
    rainbowSlotSummary(invalid as Parameters<typeof rainbowSlotSummary>[0]),
    'Flight needs recovery',
    'a damaged checkpoint must not crash the save picker or show a false Act',
  )
}
assert.equal(
  rainbowSlotSummary({
    checkpoint: { act: 3, frame: 0 },
    medals: null,
  } as unknown as Parameters<typeof rainbowSlotSummary>[0]),
  'Act 3 · 0 medals',
)
assert.equal(
  rainbowSlotSummary({ checkpoint: { act: 3, frame: 0 }, medals: [] }),
  'Act 3 · 0 medals',
)
assert.equal(rainbowSlotSaveFits(flight), true)
assert.equal(rainbowSlotSaveFits({ payload: 'x'.repeat(9_000) }), false)
assert.equal(
  rainbowSlotSaveFits({
    toJSON: () => {
      throw Error()
    },
  }),
  false,
)

const root = new URL('../../', import.meta.url)
const store = readFileSync(new URL('stores/arcadeStore.ts', root), 'utf8')
const page = readFileSync(
  new URL('pages/play/rainbow-bullet-hell-space-princess.vue', root),
  'utf8',
)
assert.match(
  store,
  /game === RAINBOW_SAVE_GAME \? rainbowSlotKey\(rainbowSlot\.value\)/,
)
assert.match(store, /rainbowSlot: rainbowSlot\.value/)
assert.match(page, /aria-label="Campaign save slots"/)
assert.match(
  page,
  /cabinetMounted\.value = false\s+await nextTick\(\)\s+arcadeStore\.setRainbowSlot/,
)
assert.match(page, /:key="rainbowSlot"/)
console.log(
  'rainbow save slots: legacy slot kept, three isolated records, safe cabinet switch',
)
