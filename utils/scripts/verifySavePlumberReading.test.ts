import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  createSavePlumberPreview,
  PLUMBER_LARGE_TEXT,
  PLUMBER_SLOW_READING,
} from '../arcade/games/savePlumberPreview'

// Save the Plumber reading options (conductor save-the-plumber t-028, main-game
// standard "text size and reading speed"): Large text draws story, banner, finale
// and boss lines bigger without overflowing the 480px screen; Slow reading holds
// story panels and boss speech plates up longer.
const source = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8')

type Reader = {
  largeText: boolean
  slowReading: boolean
  storyPanelTicks: number
  bossLineTicks: number
  readSize(
    g: CanvasRenderingContext2D,
    words: string,
    size: number,
    width?: number,
  ): number
}
const make = (largeText?: boolean, slowReading?: boolean) =>
  createSavePlumberPreview({
    rng: () => 0.5,
    sound: { play() {} },
    demo: false,
    hiScore: 0,
    largeText,
    slowReading,
  }) as unknown as Reader

// A context whose glyphs are half as wide as the current font size.
const fake = () => {
  const g = { font: '' } as {
    font: string
    measureText(w: string): { width: number }
  }
  g.measureText = (words: string) => ({
    width: words.length * Number(/(\d+(?:\.\d+)?)px/.exec(g.font)![1]) * 0.5,
  })
  return g as unknown as CanvasRenderingContext2D
}

const plain = make()
assert.equal(plain.largeText, false, 'large text defaults off')
assert.equal(plain.slowReading, false, 'slow reading defaults off')
assert.equal(plain.readSize(fake(), 'short line', 12), 12)
assert.equal(plain.storyPanelTicks, 330)
assert.equal(plain.bossLineTicks, 150)

const large = make(true, false)
assert.equal(
  large.readSize(fake(), 'short line', 12),
  Math.round(12 * PLUMBER_LARGE_TEXT),
  'large text scales a short line',
)
// A long line shrinks to fit but never below its normal size.
const long = 'x'.repeat(70)
const fitted = large.readSize(fake(), long, 12)
assert.ok(fitted >= 12, 'never smaller than the normal size')
assert.ok(long.length * fitted * 0.5 <= 464 + 1e-9, 'fits the screen width')
const huge = 'x'.repeat(120)
assert.equal(
  large.readSize(fake(), huge, 12),
  12,
  'falls back to the normal size',
)
assert.equal(large.storyPanelTicks, 330, 'large text alone keeps the pace')

const slow = make(false, true)
assert.equal(slow.storyPanelTicks, Math.round(330 * PLUMBER_SLOW_READING))
assert.equal(slow.bossLineTicks, Math.round(150 * PLUMBER_SLOW_READING))
assert.equal(slow.readSize(fake(), 'short line', 12), 12)

// The story timer the game actually arms follows the reading pace.
{
  const run = createSavePlumberPreview({
    rng: () => 0.5,
    sound: { play() {} },
    demo: false,
    hiScore: 0,
    slowReading: true,
  }) as unknown as {
    modeTimer: number
    taunt(words: string): void
    bossLine: { timer: number } | null
  }
  run.taunt('Hold still!')
  assert.equal(run.bossLine?.timer, Math.round(150 * PLUMBER_SLOW_READING))
}

// Wiring: the store persists both, resets them, the cabinet passes them in and
// the Settings pane offers them.
const store = source('../../stores/arcadeStore.ts')
for (const key of ['largeText', 'slowReading']) {
  assert.match(
    store,
    new RegExp(`${key}\\?: boolean`),
    `${key} is a saved pref`,
  )
  assert.match(store, new RegExp(`${key}\\.value = prefs\\.${key} === true`))
  assert.match(store, new RegExp(`${key}: ${key}\\.value,`))
  assert.match(store, new RegExp(`^ {4}${key},$`, 'm'))
}
assert.match(store, /^ {4}setLargeText,$/m)
assert.match(store, /^ {4}setSlowReading,$/m)
const reset = store.match(
  /function resetCabinetSettings\(prefersReducedMotion: boolean\) \{([\s\S]*?)\n {2}\}/,
)?.[1]
assert.ok(reset)
assert.match(reset, /largeText\.value = false/)
assert.match(reset, /slowReading\.value = false/)
const cabinet = source('../../components/arcade/arcade-cabinet.vue')
assert.equal(cabinet.match(/largeText: store\.largeText,/g)?.length, 2)
assert.equal(cabinet.match(/slowReading: store\.slowReading,/g)?.length, 2)
const page = source('../../pages/play/save-the-plumber.vue')
assert.match(page, /arcade\.setLargeText\(!arcade\.largeText\)/)
assert.match(page, /arcade\.setSlowReading\(!arcade\.slowReading\)/)
assert.match(page, /<strong>Large text<\/strong>/)
assert.match(page, /<strong>Slow reading<\/strong>/)

console.log('save the plumber reading options: ok')
