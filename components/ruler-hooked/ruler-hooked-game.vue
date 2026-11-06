<!-- The Ruler Is Hooked: the illustrated console (2026-11-05 overhaul), framed
     as the kingdom's own illuminated chronicle (t-054).
     Every screen is a painting first: a full-bleed backdrop, a painted HUD
     over it, and a deck of vignette tabs below. No web-app cards or toolbars.
     Screens: Lake (first-person fishing), Map (royal atlas), Court
     (petitions + endings), Gear (tackle + kingdom works), Fishopedia, plus
     the crown menu's Chronicle and Saves. Overlays: the once-per-reign
     coronation, the Town Crier's daily proclamation, Quill's lessons and the
     newest petition's banner. The frame takes the reign's tier (console.ts
     reignTier): pristine gilt and lapis, strained and foxed, or rotten with
     tarnished gold, soot and a torn edge. -->
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
              <svg class="rh-flourish" viewBox="0 0 120 60" focusable="false">
                <path
                  class="rh-flourish__vine"
                  d="M2 58 C 14 40, 30 56, 40 44 S 62 30, 70 46"
                />
                <g v-if="tier !== 'rotten'" class="rh-flourish__fish">
                  <path
                    d="M30 30 C 44 14, 78 14, 92 30 C 78 46, 44 46, 30 30 Z"
                  />
                  <path d="M92 30 L114 16 L108 30 L114 44 Z" />
                  <path class="rh-flourish__scale" d="M50 22 Q 56 30 50 38" />
                  <path class="rh-flourish__scale" d="M62 21 Q 68 30 62 39" />
                  <circle cx="40" cy="27" r="2.6" class="rh-flourish__eye" />
                </g>
                <g v-else class="rh-flourish__bones">
                  <path d="M34 30 H 94" />
                  <path
                    d="M48 30 L44 19 M48 30 L44 41 M58 30 L54 18 M58 30 L54 42 M68 30 L64 19 M68 30 L64 41 M78 30 L75 21 M78 30 L75 39"
                  />
                  <path d="M94 30 L112 18 M94 30 L112 42" />
                  <circle cx="34" cy="30" r="7" />
                  <circle cx="32" cy="28" r="1.8" class="rh-flourish__eye" />
                </g>
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
              <span class="rh-petition__seal" aria-hidden="true">
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
/* ── The Ruler Is Hooked visual system ─────────────────────────────────────
   Psychedelic rainbow ink with a faint vintage print texture (2026-11-06).
   The kingdom's health still stains and drains its vivid colors as it fails. Unscoped so every console component shares one vocabulary;
   everything is namespaced `rh-`. The older plum/parchment names stay as
   aliases so every screen picks the palette up. */
.rh-console {
  --rh-vellum: #e9fff5;
  --rh-vellum-2: #ffdaee;
  --rh-ink: #10133d;
  --rh-ink-soft: #453379;
  --rh-gold: #2beed3;
  --rh-gold-hi: #ffe75d;
  --rh-gold-lo: #177ba9;
  --rh-lapis: #7727dd;
  --rh-lapis-deep: #080d35;
  --rh-vermilion: #ef3db4;
  --rh-verdigris: #46db80;
  --rh-ochre: #ffb32b;
  --rh-order: #9857ea;
  --rh-madder: #f43cb3;
  --rh-rag: #e9fff5;
  --rh-woodcut: #10133d;
  --rh-soot: 0;
  --rh-fox: 0;
  --rh-gilt: linear-gradient(
    135deg,
    var(--rh-gold-lo),
    var(--rh-gold-hi) 32%,
    var(--rh-gold) 52%,
    var(--rh-vermilion) 78%,
    var(--rh-gold) 100%
  );
  --rh-plum: var(--rh-lapis);
  --rh-plum-deep: var(--rh-lapis-deep);
  --rh-gold-soft: var(--rh-gold-hi);
  --rh-parch: var(--rh-vellum);
  --rh-parch-shade: var(--rh-vellum-2);
  --rh-display: 'Trebuchet MS', 'Arial Rounded MT Bold', system-ui, sans-serif;
  --rh-body: 'Trebuchet MS', system-ui, sans-serif;

  container: rhconsole / inline-size;
  position: relative;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--rh-lapis-deep);
  color: var(--rh-ink);
  font-family: var(--rh-body);
}
/* Misrule drains the saturated spectrum and stains the stage. */
.rh-console[data-tier='strained'] {
  --rh-vellum: #ddf1ea;
  --rh-vellum-2: #e9bfd8;
  --rh-gold: #1cb8b8;
  --rh-gold-hi: #f5d64e;
  --rh-gold-lo: #176a94;
  --rh-lapis: #6231b4;
  --rh-lapis-deep: #17133d;
  --rh-vermilion: #c42f8d;
  --rh-soot: 0.4;
  --rh-fox: 0.55;
}
.rh-console[data-tier='rotten'] {
  --rh-vellum: #aeaebd;
  --rh-vellum-2: #756b93;
  --rh-ink: #120d27;
  --rh-gold: #438b91;
  --rh-gold-hi: #b2ae62;
  --rh-gold-lo: #31536a;
  --rh-lapis: #36315d;
  --rh-lapis-deep: #100e22;
  --rh-vermilion: #914172;
  --rh-order: #5e3e78;
  --rh-soot: 0.85;
  --rh-fox: 1;
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
.rh-console[data-tier='rotten'] .rh-console__view {
  clip-path: polygon(
    0 0,
    100% 0,
    100% 82%,
    99.4% 84%,
    100% 86.5%,
    99.2% 89%,
    99.7% 92%,
    98.8% 95%,
    99.3% 97.5%,
    98.4% 100%,
    0 100%
  );
}
/* The reign's state on every painting: healthy is untouched, then faded. */
.rh-console[data-tier='strained'] .rh-backdrop img,
.rh-console[data-tier='strained'] .rh-tier-art img {
  filter: saturate(0.82) contrast(0.95);
}
.rh-console[data-tier='rotten'] .rh-backdrop img,
.rh-console[data-tier='rotten'] .rh-tier-art img {
  filter: saturate(0.42) hue-rotate(-8deg) brightness(0.8)
    contrast(1.06);
}

/* The chronicle frame: gold-leaf rules, soot in the corners, marginalia. */
.rh-frame {
  position: absolute;
  inset: 0;
  z-index: 25;
  pointer-events: none;
  background:
    radial-gradient(
      ellipse at 0% 100%,
      rgb(14 10 6 / calc(var(--rh-soot) * 0.75)),
      transparent 32%
    ),
    radial-gradient(
      ellipse at 100% 0%,
      rgb(14 10 6 / calc(var(--rh-soot) * 0.5)),
      transparent 28%
    );
  box-shadow:
    inset 0 0 0 2px var(--rh-gold-lo),
    inset 0 0 0 4px var(--rh-vellum-2),
    inset 0 0 0 5px var(--rh-gold),
    inset 0 0 0 6px var(--rh-gold-lo),
    inset 0 0 calc(1.5rem + var(--rh-soot) * 4rem)
      rgb(12 8 4 / calc(0.2 + var(--rh-soot) * 0.55));
}
.rh-flourish {
  position: absolute;
  left: 0.6rem;
  bottom: 0.5rem;
  display: none;
  width: clamp(5rem, 8cqi, 7.5rem);
  overflow: visible;
  transform: scaleX(-1);
  filter: drop-shadow(0 2px 3px rgb(0 0 0 / 0.6));
}
@container rhconsole (min-width: 900px) {
  .rh-flourish {
    display: block;
  }
}
.rh-flourish__vine {
  fill: none;
  stroke: var(--rh-verdigris);
  stroke-width: 2.4;
  stroke-linecap: round;
}
.rh-console[data-tier='rotten'] .rh-flourish__vine {
  stroke: var(--rh-gold-lo);
  stroke-dasharray: 6 4;
}
.rh-flourish__fish path:first-child,
.rh-flourish__fish path:nth-child(2) {
  fill: var(--rh-lapis);
  stroke: var(--rh-gold);
  stroke-width: 2;
  stroke-linejoin: round;
}
.rh-flourish__fish path:nth-child(2) {
  fill: var(--rh-vermilion);
}
.rh-flourish__scale {
  fill: none !important;
  stroke: var(--rh-gold-hi);
  stroke-width: 1.4;
}
.rh-flourish__eye {
  fill: var(--rh-gold-hi);
}
.rh-flourish__bones {
  fill: none;
  stroke: var(--rh-gold-hi);
  stroke-width: 2;
  stroke-linecap: round;
}
.rh-flourish__bones .rh-flourish__eye {
  fill: var(--rh-vermilion);
  stroke: none;
}

/* The newest petition, hung top-right as a broadside pennant with a seal. */
.rh-petition {
  position: absolute;
  z-index: 29;
  top: clamp(3.4rem, 8cqi, 4.1rem);
  right: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  width: min(19rem, calc(100% - 1rem));
  padding: 0.5rem 0.8rem 0.95rem 0.55rem;
  border: 0;
  background:
    repeating-linear-gradient(
      90deg,
      rgb(120 90 50 / 0.05) 0 1px,
      transparent 1px 5px
    ),
    radial-gradient(
      ellipse at 100% 100%,
      rgb(28 18 8 / calc(var(--rh-soot) * 0.45)),
      transparent 60%
    ),
    var(--rh-rag);
  color: var(--rh-woodcut);
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
  box-shadow:
    inset 0 0 0 2px var(--rh-woodcut),
    inset 0 4px 0 2px var(--rh-madder);
  filter: drop-shadow(0 6px 10px rgb(0 0 0 / 0.5));
  transition: transform 0.15s ease;
}
.rh-petition:hover,
.rh-petition:focus-visible {
  transform: translateY(1px) rotate(-0.4deg);
  outline: none;
}
.rh-petition:focus-visible {
  box-shadow:
    inset 0 0 0 2px var(--rh-woodcut),
    inset 0 4px 0 2px var(--rh-madder),
    inset 0 0 0 5px var(--rh-gold-hi);
}
.rh-petition__seal {
  display: grid;
  flex: none;
  place-items: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 999px;
  background: radial-gradient(
    circle at 38% 35%,
    #d4554a,
    var(--rh-madder) 55%,
    #5e1712
  );
  box-shadow:
    0 0 0 2px #7a1f19,
    0 2px 4px rgb(0 0 0 / 0.5);
}
.rh-petition__seal .rh-glyph {
  width: 1.3rem;
  height: 1.3rem;
}
.rh-petition__copy {
  min-width: 0;
}
.rh-petition__head {
  display: block;
  color: var(--rh-madder);
  font-size: 0.95rem;
  font-weight: 900;
  line-height: 1.1;
}
.rh-petition__body {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-family: var(--rh-body);
  font-size: 0.88rem;
  font-style: italic;
  font-weight: 700;
  line-height: 1.2;
}
@container rhconsole (max-width: 899px) {
  .rh-petition {
    top: 3rem;
    width: min(15rem, calc(100% - 1rem));
    padding: 0.35rem 0.6rem 0.75rem 0.4rem;
  }
  .rh-petition__seal {
    width: 1.8rem;
    height: 1.8rem;
  }
  .rh-petition__head {
    font-size: 0.8rem;
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

/* Broadside documents: rag paper, woodcut rules, madder/ochre/verdigris. */
.rh-broadside {
  position: relative;
  border-radius: 0.15rem;
  color: var(--rh-woodcut);
  font-family: var(--rh-body);
  background:
    repeating-linear-gradient(
      90deg,
      rgb(120 90 50 / 0.04) 0 1px,
      transparent 1px 5px
    ),
    radial-gradient(
      circle at 84% 18%,
      rgb(122 78 28 / calc(var(--rh-fox) * 0.18)),
      transparent 1.65rem
    ),
    radial-gradient(ellipse at 30% 20%, #f6ecd4, transparent 70%), var(--rh-rag);
  box-shadow:
    inset 0 0 0 3px var(--rh-woodcut),
    inset 0 0 0 5px var(--rh-rag),
    inset 0 0 0 6px var(--rh-woodcut),
    0 8px 22px rgb(0 0 0 / 0.6);
}
.rh-broadside-head {
  color: var(--rh-madder);
  font-family: var(--rh-display);
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
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
  border-radius: 0.4rem;
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0.06), transparent 35%),
    linear-gradient(180deg, var(--rh-lapis), var(--rh-lapis-deep));
  border: 1.5px solid var(--rh-gold);
  box-shadow:
    0 0 0 3px color-mix(in oklab, var(--rh-lapis-deep) 60%, transparent),
    0 10px 24px rgb(0 0 0 / 0.4);
  color: #fbeed3;
}
.rh-parchment {
  padding: clamp(0.75rem, 2cqi, 1.25rem);
  border-radius: 0.4rem;
  background:
    radial-gradient(
      circle at 14% 22%,
      rgb(122 78 28 / calc(var(--rh-fox) * 0.18)),
      transparent 1.65rem
    ),
    radial-gradient(
      circle at 82% 76%,
      rgb(122 78 28 / calc(var(--rh-fox) * 0.14)),
      transparent 1.2rem
    ),
    radial-gradient(
      ellipse at 100% 100%,
      rgb(28 18 8 / calc(var(--rh-soot) * 0.4)),
      transparent 60%
    ),
    radial-gradient(
      130% 90% at 50% 0%,
      rgb(255 251 240 / 0.85),
      transparent 65%
    ),
    linear-gradient(180deg, var(--rh-parch), var(--rh-parch-shade));
  color: var(--rh-ink);
  border: 2px solid var(--rh-gold);
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 0.5),
    inset 0 0 0 4px var(--rh-vellum),
    inset 0 0 0 5px color-mix(in oklab, var(--rh-vermilion) 55%, transparent),
    inset 0 0 40px rgb(150 100 40 / 0.18),
    0 0 0 3px color-mix(in oklab, var(--rh-lapis-deep) 70%, transparent),
    0 14px 30px rgb(0 0 0 / 0.42);
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
  background: linear-gradient(180deg, #fffaf0, #ead7ad);
  color: var(--rh-ink);
  border: 1.5px solid rgb(58 38 22 / 0.45);
  box-shadow: 0 2px 0 rgb(58 38 22 / 0.35);
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
  background: linear-gradient(180deg, #f6cd5c, #c48a24);
  border-color: #6a3a12;
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
  color: #8a1f2e;
}
.rh-input {
  min-height: 3rem;
  width: 100%;
  min-width: 0;
  padding: 0.3rem 0.85rem;
  border-radius: 0.7rem;
  background: #fffaf0;
  border: 1.5px solid rgb(58 38 22 / 0.4);
  box-shadow: inset 0 2px 4px rgb(58 38 22 / 0.15);
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
  border: 1px solid rgb(58 38 22 / 0.2);
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
  --rh-gem: #9c927a;
}
.rh-rarity--uncommon {
  --rh-gem: #4f9a6a;
}
.rh-rarity--rare {
  --rh-gem: #3f7fc4;
}
.rh-rarity--epic {
  --rh-gem: #8a4fc4;
}
.rh-rarity--legendary {
  --rh-gem: #d18a1e;
}
.rh-rarity--mythic {
  --rh-gem: linear-gradient(90deg, #e2566e, #d18a1e, #4f9a6a, #3f7fc4, #8a4fc4);
}
.rh-console__sheet {
  left: var(--rh-sheet-left, clamp(0.5rem, 2.5cqi, 2rem));
}
</style>
