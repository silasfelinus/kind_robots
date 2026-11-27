import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  MEMORY_DISPLAY_DEFAULTS,
  MEMORY_DISPLAY_KEY,
  loadMemoryDisplay,
  memoryDisplayClasses,
  sanitizeMemoryDisplay,
  saveMemoryDisplay,
} from '../memoryDungeon/displaySettings'

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  }
}

// Unknown, malformed or hostile values fall back to defaults.
assert.deepEqual(sanitizeMemoryDisplay(null), MEMORY_DISPLAY_DEFAULTS)
assert.deepEqual(
  sanitizeMemoryDisplay({
    textSize: 'huge',
    reducedMotion: 'yes',
    highContrast: 1,
  }),
  MEMORY_DISPLAY_DEFAULTS,
)
assert.deepEqual(
  loadMemoryDisplay(memoryStorage({ [MEMORY_DISPLAY_KEY]: '{not json' })),
  MEMORY_DISPLAY_DEFAULTS,
)
assert.deepEqual(loadMemoryDisplay(null), MEMORY_DISPLAY_DEFAULTS)
const throwing = {
  getItem: () => {
    throw new Error('denied')
  },
  setItem: () => {
    throw new Error('denied')
  },
  removeItem: () => {
    throw new Error('denied')
  },
}
assert.deepEqual(loadMemoryDisplay(throwing), MEMORY_DISPLAY_DEFAULTS)
saveMemoryDisplay(throwing, {
  textSize: 'large',
  reducedMotion: true,
  highContrast: true,
})

// Round trip, and defaults leave no stored key behind.
const storage = memoryStorage()
const chosen = {
  textSize: 'larger',
  reducedMotion: true,
  highContrast: true,
} as const
saveMemoryDisplay(storage, chosen)
assert.deepEqual(loadMemoryDisplay(storage), chosen)
saveMemoryDisplay(storage, { ...MEMORY_DISPLAY_DEFAULTS })
assert.equal(storage.data.has(MEMORY_DISPLAY_KEY), false)

// Display settings never share the expedition, checkpoint or card-back keys.
assert.match(MEMORY_DISPLAY_KEY, /display/)
const store = readFileSync('stores/memoryWorldStore.ts', 'utf8')
assert.equal(store.includes(MEMORY_DISPLAY_KEY), false)

assert.deepEqual(memoryDisplayClasses(MEMORY_DISPLAY_DEFAULTS), [])
assert.deepEqual(memoryDisplayClasses(chosen), [
  'md-text-larger',
  'md-reduce-motion',
  'md-high-contrast',
])

// Every class the helper can emit is styled, and the settings dialog exposes the controls.
const css = readFileSync('assets/css/memory-dungeon.css', 'utf8')
for (const cls of [
  'md-text-large',
  'md-text-larger',
  'md-reduce-motion',
  'md-high-contrast',
])
  assert.ok(css.includes(`.${cls} `), `missing CSS for ${cls}`)
const overworld = readFileSync(
  'components/pages/memory-dungeon-overworld.vue',
  'utf8',
)
assert.ok(overworld.includes(':class="displayClasses"'))
assert.ok(overworld.includes('data-testid="memory-display-settings"'))
assert.ok(overworld.includes('data-testid="memory-display-reduced-motion"'))
assert.ok(overworld.includes('data-testid="memory-display-high-contrast"'))
assert.ok(overworld.includes('v-for="size in MEMORY_TEXT_SIZES"'))

console.log('memory display settings: ok')
