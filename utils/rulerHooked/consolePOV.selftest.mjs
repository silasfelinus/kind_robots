import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

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
const tutorial = read('components/ruler-hooked/ruler-hooked-tutorial.vue')

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
assert.equal(
  (stage.match(/<img\b/g) || []).length,
  1,
  'opaque region vistas must use a single image, never a stacked z-list',
)
assert.match(stage, /v-if="activeLayer\?\.src"/)
assert.match(stage, /aria-pressed="activeLayer\?\.region === layer\.region"/)
assert.match(stage, /@click="selectedRegion = layer\.region"/)
assert.match(stage, /changedVistaRegion\(/)
assert.doesNotMatch(stage, /v-for="layer in artLayers"/)
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

assert.match(court, /characterCandidates\(presenter\.slug, presenterMood\)/)
assert.match(court, /lastDecreeMood\.value = choice\?\.reactionMood/)
assert.match(tutorial, /characterCandidates\(ADVISOR_CHARACTER_SLUG, mood\)/)
assert.match(game, /:mood="store\.advisorLine\?\.mood/)

// The illustrated Court presenter must never be obscured by a tall health
// panel beneath the title. On full-width consoles the four kingdom meters
// (Hearts, Nature, Prosperity, Order; t-054 moved Treasury onto the coin
// capsule) share a top row between the title cartouche and the coin/day/time
// capsules. Narrow screens require an explicit user action to show the panel.
assert.match(hud, /class="rh-hud__health"/)
assert.match(hud, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/)
assert.match(hud, /METER_AXES/)
assert.match(hud, /Treasury \$\{treasury\}%/)
assert.match(hud, /@container rhconsole \(max-width: 899px\)/)
assert.match(hud, /\.rh-health\.is-open/)
assert.doesNotMatch(hud, /\.rh-hud__left/)

// Classic mode must be a one-control visual game, not two web-app reel/slack
// buttons. The stop moves through the existing deterministic timing engine,
// which already varies with fish family, rarity, gear and beat.
assert.equal((classic.match(/<button\b/g) || []).length, 1)
assert.match(classic, /rh-fishing__playfield/)
assert.match(classic, /event\.key === ' '/)
assert.match(classic, /event\.key === 'Enter'/)
assert.match(classic, /@keydown="playfieldKeydown"/)
assert.match(classic, /@keyup="playfieldKeyup"/)
assert.match(classic, /event\.preventDefault\(\)/)
assert.match(classic, /!event\.repeat/)
assert.match(classic, /displayedBeat !== beatKey\.value/)
assert.match(classic, /acceptedBeat === beatKey\.value/)
assert.match(classic, /acceptedBeat = beatKey\.value/)
assert.doesNotMatch(classic, /transition: left 35ms/)
assert.doesNotMatch(
  classic,
  /left 1[78]0ms/,
  'the visible scoring bands must not interpolate behind the real target',
)
assert.match(classic, /timingProfileFor\(props\.encounter\)/)
assert.match(classic, /suddenShift/)
assert.doesNotMatch(classic, /Tap to reel|Give slack|@release|@tap/)
const timingSource = classic
  .slice(
    classic.indexOf('let startedAt:'),
    classic.indexOf('defineExpose({ stop })'),
  )
  .replace(/: (number|string) \| null/g, '')
  .replace('time: number', 'time')

assert.match(classic, /watch\(beatKey, resetSweep, /)
assert.match(
  classic,
  /document.addEventListener\('visibilitychange', resetSweep\)/,
)
assert.match(
  classic,
  /document.removeEventListener\('visibilitychange', resetSweep\)/,
)

function exerciseSweep(sweepMs, frameInterval) {
  const encounter = { id: 'test-fish', beat: 0, phase: 'FIGHT' }
  const marker = { value: 0 }
  const document = { hidden: false }
  const accepted = []
  let now = 0
  const { tick, stop, resetSweep } = runInNewContext(
    timingSource + '\n;({ tick, stop, resetSweep })',
    {
      props: { encounter },
      computed: (get) => ({
        get value() {
          return get()
        },
      }),
      marker,
      profile: { value: { sweepMs } },
      document,
      performance: { now: () => now },
      requestAnimationFrame: () => 1,
      emit: (event, position) => {
        assert.equal(event, 'stop')
        accepted.push(position)
      },
    },
  )

  stop()
  assert.equal(accepted.length, 0, 'no input before the first frame')
  tick(0)
  for (let t = frameInterval; t < sweepMs / 2; t += frameInterval) tick(t)
  tick(sweepMs / 2)
  assert.equal(marker.value, 50, 'a timestamp of zero is a valid start')
  now = sweepMs / 2 + 240
  stop()
  assert.deepEqual(accepted, [50], 'score the displayed marker, not latency')
  for (let i = 0; i < 100; i++) stop()
  assert.equal(accepted.length, 1, 'same-beat spam is rejected')

  encounter.beat++
  resetSweep()
  stop()
  assert.equal(accepted.length, 1, 'a fresh beat needs a fresh frame')
  tick(now)
  stop()
  assert.equal(accepted.length, 1, 'the debounce spans beat changes')
  now += 200
  tick(now)
  const visible = Math.round(marker.value * 10) / 10
  stop()
  assert.deepEqual(accepted, [50, visible])

  encounter.beat++
  resetSweep()
  tick(now)
  now += 200
  tick(now)
  document.hidden = true
  resetSweep()
  now += 2000
  tick(now)
  stop()
  assert.equal(accepted.length, 2, 'hidden tabs cannot score a stop')
  document.hidden = false
  resetSweep()
  stop()
  assert.equal(accepted.length, 2, 'resume needs a new visible frame')
  tick(now)
  now += sweepMs * 1.5
  tick(now)
  assert.equal(marker.value, 50, 'the return sweep is frame-independent')
  stop()
  assert.deepEqual(accepted, [50, visible, 50])
}

for (const sweepMs of [650, 1000, 1600, 3000]) {
  for (const frameInterval of [16, 33, 100, 250]) {
    exerciseSweep(sweepMs, frameInterval)
  }
}
console.log('Ruler input latency and frame pacing: 16 scenarios passed')

assert.match(lake, /store\.startFishing\(quiz\.mode\)/)
assert.match(lake, /@stop="store\.classicStop\(\$event\)"/)
assert.match(fishingStore, /startFishingEncounter\(save\.value\)/)
assert.match(
  fishingStore,
  /applyFishingStop\(activeClassicFishing\.value, position\)/,
)

assert.match(lake, /store\.lastCatch && store\.fishingRevealPending/)
assert.match(lake, /store\.lastEscape && store\.fishingRevealPending/)
assert.match(lake, /if \(store\.fishingRevealPending\) return dismiss\(\)/)
assert.match(lake, /if \(store\.pendingEnding\) return 'Consider the finale'/)
assert.match(lake, /function dismiss\(\) \{\s*store\.dismissFishingReveal\(\)/)
assert.match(
  lake,
  /function viewFishopedia\(\) \{\s*store\.dismissFishingReveal\(\)/,
)
assert.match(fishingStore, /const fishingRevealPending = ref\(false\)/)
assert.match(
  fishingStore,
  /function dismissFishingReveal\(\) \{\s*fishingRevealPending\.value = false/,
)
assert.match(
  fishingStore,
  /if \(!simpleFishingFinished\(nextEncounter\)\) return\s*fishingRevealPending\.value = true/,
)
assert.doesNotMatch(lake, /const showReveal = ref/)

// Ordinary healthy kingdom sliders must not put a game-over choice at the
// end of every day. A genuine finale explains the save closure, and deferring
// it is an explicit one-time decision.
assert.match(court, /Conclude this reign/)
assert.match(court, /Continue this reign/)
assert.match(court, /closes this save for fishing and new decrees/)

console.log('Ruler console creation and unseen-player POV contract passed.')
