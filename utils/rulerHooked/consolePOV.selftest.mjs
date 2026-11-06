import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const route = read('components/conductor/ruler-hooked-page.vue')
const game = read('components/ruler-hooked/ruler-hooked-game.vue')
const slots = read('components/ruler-hooked/ruler-hooked-slots.vue')
const picker = read('components/ruler-hooked/ruler-hooked-cosmetics-picker.vue')
const stage = read('components/ruler-hooked/ruler-hooked-stage.vue')
const chronicle = read('components/ruler-hooked/ruler-hooked-reign-review.vue')
const nav = read('components/ruler-hooked/ruler-hooked-nav.vue')
const lake = read('components/ruler-hooked/ruler-hooked-lake-screen.vue')
const artLibrary = read('utils/rulerHooked/artLibrary.ts')
const hud = read('components/ruler-hooked/ruler-hooked-hud.vue')
const classic = read(
  'components/ruler-hooked/ruler-hooked-fishing-encounter.vue',
)
const fishingStore = read('stores/rulerHookedStore.ts')
const court = read('components/ruler-hooked/ruler-hooked-court-screen.vue')

assert.match(
  route,
  /class="kr-stage"/,
  'the game must occupy a bounded console stage',
)
assert.doesNotMatch(
  route,
  /<project-front-page\b/,
  'do not restore the scrolling project landing page',
)

assert.match(game, /v-if="!store\.save"/)
assert.match(game, /<RulerHookedSlots[^>]*@picked="onPicked"/)
assert.match(
  slots,
  /:candidates="BACKDROPS\.title"/,
  'the coronation ledger sits on a full-bleed painting',
)
assert.match(nav, /aria-label="Ruler Hooked screens"/)
assert.match(game, /<RulerHookedNav\b/)

assert.match(slots, /<RulerHookedCosmeticsPicker/)
assert.match(slots, /v-model="rulerName"/)
assert.match(slots, /v-model="honorific"/)
assert.match(slots, /v-model="presetId"/)
assert.match(slots, /customPortraitFile: customPortraitFile\.value/)
assert.match(slots, /store\.newGame\(/)
assert.match(slots, /function saveRename\(\)/)
assert.doesNotMatch(
  slots,
  /window\.prompt/,
  'in-game naming must not open browser prompts',
)

assert.match(picker, /v-for="preset in presets"/)
assert.match(picker, /\/images\/ruler-hooked\/ruler-\$\{chosen\.id\}\.webp/)
assert.match(picker, /Use your own portrait/)
assert.match(
  picker,
  /onBeforeUnmount\(/,
  'custom preview object URLs need cleanup',
)

// This is the core first-person promise: player appearance may only be used in
// the creation screen, never in the kingdom environment's layered artwork.
assert.match(stage, /k !== 'ruler'/)
assert.doesNotMatch(
  stage,
  /getPortraitUrl|rulerCustomPortraitId|customPortraitUrl|RULER_LAYER_FALLBACK_STATE/,
)
assert.match(stage, /assetCandidates\(region, state, scene\.time\)/)
assert.doesNotMatch(
  game,
  /rulerCustomPortraitId|rulerCosmetics|ruler-fishing\.webp/,
  'game screens must not display player likeness',
)

// The illustrated lake screen is first person too: its backdrop comes from
// the art library's lake chain, which never names a ruler or key-art piece.
assert.match(lake, /lakeBackdropCandidates\(/)
assert.doesNotMatch(
  lake,
  /getPortraitUrl|customPortraitUrl|rulerCosmetics|\/images\/ruler-hooked\/ruler-|key-art/,
  'the lake view never shows the player likeness',
)
const lakeChain = artLibrary.slice(
  artLibrary.indexOf('export function lakeBackdropCandidates'),
)
assert.doesNotMatch(
  lakeChain.slice(0, lakeChain.indexOf('\n}\n')),
  /ruler-|key-art/,
  'the lake backdrop chain stays first person',
)

assert.doesNotMatch(
  chronicle,
  /getPortraitUrl|customPortraitUrl|portraitSrc|\/images\/ruler-hooked\/ruler-/,
  'the ruler must remain unseen even in the in-game chronicle',
)
assert.match(
  chronicle,
  /\{\{ rulerLabel \}\}/,
  'the ruler identity persists in written records',
)

// The illustrated Court presenter must never be obscured by a five-row health
// panel beneath the title. On full-width consoles five axes share a top row
// between the crest and the coin/day/time plaques. Narrow screens require an
// explicit user action to show the panel.
assert.match(hud, /class="rh-hud__health"/)
assert.match(hud, /grid-template-columns:\s*repeat\(5, minmax\(0, 1fr\)\)/)
assert.match(hud, /@container rhconsole \(max-width: 899px\)/)
assert.match(hud, /\.rh-health\.is-open/)
assert.doesNotMatch(hud, /\.rh-hud__left/)

// Classic mode must be a one-control visual game, not two web-app reel/slack
// buttons. The stop moves through the existing deterministic timing engine,
// which already varies with fish family, rarity, gear and beat.
assert.equal((classic.match(/<button\b/g) || []).length, 1)
assert.match(classic, /rh-fishing__playfield/)
assert.match(classic, /event\.key !== ' '/)
assert.match(classic, /event\.key !== 'Enter'/)
assert.match(classic, /timingProfileFor\(props\.encounter\)/)
assert.match(classic, /suddenShift/)
assert.doesNotMatch(classic, /Tap to reel|Give slack|@release|@tap/)
assert.match(lake, /store\.startFishing\(quiz\.mode\)/)
assert.match(lake, /@stop="store\.classicStop\(\$event\)"/)
assert.match(fishingStore, /startFishingEncounter\(save\.value\)/)
assert.match(
  fishingStore,
  /applyFishingStop\(activeClassicFishing\.value, position\)/,
)

// Ordinary healthy kingdom sliders must not put a game-over choice at the
// end of every day. A genuine finale explains the save closure, and deferring
// it is an explicit one-time decision.
assert.match(court, /Conclude this reign/)
assert.match(court, /Continue this reign/)
assert.match(court, /closes this save for fishing and new decrees/)

console.log('Ruler console creation and unseen-player POV contract passed.')
