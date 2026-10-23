import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const route = read('components/conductor/ruler-hooked-page.vue')
const game = read('components/ruler-hooked/ruler-hooked-game.vue')
const slots = read('components/ruler-hooked/ruler-hooked-slots.vue')
const picker = read('components/ruler-hooked/ruler-hooked-cosmetics-picker.vue')
const stage = read('components/ruler-hooked/ruler-hooked-stage.vue')
const chronicle = read('components/ruler-hooked/ruler-hooked-reign-review.vue')

assert.match(route, /class="kr-stage"/, 'the game must occupy a bounded console stage')
assert.doesNotMatch(route, /<project-front-page\b/, 'do not restore the scrolling project landing page')

assert.match(game, /v-if="!store\.save"/)
assert.match(game, /<RulerHookedSlots[^>]*@picked="onPicked"/)
assert.match(game, /:fill="true"/, 'the coronation uses an illustrated full-stage setting')
assert.match(game, /aria-label="Ruler Hooked screens"/)

assert.match(slots, /<RulerHookedCosmeticsPicker/)
assert.match(slots, /v-model="rulerName"/)
assert.match(slots, /v-model="honorific"/)
assert.match(slots, /v-model="presetId"/)
assert.match(slots, /customPortraitFile: customPortraitFile\.value/)
assert.match(slots, /store\.newGame\(/)
assert.match(slots, /function saveRename\(\)/)
assert.doesNotMatch(slots, /window\.prompt/, 'in-game naming must not open browser prompts')

assert.match(picker, /v-for="preset in presets"/)
assert.match(picker, /\/images\/ruler-hooked\/ruler-\$\{chosen\.id\}\.webp/)
assert.match(picker, /Use your own portrait/)
assert.match(picker, /onBeforeUnmount\(/, 'custom preview object URLs need cleanup')

// This is the core first-person promise: player appearance may only be used in
// the creation screen, never in the kingdom environment's layered artwork.
assert.match(stage, /k !== 'ruler'/)
assert.doesNotMatch(stage, /getPortraitUrl|rulerCustomPortraitId|customPortraitUrl|RULER_LAYER_FALLBACK_STATE/)
assert.match(stage, /assetCandidates\(region, state, scene\.time\)/)
assert.doesNotMatch(
  game,
  /rulerCustomPortraitId|rulerCosmetics|ruler-fishing\.webp/,
  'game screens must not display player likeness',
)

assert.doesNotMatch(
  chronicle,
  /getPortraitUrl|customPortraitUrl|portraitSrc|\/images\/ruler-hooked\/ruler-/,
  'the ruler must remain unseen even in the in-game chronicle',
)
assert.match(chronicle, /\{\{ rulerLabel \}\}/, 'the ruler identity persists in written records')

console.log('Ruler console creation and unseen-player POV contract passed.')
