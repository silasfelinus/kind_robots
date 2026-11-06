<!-- The Ruler Is Hooked: the illustrated console (2026-11-05 overhaul).
     Every screen is a painting first: a full-bleed backdrop, a painted HUD
     over it, and a nav of vignette tabs below. No web-app cards or toolbars.
     Screens: Lake (first-person fishing), Map (royal atlas), Court
     (petitions + endings), Gear (tackle + kingdom works), Fishopedia, plus
     the crown menu's Chronicle and Saves. Overlays: the once-per-reign
     coronation, the Town Crier's daily proclamation, and Quill's lessons. -->
<template>
  <ClientOnly>
    <main ref="consoleEl" class="rh-console">
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
            <RulerHookedLakeScreen v-if="screen === 'lake'" @navigate="go" />
            <RulerHookedMapScreen v-else-if="screen === 'map'" @navigate="go" />
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
  currentLesson,
  lessonsRemaining,
  type ConsoleScreen,
} from '~/utils/rulerHooked/tutorial'

type Screen = ConsoleScreen | 'opening' | 'settings'

const store = useRulerHookedStore()
const quiz = useRulerHookedQuizStore()
const screen = ref<Screen>('lake')
const consoleEl = ref<HTMLElement | null>(null)

const navScreen = computed<ConsoleScreen | null>(() =>
  screen.value === 'opening' || screen.value === 'settings'
    ? null
    : (screen.value as ConsoleScreen),
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

onMounted(() => {
  quiz.initialize()
  store.init()
  screen.value = store.showOpening ? 'opening' : 'lake'
  if (!document.getElementById('rh-display-font')) {
    const link = document.createElement('link')
    link.id = 'rh-display-font'
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600..800;1,9..144,600..800&family=Alegreya:ital,wght@0,400..700;1,400..700&display=swap'
    document.head.appendChild(link)
  }
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
/* The Ruler Is Hooked: psychedelic rainbow fantasy with subtle print texture.
   Keep these legacy token names for sibling components; their values are now
   chromatic ink and spectrum, not velvet, gold leaf, or parchment. */
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
/* Sheets keep clear of the health crest, which stays open on wide consoles. */
@container rhconsole (min-width: 900px) {
  .rh-console__view {
    --rh-sheet-left: 17.25rem;
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
  background: linear-gradient(150deg, rgb(33 26 103 / 0.97), rgb(8 13 53 / 0.97));
  border: 2px solid var(--rh-gold);
  box-shadow:
    inset 0 0 0 2px rgb(244 64 185 / 0.33),
    0 8px 22px rgb(0 0 0 / 0.42);
  color: #f4faff;
}
.rh-parchment {
  padding: clamp(0.75rem, 2cqi, 1.25rem);
  border-radius: 1rem;
  background:
    linear-gradient(145deg, rgb(233 255 245 / 0.97), rgb(255 218 238 / 0.97));
  color: var(--rh-ink);
  border: 2px solid #171451;
  box-shadow:
    inset 0 0 0 3px rgb(255 255 255 / 0.5),
    0 0 0 3px rgb(40 223 207 / 0.7),
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
