<!-- The Ruler Is Hooked: the illustrated console (2026-11-05 overhaul) in the
     psychedelic rainbow lock (art-direction section 10, t-054).
     Every screen is a painting first: a full-bleed backdrop, a painted HUD
     over it, and a deck of vignette tabs below. No web-app cards or toolbars.
     Screens: Lake (first-person fishing), Map (royal atlas), Court
     (petitions + endings), Gear (tackle + kingdom works), Fishopedia, plus
     the crown menu's Chronicle and Saves. Overlays: the once-per-reign
     coronation, the Town Crier's daily proclamation, Quill's lessons and the
     newest petition's banner. The frame takes the reign's tier (console.ts
     reignTier): an exuberant spectrum when pristine, clashing and warped when
     strained, and when rotten poisonous chartreuse, oil-slick rainbows, violet
     fumes and hot-pink fractures over deep indigo. -->
<template>
  <ClientOnly>
    <main
      ref="consoleEl"
      class="rh-console"
      :data-tier="tier"
      :data-screen="screen"
    >
      <template v-if="!store.save">
        <RulerHookedSlots class="rh-console__full" @picked="onPicked" />
      </template>

      <template v-else>
        <RulerHookedOpening
          v-if="screen === 'opening'"
          class="rh-console__full"
          @skip="finishOpening"
          @done="finishOpening"
        />

        <template v-else>
          <div class="rh-console__view">
            <RulerHookedLakeScreen
              v-if="screen === 'lake'"
              ref="lakeEl"
              @navigate="go"
            />
            <RulerHookedMapScreen
              v-else-if="screen === 'map'"
              ref="mapEl"
              @navigate="go"
            />
            <RulerHookedCourtScreen
              v-else-if="screen === 'court'"
              @navigate="go"
              @chose="onChose"
            />
            <RulerHookedGearScreen v-else-if="screen === 'gear'" />
            <RulerHookedStudySettings v-else-if="screen === 'settings'" />
            <RulerHookedFishopedia
              v-else-if="screen === 'fishopedia'"
              :save="store.save"
            />
            <section
              v-else-if="screen === 'chronicle'"
              class="rh-screen"
              aria-label="Chronicle of the reign"
            >
              <RulerHookedArt
                class="rh-backdrop rh-console__dim"
                :candidates="BACKDROPS.court"
              />
              <div class="rh-parchment rh-console__sheet">
                <RulerHookedReignReview :save="store.save" />
              </div>
            </section>
            <section v-else-if="screen === 'saves'" class="rh-screen">
              <RulerHookedSlots @picked="onPicked" />
            </section>

            <div class="rh-frame" aria-hidden="true">
              <svg
                v-if="tier === 'rotten'"
                class="rh-fracture"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                focusable="false"
              >
                <path
                  d="M0 22 L2 25 L1 29 L2.6 32 L1.4 36 L2.4 40 M2.6 32 L0 34"
                />
                <path
                  d="M100 58 L98.2 61 L99.2 65 L97.8 69 L99.3 73 L97.9 78 L99.1 83 L98 88 L99.3 93 L98.2 100 M97.8 69 L100 71.5"
                />
                <path d="M0 84 L1.8 87 L1.1 91 L2.5 95 L1.6 100" />
              </svg>
            </div>

            <RulerHookedHud
              v-if="screen !== 'saves'"
              :health="store.save.kingdomHealth"
              :coins="store.coins"
              :day="store.day"
              :time="store.timeOfDay"
              :lessons-left="lessonsLeft"
              @navigate="navigateFromHud"
              @skip-tutorial="store.skipTutorial()"
            />

            <button
              v-if="showPetition"
              type="button"
              class="rh-petition"
              data-testid="rh-petition"
              @click="go('court')"
            >
              <span class="rh-petition__badge" aria-hidden="true">
                <RulerHookedGlyph name="crown" />
              </span>
              <span class="rh-petition__copy">
                <strong class="rh-petition__head">{{ petitionHead }}</strong>
                <span class="rh-petition__body">{{
                  store.activeCard?.title
                }}</span>
              </span>
            </button>

            <RulerHookedCrier
              v-if="store.proclamation && screen !== 'saves'"
              :day="store.proclamation.day"
              :event="store.proclamation.event"
              @hear="hear"
            />
            <RulerHookedTutorial
              v-else-if="lesson && navScreen"
              :lesson="lesson"
              :screen="navScreen"
              :name="advisorName"
              @learn="store.learnTutorial($event)"
              @skip="store.skipTutorial()"
              @go="go"
            />
          </div>

          <RulerHookedNav
            :model-value="navScreen ?? 'lake'"
            :badges="badges"
            :pointed="lesson?.points ?? null"
            :prompts="prompts"
            @update:model-value="go"
          />
        </template>
      </template>
    </main>

    <template #fallback>
      <div class="rh-console rh-console--loading">
        Preparing the royal lake…
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { useRulerHookedStore } from '~/stores/rulerHookedStore'
import { useRulerHookedQuizStore } from '~/stores/rulerHookedQuizStore'
import { BACKDROPS } from '~/utils/rulerHooked/artLibrary'
import {
  reignTier,
  stepTab,
  type ConsoleTab,
} from '~/utils/rulerHooked/console'
import { FIGHT_PROMPT, fightAim } from '~/utils/rulerHooked/timingBar'
import {
  isTextEntry,
  newPadMemory,
  readPad,
  type ConsoleCommand,
} from '~/utils/consoleInput'
import {
  currentLesson,
  lessonsRemaining,
  type ConsoleScreen,
} from '~/utils/rulerHooked/tutorial'

type Screen = ConsoleScreen | 'opening' | 'settings'

const store = useRulerHookedStore()
const quiz = useRulerHookedQuizStore()
const screen = ref<Screen>('lake')
const consoleEl = ref<HTMLElement | null>(null)
const lakeEl = ref<{ press: () => void } | null>(null)
const mapEl = ref<{ step: (n: number) => void; confirm: () => void } | null>(
  null,
)

const navScreen = computed<ConsoleScreen | null>(() =>
  screen.value === 'opening' || screen.value === 'settings'
    ? null
    : (screen.value as ConsoleScreen),
)

const tier = computed(() =>
  store.save ? reignTier(store.save.kingdomHealth) : 'pristine',
)

function go(next: ConsoleScreen) {
  screen.value = next
}
function navigateFromHud(next: 'chronicle' | 'saves' | 'settings') {
  screen.value = next
}
function onPicked() {
  screen.value = store.showOpening ? 'opening' : 'lake'
}
// A new or loaded reign unmounts the slots screen as it starts, sometimes
// before its `picked` event lands -- so follow the active save itself.
watch(
  () => store.save?.saveId,
  (id, was) => {
    if (id && id !== was) onPicked()
  },
)
function finishOpening() {
  store.dismissOpening()
  screen.value = 'lake'
}
function hear() {
  store.hearProclamation()
  store.learnTutorial('crier')
}
function onChose() {
  store.learnTutorial('petition')
}

const badges = computed<Partial<Record<ConsoleScreen, boolean>>>(() => ({
  court: !!store.activeCard || !!store.pendingEnding,
}))

const showPetition = computed(
  () =>
    !!store.activeCard &&
    !store.proclamation &&
    !['court', 'saves', 'chronicle', 'settings'].includes(screen.value),
)
const petitionHead = computed(() => {
  const kind = store.activeCard?.kind
  if (kind === 'arc-step') return 'The Chronicle Turns'
  if (kind === 'finale') return 'A Reign Decides'
  return 'New Royal Petition!'
})

const lesson = computed(() =>
  store.save && navScreen.value
    ? currentLesson(store.save, {
        screen: navScreen.value,
        fishing: !!store.activeFishing,
        hasCatch: !!store.lastCatch,
        hasPetition: !!store.activeCard,
        hasProclamation: !!store.proclamation,
      })
    : null,
)
const lessonsLeft = computed(() =>
  store.save ? lessonsRemaining(store.save) : 0,
)
const advisorName = computed(() => store.advisorCharacter?.name ?? 'Quill')

// Action lessons retire themselves when the player does the thing.
watch(
  () => !!store.activeFishing,
  (fishing, was) => {
    if (fishing) store.learnTutorial('cast')
    else if (was) store.learnTutorial('reel')
  },
)
watch(screen, (s) => {
  if (s === 'court' && store.activeCard) store.learnTutorial('petition')
  if (s === 'fishopedia' && store.lastCatch) store.learnTutorial('fishopedia')
  if (s === 'map' && (store.save?.counters.cardsResolved ?? 0) >= 1)
    store.learnTutorial('atlas')
  if (s === 'gear' && (store.save?.counters.coins ?? 0) >= 40)
    store.learnTutorial('gear')
})

// The button-prompt footer (t-054): what A and X do on this screen right now.
const prompts = computed(() => {
  const s = screen.value
  if (s === 'chronicle' || s === 'saves' || s === 'settings')
    return [{ key: 'B', label: 'Back' }]
  if (s === 'lake') {
    const fight = store.activeClassicFishing
    if (fight) return [{ key: 'A', label: FIGHT_PROMPT[fightAim(fight)] }]
    if (store.activeFishing) return [{ key: 'A', label: 'Answer' }]
    const lead = store.activeCard
      ? 'Answer the Petition'
      : store.pendingEnding
        ? 'Consider the Finale'
        : store.canFish
          ? 'Cast a Line'
          : ''
    return [
      ...(lead ? [{ key: 'A', label: lead }] : []),
      { key: 'X', label: 'Fishopedia' },
    ]
  }
  if (s === 'map')
    return [
      { key: '◀▶', label: 'Region' },
      { key: 'A', label: 'Select' },
    ]
  if (s === 'court' && store.activeCard)
    return [
      { key: '◀▶', label: 'Choose' },
      { key: 'A', label: 'Decree' },
    ]
  return [{ key: 'A', label: 'Select' }]
})

function focusCard(step: number) {
  const cards = [
    ...(consoleEl.value?.querySelectorAll<HTMLElement>(
      '.krh-card:not([disabled])',
    ) ?? []),
  ]
  if (!cards.length) return
  const at = cards.indexOf(document.activeElement as HTMLElement)
  const next = at < 0 ? 0 : (at + step + cards.length) % cards.length
  cards[next]?.focus()
}

function tabStep(step: number) {
  const from = (navScreen.value ?? 'lake') as ConsoleTab
  go(stepTab(from, step))
}

type Command = ConsoleCommand | 'fishopedia'

function run(command: Command) {
  const s = screen.value
  if (command === 'prevTab') return tabStep(-1)
  if (command === 'nextTab') return tabStep(1)
  if (command === 'back') {
    if (s === 'chronicle' || s === 'saves' || s === 'settings') go('lake')
    return
  }
  if (s === 'lake') {
    if (command === 'confirm') lakeEl.value?.press()
    if (command === 'fishopedia' && !store.activeFishing) go('fishopedia')
    return
  }
  if (s === 'map') {
    if (command === 'left' || command === 'up') mapEl.value?.step(-1)
    if (command === 'right' || command === 'down') mapEl.value?.step(1)
    if (command === 'confirm') mapEl.value?.confirm()
    return
  }
  if (s === 'court') {
    if (command === 'left') focusCard(-1)
    if (command === 'right') focusCard(1)
    if (command === 'confirm') {
      const el = document.activeElement as HTMLElement | null
      if (el?.classList.contains('krh-card')) el.click()
      else focusCard(0)
    }
  }
}

const KEYS: Record<string, Command> = {
  KeyQ: 'prevTab',
  KeyE: 'nextTab',
  BracketLeft: 'prevTab',
  BracketRight: 'nextTab',
  PageUp: 'prevTab',
  PageDown: 'nextTab',
  Escape: 'back',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  Space: 'confirm',
  Enter: 'confirm',
  KeyX: 'fishopedia',
}

function onKey(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return
  if (!store.save || screen.value === 'opening') return
  const active = document.activeElement as HTMLElement | null
  if (isTextEntry(active)) return
  const command = KEYS[event.code]
  if (!command) return
  // The fishing encounters own their keys while a fish is on the line.
  if (store.activeFishing && command !== 'prevTab' && command !== 'nextTab')
    return
  const onCard = !!active?.classList.contains('krh-card')
  const onControl =
    !!active &&
    active !== document.body &&
    ['BUTTON', 'A', 'SUMMARY', 'SELECT', 'INPUT'].includes(active.tagName)
  const pointing = ['confirm', 'up', 'down', 'left', 'right'].includes(command)
  if (onControl && !onCard && pointing && screen.value !== 'map') return
  if (onControl && command === 'confirm') return
  event.preventDefault()
  run(command)
}

const pad = newPadMemory()
let padX = false
let padFrame = 0
function pollPads(now: number) {
  for (const gamepad of navigator.getGamepads?.() ?? []) {
    if (!gamepad) continue
    if (store.save && screen.value !== 'opening')
      for (const command of readPad(gamepad, pad, now)) run(command)
    const x = !!gamepad.buttons[2]?.pressed
    if (x && !padX && store.save) run('fishopedia')
    padX = x
    break
  }
  padFrame = requestAnimationFrame(pollPads)
}

onMounted(() => {
  quiz.initialize()
  store.init()
  screen.value = store.showOpening ? 'opening' : 'lake'
  window.addEventListener('keydown', onKey)
  padFrame = requestAnimationFrame(pollPads)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  cancelAnimationFrame(padFrame)
})

// Keep the nav height available to overlays (Quill's bubble sits above it).
let navObserver: ResizeObserver | null = null
onMounted(() => {
  if (typeof ResizeObserver === 'undefined') return
  navObserver = new ResizeObserver(() => {
    const nav = consoleEl.value?.querySelector('.rh-nav') as HTMLElement | null
    consoleEl.value?.style.setProperty(
      '--rh-nav-h',
      `${nav?.offsetHeight ?? 0}px`,
    )
  })
  if (consoleEl.value) navObserver.observe(consoleEl.value)
})
onBeforeUnmount(() => navObserver?.disconnect())
</script>

<style>
/* The Ruler Is Hooked: psychedelic rainbow fantasy with a faint screenprint
   texture (art-direction section 10). Unscoped so every console component
   shares one vocabulary; everything is namespaced `rh-`. The legacy names
   stay for sibling components, but their values are chromatic ink and
   spectrum: --rh-gold is cyan, --rh-gold-soft acid yellow, --rh-plum violet,
   --rh-plum-deep the deep indigo ground, --rh-parch/--rh-parch-shade the pale
   mint and pink card grounds. */
.rh-console {
  --rh-plum: #7727dd;
  --rh-plum-deep: #080d35;
  --rh-gold: #2beed3;
  --rh-gold-soft: #ffe75d;
  --rh-parch: #e9fff5;
  --rh-parch-shade: #ffdaee;
  --rh-ink: #10133d;
  --rh-display: 'Trebuchet MS', 'Arial Rounded MT Bold', system-ui, sans-serif;
  --rh-body: 'Trebuchet MS', system-ui, sans-serif;
  /* Accents and the reign's tier knobs (t-054). */
  --rh-hot: #ef3db4;
  --rh-magenta: #ef3db4;
  --rh-green: #46db80;
  --rh-orange: #ffb32b;
  --rh-violet: #b061ff;
  --rh-pink-ink: #a3127a;
  --rh-green-ink: #0b7a48;
  --rh-spectrum: linear-gradient(
    90deg,
    #ef3db4 0 14.3%,
    #ffb32b 0 28.6%,
    #ffe75d 0 42.9%,
    #46db80 0 57.2%,
    #2beed3 0 71.5%,
    #24adea 0 85.8%,
    #a949ea 0
  );
  --rh-warp: 0deg;
  --rh-echo: none;
  --rh-blight: 0;

  container: rhconsole / inline-size;
  position: relative;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--rh-plum-deep);
  color: var(--rh-ink);
  font-family: var(--rh-body);
}
/* A troubled reign: the same rainbow, but the colors clash and shapes warp. */
.rh-console[data-tier='strained'] {
  --rh-gold: #ff5a36;
  --rh-gold-soft: #b8ff2e;
  --rh-plum: #d4199b;
  --rh-hot: #18e0a8;
  --rh-parch: #f6ffd8;
  --rh-parch-shade: #ffd9c7;
  --rh-spectrum: repeating-linear-gradient(
    115deg,
    #ff5a36 0 14px,
    #18e0a8 14px 26px,
    #b8ff2e 26px 40px,
    #d4199b 40px 52px
  );
  --rh-warp: -1.2deg;
  --rh-echo: 2px 0 0 rgb(255 90 54 / 0.7), -2px 0 0 rgb(24 224 168 / 0.6);
  --rh-blight: 0.3;
}
/* A ruined reign is frighteningly vivid, never sepia: poisonous chartreuse,
   oil-slick spectra, violet fumes and hot-pink fractures over deep indigo. */
.rh-console[data-tier='rotten'] {
  --rh-plum: #8f2bff;
  --rh-plum-deep: #0d0636;
  --rh-gold: #c6f432;
  --rh-gold-soft: #e4ff3d;
  --rh-parch: #f3ffd6;
  --rh-parch-shade: #f1dcff;
  --rh-ink: #170a45;
  --rh-hot: #ff2bd6;
  --rh-magenta: #ff2bd6;
  --rh-green: #b5f22e;
  --rh-violet: #a24bff;
  --rh-spectrum: linear-gradient(
    100deg,
    #c6f432,
    #2beed3 22%,
    #8f2bff 45%,
    #ff2bd6 68%,
    #e4ff3d 88%,
    #c6f432
  );
  --rh-warp: 0.8deg;
  --rh-echo: 1.5px 0 0 rgb(255 43 214 / 0.8), -1.5px 0 0 rgb(198 244 50 / 0.7);
  --rh-blight: 1;
}
.rh-console--loading {
  display: grid;
  place-items: center;
  color: var(--rh-gold-soft);
  font-family: var(--rh-display);
}
.rh-console__full {
  grid-row: 1 / -1;
}
.rh-console__view {
  position: relative;
  min-height: 0;
  overflow: hidden;
}
/* The reign's state on every painting: untouched when healthy, hue-clashed
   and slightly warped when strained, poison-shifted (greens to chartreuse,
   reds to hot pink) and over-saturated when rotten. Never darker or sepia. */
.rh-console[data-tier='strained'] .rh-backdrop img,
.rh-console[data-tier='strained'] .rh-tier-art img {
  filter: saturate(1.3) hue-rotate(22deg) contrast(1.05);
}
.rh-console[data-tier='strained'] .rh-backdrop img {
  transform: skewX(-1.2deg) scale(1.04);
}
.rh-console[data-tier='rotten'] .rh-backdrop img,
.rh-console[data-tier='rotten'] .rh-tier-art img {
  filter: saturate(1.5) hue-rotate(-30deg) contrast(1.12);
}

/* The console frame: a flat spectrum outline with an ink keyline, a faint
   screenprint halftone, and a rotten reign's hot-pink fractures. */
.rh-frame {
  position: absolute;
  inset: 0;
  z-index: 25;
  pointer-events: none;
  border: 4px solid transparent;
  border-image: var(--rh-spectrum) 1;
  box-shadow: inset 0 0 0 2px var(--rh-ink);
}
.rh-frame::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
      circle,
      rgb(16 19 61 / 0.07) 0.7px,
      transparent 1.1px
    )
    0 0 / 5px 5px;
}
/* Violet fumes and poison light rise from the painting itself, beneath the
   UI, as the reign fails. */
.rh-console .rh-backdrop::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: var(--rh-blight);
  mix-blend-mode: screen;
  background:
    radial-gradient(
      ellipse at 0% 100%,
      rgb(150 40 255 / 0.65),
      transparent 45%
    ),
    radial-gradient(
      ellipse at 100% 0%,
      rgb(198 244 50 / 0.45),
      transparent 35%
    ),
    radial-gradient(
      ellipse at 100% 100%,
      rgb(255 43 214 / 0.35),
      transparent 35%
    );
}
.rh-console[data-tier='strained'] .rh-frame {
  box-shadow:
    inset 0 0 0 2px var(--rh-ink),
    inset 4px -3px 0 2px rgb(255 90 54 / 0.55);
}
.rh-fracture {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  overflow: visible;
  fill: none;
  stroke: var(--rh-hot);
  stroke-width: 3;
  stroke-linejoin: miter;
  vector-effect: non-scaling-stroke;
  filter: drop-shadow(1.5px 1px 0 var(--rh-gold))
    drop-shadow(0 0 6px rgb(255 43 214 / 0.8));
}
.rh-fracture path {
  vector-effect: non-scaling-stroke;
}

/* The newest petition, hung top-right as a pennant: a flat ink card with a
   spectrum band, a bold outline and a hot badge. */
.rh-petition {
  position: absolute;
  z-index: 29;
  top: clamp(3.4rem, 8cqi, 4.1rem);
  right: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  width: min(19rem, calc(100% - 1rem));
  padding: 0.7rem 0.8rem 1rem 0.55rem;
  border: 0;
  background:
    var(--rh-spectrum) top / 100% 5px no-repeat,
    var(--rh-plum-deep);
  color: #fff;
  font-family: var(--rh-display);
  text-align: left;
  cursor: pointer;
  clip-path: polygon(
    0 0,
    100% 0,
    100% 100%,
    55% 100%,
    50% 86%,
    45% 100%,
    0 100%
  );
  box-shadow: inset 0 0 0 2.5px var(--rh-gold);
  filter: drop-shadow(4px 4px 0 var(--rh-hot));
  rotate: var(--rh-warp);
  transition: transform 0.15s ease;
}
.rh-petition:hover,
.rh-petition:focus-visible {
  transform: translateY(1px);
  outline: none;
}
.rh-petition:focus-visible {
  box-shadow:
    inset 0 0 0 2.5px var(--rh-gold),
    inset 0 0 0 5px var(--rh-gold-soft);
}
.rh-petition__badge {
  display: grid;
  flex: none;
  place-items: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 999px;
  background: var(--rh-hot);
  box-shadow:
    0 0 0 2.5px var(--rh-plum-deep),
    0 0 0 4.5px var(--rh-gold-soft);
}
.rh-petition__badge .rh-glyph {
  width: 1.3rem;
  height: 1.3rem;
}
.rh-petition__copy {
  min-width: 0;
}
.rh-petition__head {
  display: block;
  color: var(--rh-gold-soft);
  font-size: 0.95rem;
  font-weight: 900;
  line-height: 1.1;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.rh-petition__body {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-family: var(--rh-body);
  font-size: 0.88rem;
  font-weight: 700;
  line-height: 1.2;
}
@container rhconsole (max-width: 899px) {
  .rh-petition {
    top: 3rem;
    width: min(15rem, calc(100% - 1rem));
    padding: 0.5rem 0.6rem 0.8rem 0.45rem;
  }
  .rh-petition__badge {
    width: 1.8rem;
    height: 1.8rem;
  }
  .rh-petition__head {
    font-size: 0.78rem;
  }
  .rh-petition__body {
    -webkit-line-clamp: 1;
    font-size: 0.78rem;
  }
}

@container rhconsole (max-width: 559px) {
  .rh-console:not([data-screen='lake']) .rh-petition {
    display: none;
  }
}

.rh-console__dim {
  filter: brightness(0.55) saturate(0.8);
}
.rh-console__sheet {
  position: absolute;
  z-index: 2;
  inset: clamp(4.25rem, 11cqi, 5.5rem) clamp(0.5rem, 2.5cqi, 2rem)
    clamp(0.5rem, 2cqi, 1.25rem);
  overflow-y: auto;
}
.rh-screen {
  position: relative;
  height: 100%;
  width: 100%;
  overflow: hidden;
}
.rh-backdrop {
  position: absolute !important;
  inset: 0;
}
.rh-panel {
  border-radius: 1rem;
  background: linear-gradient(
    150deg,
    rgb(33 26 103 / 0.97),
    rgb(8 13 53 / 0.97)
  );
  border: 2px solid var(--rh-gold);
  box-shadow:
    inset 0 0 0 2px rgb(244 64 185 / 0.33),
    0 8px 22px rgb(0 0 0 / 0.42);
  color: #f4faff;
}
.rh-parchment {
  padding: clamp(0.75rem, 2cqi, 1.25rem);
  border-radius: 0.4rem;
  background: linear-gradient(145deg, var(--rh-parch), var(--rh-parch-shade));
  color: var(--rh-ink);
  border: 2px solid var(--rh-ink);
  box-shadow:
    inset 0 0 0 3px rgb(255 255 255 / 0.5),
    0 0 0 3px color-mix(in oklab, var(--rh-gold) 70%, transparent),
    0 12px 26px rgb(0 0 0 / 0.4);
}
.rh-eyebrow {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--rh-plum);
}
.rh-panel .rh-eyebrow {
  color: var(--rh-gold-soft);
}
.rh-title {
  font-family: var(--rh-display);
  font-weight: 800;
  font-size: clamp(1.15rem, 2.6cqi, 1.5rem);
  line-height: 1.1;
}
.rh-title--big {
  font-size: clamp(1.35rem, 3.6cqi, 2.2rem);
}
.rh-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
  margin-top: 0.3rem;
}
.rh-actions--split > * {
  flex: 1 1 0;
}
.rh-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  min-height: 2.75rem;
  padding: 0.35rem 1rem;
  border-radius: 0.8rem;
  background: #e8fff7;
  color: var(--rh-ink);
  border: 1.5px solid #151647;
  box-shadow: 0 2px 0 rgb(24 16 71 / 0.5);
  font-family: var(--rh-display);
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 120ms ease,
    filter 120ms ease;
}
.rh-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.04);
}
.rh-btn:active:not(:disabled) {
  transform: translateY(1px);
  box-shadow: none;
}
.rh-btn:focus-visible {
  outline: 3px solid var(--rh-plum);
  outline-offset: 2px;
}
.rh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.rh-btn--gold {
  background: #ffe75d;
  border-color: #1b1350;
  color: var(--rh-plum-deep);
}
.rh-btn--big {
  min-height: 3.25rem;
  font-size: 1.1rem;
  padding-inline: 1.4rem;
}
.rh-btn--small {
  min-height: 2.25rem;
  padding: 0.2rem 0.7rem;
  font-size: 0.85rem;
}
.rh-btn--danger {
  color: #b41663;
}
.rh-input {
  min-height: 3rem;
  width: 100%;
  min-width: 0;
  padding: 0.3rem 0.85rem;
  border-radius: 0.7rem;
  background: #f3fffd;
  border: 1.5px solid rgb(24 16 71 / 0.6);
  box-shadow: inset 0 2px 4px rgb(24 16 71 / 0.15);
  color: var(--rh-ink);
  font-family: var(--rh-display);
  font-size: 1.15rem;
}
.rh-input:focus-visible {
  outline: 3px solid var(--rh-gold);
  outline-offset: 1px;
}
.rh-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  padding: 0.05rem 0.45rem 0.05rem 0.2rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 800;
  background: rgb(255 255 255 / 0.6);
  border: 1px solid rgb(24 16 71 / 0.25);
}
.rh-chip.is-up {
  color: #2f6a22;
}
.rh-chip.is-down {
  color: #a3283d;
}
.rh-rarity {
  padding: 0.1rem 0.55rem;
  border-radius: 999px;
  font-weight: 800;
  font-size: 0.75rem;
  background: var(--rh-gem);
  color: #fff;
  text-shadow: 0 1px 1px rgb(0 0 0 / 0.4);
  border: 1px solid rgb(0 0 0 / 0.2);
}
.rh-rarity--common {
  --rh-gem: #50699c;
}
.rh-rarity--uncommon {
  --rh-gem: #158b76;
}
.rh-rarity--rare {
  --rh-gem: #245ddd;
}
.rh-rarity--epic {
  --rh-gem: #9c2bdd;
}
.rh-rarity--legendary {
  --rh-gem: #c06402;
}
.rh-rarity--mythic {
  --rh-gem: linear-gradient(90deg, #ef3db4, #ffb32b, #46db80, #24adea, #a949ea);
}
.rh-console__sheet {
  left: var(--rh-sheet-left, clamp(0.5rem, 2.5cqi, 2rem));
}
</style>
