// Ecotone reader settings: motion and contrast toggles (weird-humboldt t-070).
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  DEFAULT_ECOTONE_DISPLAY,
  normalizeEcotoneDisplay,
} from '../ecotone/displaySettings'

// Old saved settings (scale + speed only) keep working and gain safe defaults.
assert.deepEqual(normalizeEcotoneDisplay({ scale: 1.4, speed: 'slow' }), {
  scale: 1.4,
  speed: 'slow',
  motion: 'system',
  contrast: 'standard',
})
assert.equal(DEFAULT_ECOTONE_DISPLAY.motion, 'system')
assert.equal(DEFAULT_ECOTONE_DISPLAY.contrast, 'standard')

assert.deepEqual(
  normalizeEcotoneDisplay({
    scale: 1,
    speed: 'instant',
    motion: 'reduce',
    contrast: 'high',
  }),
  { scale: 1, speed: 'instant', motion: 'reduce', contrast: 'high' },
)

// Garbage values fall back instead of leaking into the UI.
const junk = normalizeEcotoneDisplay({ motion: 'spin', contrast: 7 })
assert.equal(junk.motion, 'system')
assert.equal(junk.contrast, 'standard')
assert.deepEqual(normalizeEcotoneDisplay(null), DEFAULT_ECOTONE_DISPLAY)

// The board wires both toggles, honours "reduce" in the text reveal, and arms
// the collection reset behind a second press.
const board = readFileSync('components/ecotone-board.vue', 'utf8')
assert.match(board, /'ecotone-reduce-motion': motionSetting === 'reduce'/)
assert.match(board, /'ecotone-high-contrast': contrastSetting === 'high'/)
assert.match(board, /motionSetting\.value === 'reduce' \|\|/)
assert.match(board, /if \(!resetArmed\.value\) \{/)
assert.match(board, /game\.resetCollection\(\)/)

const store = readFileSync('stores/ecotoneStore.ts', 'utf8')
const reset = store.slice(store.indexOf('function resetCollection()'))
const body = reset.slice(0, reset.indexOf('\n  }\n'))
assert.match(body, /endings\.value = \[\]/)
assert.match(body, /caseFiles\.value = \{\}/)
assert.doesNotMatch(body, /run\.value|manualSaves/)

console.log('ecotone display settings: ok')
