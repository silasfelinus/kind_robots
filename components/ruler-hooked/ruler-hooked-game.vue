<!-- components/ruler-hooked/ruler-hooked-game.vue
     The kingdom-decay console (ruler-hooked/t-054). The kingdom is painted as
     its own illuminated chronicle: a vellum and gold-leaf frame around the
     composited lake, a title cartouche, HUD capsules, four kingdom meters, the
     newest petition, and a five-tab deck. The frame takes the reign's health:
     pristine, strained or rotten. Documents the court prints (the petition,
     edicts, choice cards) are hand-coloured broadsides instead. -->
<template>
  <ClientOnly>
    <main
      class="rh-console flex h-full min-h-0 w-full flex-col overflow-hidden bg-slate-950 p-1.5 sm:p-2"
      :data-tier="tier"
      :data-tab="overlay ?? tab"
    >
      <template v-if="!store.save">
        <div
          class="relative isolate min-h-0 flex-1 overflow-hidden rounded-2xl bg-slate-950"
        >
          <RulerHookedStage
            :scene="previewScene"
            :regions="store.bundle.regions"
            :fill="true"
            :labels="false"
            class="pointer-events-none absolute inset-0 h-full w-full scale-105 !rounded-none !border-0 opacity-45 blur-[1px]"
          />
          <div
            class="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/75 via-transparent to-slate-950/70"
          />
          <RulerHookedSlots class="relative z-10 h-full" @picked="onPicked" />
        </div>
      </template>

      <template v-else>
        <header-page-bar>
          <div
            class="flex min-w-0 flex-1 items-center justify-end gap-1"
            data-testid="ruler-hooked-bar"
          >
            <span
              class="mr-auto truncate text-xs font-bold opacity-75"
              :title="store.save.name"
              >{{ store.save.name }}</span
            >
            <button
              v-for="item in OVERLAYS"
              :key="item.id"
              type="button"
              class="btn btn-sm shrink-0 px-2"
              :class="overlay === item.id ? 'btn-primary' : 'btn-ghost'"
              :aria-pressed="overlay === item.id"
              @click="toggleOverlay(item.id)"
            >
              <Icon :name="item.icon" class="kr-icon-4" />
              <span class="sr-only @xl:not-sr-only">{{ item.label }}</span>
            </button>
          </div>
        </header-page-bar>

        <div ref="frameEl" class="rh-frame">
          <RulerHookedStage
            :scene="store.scene"
            :regions="store.bundle.regions"
            :fill="true"
            :labels="false"
            class="rh-backdrop !rounded-none !border-0"
          />
          <div class="rh-soot" aria-hidden="true" />
          <svg
            class="rh-flourish"
            viewBox="0 0 120 60"
            aria-hidden="true"
            focusable="false"
          >
            <path
              class="rh-vine"
              d="M2 58 C 14 40, 30 56, 40 44 S 62 30, 70 46"
            />
            <g v-if="tier !== 'rotten'" class="rh-fish">
              <path d="M30 30 C 44 14, 78 14, 92 30 C 78 46, 44 46, 30 30 Z" />
              <path d="M92 30 L114 16 L108 30 L114 44 Z" />
              <path class="rh-fish-line" d="M50 22 Q 56 30 50 38" />
              <path class="rh-fish-line" d="M62 21 Q 68 30 62 39" />
              <circle cx="40" cy="27" r="2.6" class="rh-fish-eye" />
            </g>
            <g v-else class="rh-bones">
              <path d="M34 30 H 94" />
              <path
                d="M48 30 L44 19 M48 30 L44 41 M58 30 L54 18 M58 30 L54 42 M68 30 L64 19 M68 30 L64 41 M78 30 L75 21 M78 30 L75 39"
              />
              <path d="M94 30 L112 18 M94 30 L112 42" />
              <circle cx="34" cy="30" r="7" />
              <circle cx="32" cy="28" r="1.8" class="rh-fish-eye" />
            </g>
          </svg>

          <div class="rh-grid">
            <div class="rh-title rh-panel" role="banner">
              <Icon name="kind-icon:crown" class="rh-title-crown" />
              <h1 class="rh-title-text">
                <span class="rh-rubric">T</span>he Ruler
                <span class="rh-title-small">is</span> Hooked
              </h1>
            </div>

            <div class="rh-hud" aria-label="Reign status">
              <span
                class="rh-capsule"
                :title="`Treasury ${pct('treasury')}% · ${store.coins} coins`"
              >
                <Icon name="kind-icon:coin" class="rh-capsule-icon" />
                <span class="tabular-nums">{{ store.coins }}</span>
                <span class="sr-only">coins</span>
              </span>
              <span class="rh-capsule">
                <Icon name="kind-icon:calendar" class="rh-capsule-icon" />
                Day {{ store.save.turnCount + 1 }}
              </span>
              <span class="rh-capsule" :title="timeLabel">
                <Icon :name="timeIcon" class="rh-capsule-icon" />
                <span class="rh-time-label">{{ timeLabel }}</span>
              </span>
            </div>

            <aside class="rh-meters rh-panel" aria-label="Kingdom meters">
              <div
                v-for="meter in meters"
                :key="meter.key"
                class="rh-meter"
                :data-axis="meter.key"
                :data-low="meter.value <= 30 ? 'true' : undefined"
              >
                <span class="rh-meter-roundel">
                  <Icon :name="meter.icon" class="rh-meter-icon" />
                </span>
                <span class="rh-meter-label">{{ meter.label }}</span>
                <span class="rh-meter-value tabular-nums"
                  >{{ meter.value }}%</span
                >
                <span
                  class="rh-meter-track"
                  role="meter"
                  :aria-label="meter.label"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  :aria-valuenow="meter.value"
                >
                  <span
                    class="rh-meter-fill"
                    :style="{ width: meter.value + '%' }"
                  />
                </span>
              </div>
            </aside>

            <button
              v-if="store.activeCard && tab !== 'court' && !overlay"
              type="button"
              class="rh-petition"
              data-testid="rh-petition"
              @click="openTab('court')"
            >
              <span class="rh-seal" aria-hidden="true">
                <Icon name="kind-icon:crown" class="kr-icon-4" />
              </span>
              <span class="min-w-0">
                <strong class="rh-petition-head">{{ petitionHead }}</strong>
                <span class="rh-petition-body">{{
                  store.activeCard.title
                }}</span>
              </span>
            </button>

            <template v-if="overlay === 'opening'">
              <section class="rh-main rh-wide rh-pane rh-panel kr-scroll">
                <RulerHookedOpening
                  @skip="finishOpening"
                  @done="finishOpening"
                />
              </section>
            </template>
            <template v-else-if="overlay === 'chronicle'">
              <section class="rh-main rh-wide rh-pane rh-panel kr-scroll">
                <RulerHookedReignReview :save="store.save" />
              </section>
            </template>
            <template v-else-if="overlay === 'saves'">
              <section class="rh-main rh-wide rh-pane rh-panel kr-scroll">
                <RulerHookedSlots @picked="onPicked" />
              </section>
            </template>
            <RulerHookedLake
              v-else-if="tab === 'lake'"
              ref="lakeEl"
              @court="openTab('court')"
            />
            <RulerHookedMap
              v-else-if="tab === 'map'"
              ref="mapEl"
              @fish="openTab('lake')"
            />
            <RulerHookedCourt
              v-else-if="tab === 'court'"
              @chosen="afterChoice"
              @ending="afterEnding"
              @lake="openTab('lake')"
            />
            <section
              v-else-if="tab === 'gear'"
              class="rh-main rh-wide rh-pane rh-broadside kr-scroll"
            >
              <RulerHookedShop />
            </section>
            <section
              v-else
              class="rh-main rh-wide rh-pane rh-broadside kr-scroll"
            >
              <RulerHookedFishopedia :save="store.save" open />
            </section>

            <nav class="rh-deck" aria-label="Ruler Hooked screens">
              <button
                type="button"
                class="rh-bumper"
                aria-label="Previous screen (Q)"
                @click="openTab(stepTab(tab, -1))"
              >
                L
              </button>
              <button
                v-for="item in CONSOLE_TABS"
                :key="item.id"
                type="button"
                class="rh-tab"
                :aria-current="tab === item.id && !overlay ? 'page' : undefined"
                :data-testid="`rh-tab-${item.id}`"
                @click="openTab(item.id)"
              >
                <Icon :name="item.icon" class="rh-tab-icon" />
                <span class="rh-tab-label">{{ item.label }}</span>
                <span
                  v-if="item.id === 'court' && store.activeCard"
                  class="rh-tab-dot"
                  aria-label="A petition waits"
                />
              </button>
              <button
                type="button"
                class="rh-bumper"
                aria-label="Next screen (E)"
                @click="openTab(stepTab(tab, 1))"
              >
                R
              </button>
            </nav>

            <footer class="rh-prompts" aria-hidden="true">
              <span v-for="hint in prompts" :key="hint.key" class="rh-prompt">
                <kbd class="rh-key">{{ hint.key }}</kbd>
                {{ hint.label }}
              </span>
            </footer>
          </div>
        </div>
      </template>
    </main>

    <template #fallback>
      <div class="py-12 text-center text-sm opacity-60">
        Preparing the royal lake…
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { useRulerHookedStore } from '~/stores/rulerHookedStore'
import { createRun } from '~/utils/rulerHooked/newGame'
import { resolveScene } from '~/utils/rulerHooked/compositor'
import {
  AXIS_ICON,
  AXIS_LABEL,
  CONSOLE_TABS,
  METER_AXES,
  reignTier,
  stepTab,
  type ConsoleTab,
} from '~/utils/rulerHooked/console'
import {
  isTextEntry,
  newPadMemory,
  readPad,
  type ConsoleCommand,
} from '~/utils/consoleInput'
import type { AxisKey, TimeKey } from '~/types/ruler-hooked'

type Overlay = 'opening' | 'chronicle' | 'saves'

const OVERLAYS: {
  id: Exclude<Overlay, 'opening'>
  label: string
  icon: string
}[] = [
  { id: 'chronicle', label: 'Chronicle', icon: 'kind-icon:scroll' },
  { id: 'saves', label: 'Saves', icon: 'kind-icon:save' },
]

const TIME_LABEL: Record<TimeKey, string> = {
  day: 'Day',
  golden: 'Golden hour',
  dusk: 'Dusk',
  night: 'Night',
  dawn: 'Dawn',
}

const store = useRulerHookedStore()
const tab = ref<ConsoleTab>('lake')
const overlay = ref<Overlay | null>(null)
const frameEl = ref<HTMLElement | null>(null)
const lakeEl = ref<{ press: () => void; slack: () => void } | null>(null)
const mapEl = ref<{ step: (n: number) => void; travel: () => void } | null>(
  null,
)

const previewScene = computed(() =>
  resolveScene(
    createRun(store.bundle, {
      saveId: 'preview',
      name: '',
      seed: 'preview',
      rulerName: '',
      stamp: '1970-01-01T00:00:00Z',
    }),
    store.bundle.regions,
  ),
)

const tier = computed(() =>
  store.save ? reignTier(store.save.kingdomHealth) : 'pristine',
)

function pct(key: AxisKey): number {
  return Math.round(store.save?.kingdomHealth[key] ?? 0)
}

const meters = computed(() =>
  METER_AXES.map((key) => ({
    key,
    label: AXIS_LABEL[key],
    icon: AXIS_ICON[key],
    value: pct(key),
  })),
)

const time = computed<TimeKey>(() => store.scene?.time ?? 'day')
const timeLabel = computed(() => TIME_LABEL[time.value])
const timeIcon = computed(() =>
  time.value === 'night' ? 'kind-icon:moon' : 'kind-icon:sun',
)

const petitionHead = computed(() => {
  const kind = store.activeCard?.kind
  if (kind === 'arc-step') return 'The Chronicle Turns'
  if (kind === 'finale') return 'A Reign Decides'
  return 'New Royal Petition'
})

const prompts = computed(() => {
  if (overlay.value) return [{ key: 'B', label: 'Back' }]
  const fishing = store.activeFishing
  if (tab.value === 'lake') {
    if (fishing?.stage === 'REEL')
      return [
        { key: 'A', label: 'Tap to Reel' },
        { key: 'X', label: 'Give Slack' },
      ]
    if (fishing) return [{ key: 'A', label: 'Stop the Marker' }]
    if (store.activeCard) return [{ key: 'A', label: 'Answer the Petition' }]
    return store.canFish ? [{ key: 'A', label: 'Cast a Line' }] : []
  }
  if (tab.value === 'map')
    return [
      { key: '◀▶', label: 'Region' },
      { key: 'A', label: 'Fish the Lake' },
    ]
  if (tab.value === 'court' && (store.activeCard || store.pendingEnding))
    return [
      { key: '◀▶', label: 'Choose' },
      { key: 'A', label: 'Decree' },
    ]
  return [{ key: 'A', label: 'Select' }]
})

function openTab(next: ConsoleTab) {
  overlay.value = null
  tab.value = next
}
function toggleOverlay(next: Overlay) {
  overlay.value = overlay.value === next ? null : next
}
function onPicked() {
  overlay.value = store.showOpening ? 'opening' : null
  tab.value = 'lake'
}
function finishOpening() {
  store.dismissOpening()
  overlay.value = null
}
function afterChoice() {
  if (!store.pendingEnding) tab.value = 'lake'
}
function afterEnding() {
  tab.value = 'lake'
}

function focusInFrame(step: number) {
  const root = frameEl.value
  if (!root) return
  const cards = [
    ...root.querySelectorAll<HTMLElement>('.krh-card:not([disabled])'),
  ]
  if (!cards.length) return
  const at = cards.indexOf(document.activeElement as HTMLElement)
  const next = at < 0 ? 0 : (at + step + cards.length) % cards.length
  cards[next]?.focus()
}

function run(command: ConsoleCommand | 'slack') {
  if (command === 'prevTab') return openTab(stepTab(tab.value, -1))
  if (command === 'nextTab') return openTab(stepTab(tab.value, 1))
  if (command === 'back') {
    if (overlay.value === 'opening') finishOpening()
    else overlay.value = null
    return
  }
  if (overlay.value) return
  if (tab.value === 'lake') {
    if (command === 'confirm') lakeEl.value?.press()
    if (command === 'slack') lakeEl.value?.slack()
    return
  }
  if (tab.value === 'map') {
    if (command === 'left' || command === 'up') mapEl.value?.step(-1)
    if (command === 'right' || command === 'down') mapEl.value?.step(1)
    if (command === 'confirm') mapEl.value?.travel()
    return
  }
  if (tab.value === 'court') {
    if (command === 'left') focusInFrame(-1)
    if (command === 'right') focusInFrame(1)
    if (command === 'confirm') {
      const el = document.activeElement as HTMLElement | null
      if (el?.classList.contains('krh-card')) el.click()
      else focusInFrame(0)
    }
  }
}

const KEYS: Record<string, ConsoleCommand | 'slack'> = {
  KeyQ: 'prevTab',
  KeyE: 'nextTab',
  BracketLeft: 'prevTab',
  BracketRight: 'nextTab',
  Escape: 'back',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  Space: 'confirm',
  Enter: 'confirm',
  KeyX: 'slack',
}

function onKey(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || !store.save) return
  const active = document.activeElement as HTMLElement | null
  if (isTextEntry(active)) return
  const command = KEYS[event.code]
  if (!command) return
  const onCard = !!active?.classList.contains('krh-card')
  const onControl =
    !!active &&
    active !== document.body &&
    ['BUTTON', 'A', 'SUMMARY', 'SELECT'].includes(active.tagName)
  const pointing = ['confirm', 'up', 'down', 'left', 'right'].includes(command)
  if (onControl && !onCard && pointing && tab.value !== 'map') return
  if (onControl && command === 'confirm') return
  event.preventDefault()
  run(command)
}

const pad = newPadMemory()
let padX = false
let frame = 0
function pollPads(now: number) {
  for (const gamepad of navigator.getGamepads?.() ?? []) {
    if (!gamepad) continue
    for (const command of readPad(gamepad, pad, now)) run(command)
    const x = !!gamepad.buttons[2]?.pressed
    if (x && !padX) run('slack')
    padX = x
    break
  }
  frame = requestAnimationFrame(pollPads)
}

watch(
  () => store.activeCard,
  (card) => {
    if (card && store.activeFishing === null && tab.value === 'map')
      tab.value = 'lake'
  },
)

onMounted(() => {
  store.init()
  overlay.value = store.showOpening ? 'opening' : null
  window.addEventListener('keydown', onKey)
  frame = requestAnimationFrame(pollPads)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  cancelAnimationFrame(frame)
})
</script>

<style>
.rh-console {
  --rh-vellum: #f3e8cc;
  --rh-vellum-2: #e5d3a6;
  --rh-ink: #2a1c10;
  --rh-ink-soft: #5b4732;
  --rh-gold: #d4a63b;
  --rh-gold-hi: #f7df8f;
  --rh-gold-lo: #8a6116;
  --rh-lapis: #1f3f93;
  --rh-lapis-deep: #0f1f4d;
  --rh-vermilion: #c93a1e;
  --rh-verdigris: #3a8f77;
  --rh-ochre: #c99532;
  --rh-madder: #9e2b25;
  --rh-rag: #efe3c6;
  --rh-woodcut: #1d150d;
  --rh-soot: 0;
  --rh-fox: 0;
  --rh-gilt: linear-gradient(
    135deg,
    var(--rh-gold-lo),
    var(--rh-gold-hi) 32%,
    var(--rh-gold) 52%,
    var(--rh-gold-lo) 78%,
    var(--rh-gold) 100%
  );
  --rh-chronicle:
    'Palatino Linotype', 'Book Antiqua', Palatino, 'URW Palladio L', Georgia,
    serif;
  --rh-press: 'Iowan Old Style', Baskerville, 'Times New Roman', Times, serif;
}
.rh-console[data-tier='strained'] {
  --rh-vellum: #ecdcb4;
  --rh-vellum-2: #d8c18f;
  --rh-gold: #b8913f;
  --rh-gold-hi: #dcc57f;
  --rh-gold-lo: #6c5220;
  --rh-lapis: #2c4579;
  --rh-vermilion: #a9442b;
  --rh-soot: 0.4;
  --rh-fox: 0.55;
}
.rh-console[data-tier='rotten'] {
  --rh-vellum: #d8c497;
  --rh-vellum-2: #b9a072;
  --rh-ink: #20160c;
  --rh-gold: #7d7449;
  --rh-gold-hi: #a49b6c;
  --rh-gold-lo: #3f3923;
  --rh-lapis: #2c3448;
  --rh-lapis-deep: #161a24;
  --rh-vermilion: #6f2519;
  --rh-soot: 0.85;
  --rh-fox: 1;
}

.rh-frame {
  position: relative;
  isolation: isolate;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  border-radius: 0.35rem;
  background: var(--rh-lapis-deep);
  box-shadow:
    0 0 0 2px var(--rh-gold-lo),
    0 0 0 4px var(--rh-vellum-2),
    0 0 0 5px var(--rh-gold),
    0 12px 30px #000c;
  container: rh / inline-size;
}
.rh-console[data-tier='rotten'] .rh-frame {
  clip-path: polygon(
    0 0,
    100% 0,
    100% 82%,
    99.2% 84%,
    100% 86.5%,
    98.9% 89%,
    99.6% 92%,
    97.8% 95%,
    98.6% 97.5%,
    96.5% 100%,
    0 100%
  );
}
.rh-backdrop {
  position: absolute !important;
  inset: 0;
  z-index: 0;
  height: 100%;
  transition:
    filter 0.4s ease,
    opacity 0.4s ease;
}
.rh-console:not([data-tab='lake']) .rh-backdrop {
  filter: saturate(0.7) brightness(0.55) blur(2px);
}
.rh-console[data-tier='rotten'] .rh-backdrop {
  filter: saturate(0.55) sepia(0.25) brightness(0.8);
}
.rh-console[data-tier='rotten']:not([data-tab='lake']) .rh-backdrop {
  filter: saturate(0.4) sepia(0.35) brightness(0.45) blur(2px);
}
.rh-soot {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(
      ellipse at 0% 100%,
      rgb(14 10 6 / calc(var(--rh-soot) * 0.85)),
      transparent 45%
    ),
    radial-gradient(
      ellipse at 100% 0%,
      rgb(14 10 6 / calc(var(--rh-soot) * 0.6)),
      transparent 40%
    ),
    linear-gradient(
      to bottom,
      rgb(10 14 30 / 0.35),
      transparent 22%,
      transparent 70%,
      rgb(10 8 6 / 0.55)
    );
  box-shadow:
    inset 0 0 0 1px var(--rh-gold),
    inset 0 0 0 4px rgb(0 0 0 / 0.25),
    inset 0 0 calc(2rem + var(--rh-soot) * 5rem)
      rgb(12 8 4 / calc(0.25 + var(--rh-soot) * 0.6));
}
.rh-flourish {
  position: absolute;
  z-index: 2;
  left: 0.5rem;
  bottom: 0.4rem;
  display: none;
  width: clamp(5rem, 9cqw, 8rem);
  pointer-events: none;
  overflow: visible;
  transform: scaleX(-1);
}
@container rh (min-width: 56rem) {
  .rh-flourish {
    display: block;
  }
}
.rh-vine {
  fill: none;
  stroke: var(--rh-verdigris);
  stroke-width: 2.4;
  stroke-linecap: round;
}
.rh-console[data-tier='rotten'] .rh-vine {
  stroke: var(--rh-gold-lo);
  stroke-dasharray: 6 4;
}
.rh-fish path:first-child,
.rh-fish path:nth-child(2) {
  fill: var(--rh-lapis);
  stroke: var(--rh-gold);
  stroke-width: 2;
  stroke-linejoin: round;
}
.rh-fish path:nth-child(2) {
  fill: var(--rh-vermilion);
}
.rh-fish-line {
  fill: none !important;
  stroke: var(--rh-gold-hi);
  stroke-width: 1.4;
}
.rh-fish-eye {
  fill: var(--rh-gold-hi);
}
.rh-bones {
  fill: none;
  stroke: var(--rh-gold-hi);
  stroke-width: 2;
  stroke-linecap: round;
}
.rh-bones .rh-fish-eye {
  fill: var(--rh-vermilion);
  stroke: none;
}

/* Layout: one console at every width, never an outer scroll. */
.rh-grid {
  position: relative;
  z-index: 3;
  display: grid;
  height: 100%;
  min-height: 0;
  gap: 0.4rem;
  padding: 0.45rem;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: auto auto auto minmax(3rem, 1fr) fit-content(52%) auto;
  grid-template-areas:
    'title hud'
    'meters meters'
    'petition petition'
    'main main'
    'aside aside'
    'deck deck';
  pointer-events: none;
}
.rh-grid > * {
  pointer-events: auto;
}
.rh-title {
  grid-area: title;
}
.rh-hud {
  grid-area: hud;
}
.rh-meters {
  grid-area: meters;
}
.rh-petition {
  grid-area: petition;
}
.rh-main {
  grid-area: main;
  min-height: 0;
  min-width: 0;
}
.rh-aside {
  grid-area: aside;
  min-height: 0;
  min-width: 0;
}
.rh-wide {
  grid-row: 4 / 6;
  grid-column: 1 / -1;
}
.rh-deck {
  grid-area: deck;
}
.rh-prompts {
  display: none;
}
@container rh (min-width: 56rem) {
  .rh-grid {
    gap: 0.6rem 0.9rem;
    padding: 0.8rem 0.9rem 0.6rem;
    grid-template-columns: minmax(12.5rem, 15.5rem) minmax(0, 1fr) minmax(
        15rem,
        21rem
      );
    grid-template-rows: auto auto minmax(0, 1fr) auto;
    grid-template-areas:
      'title main hud'
      'meters main petition'
      'meters main aside'
      'deck deck prompts';
  }
  .rh-meters {
    align-self: start;
  }
  .rh-wide {
    grid-row: 1 / 4;
    grid-column: 2 / 3;
  }
  .rh-console[data-tab='gear'] .rh-wide,
  .rh-console[data-tab='fishopedia'] .rh-wide,
  .rh-console[data-tab='chronicle'] .rh-wide,
  .rh-console[data-tab='saves'] .rh-wide,
  .rh-console[data-tab='opening'] .rh-wide {
    grid-row: 2 / 4;
    grid-column: 2 / 4;
  }
  .rh-deck {
    grid-column: 1 / 3;
    justify-self: center;
    width: min(100%, 46rem);
  }
  .rh-prompts {
    grid-area: prompts;
    display: flex;
  }
}
@container rh (min-width: 56rem) and (max-height: 34rem) {
  .rh-meters {
    gap: 0.2rem;
  }
}

/* Chronicle chrome: vellum, gold-leaf rules, rubrics. */
.rh-panel {
  position: relative;
  border-radius: 0.3rem;
  color: var(--rh-ink);
  font-family: var(--rh-chronicle);
  --color-base-100: color-mix(in oklab, var(--rh-vellum) 85%, white);
  --color-base-200: var(--rh-vellum-2);
  --color-base-300: color-mix(
    in oklab,
    var(--rh-gold-lo) 45%,
    var(--rh-vellum)
  );
  --color-base-content: var(--rh-ink);
  --color-primary: var(--rh-lapis);
  --color-primary-content: var(--rh-gold-hi);
  --color-secondary: var(--rh-verdigris);
  --color-accent: var(--rh-vermilion);
  --color-success: var(--rh-verdigris);
  --color-warning: #8a5a12;
  --color-error: var(--rh-vermilion);
  background:
    radial-gradient(
      circle at 16% 24%,
      rgb(122 78 28 / calc(var(--rh-fox) * 0.2)) 0 0.9rem,
      transparent 1rem
    ),
    radial-gradient(
      circle at 78% 72%,
      rgb(122 78 28 / calc(var(--rh-fox) * 0.16)) 0 0.6rem,
      transparent 0.7rem
    ),
    radial-gradient(
      circle at 58% 12%,
      rgb(122 78 28 / calc(var(--rh-fox) * 0.14)) 0 0.4rem,
      transparent 0.5rem
    ),
    radial-gradient(
      ellipse at 100% 100%,
      rgb(28 18 8 / calc(var(--rh-soot) * 0.5)),
      transparent 60%
    ),
    linear-gradient(172deg, var(--rh-vellum), var(--rh-vellum-2));
  box-shadow:
    inset 0 0 0 1px var(--rh-gold-lo),
    inset 0 0 0 3px var(--rh-vellum),
    inset 0 0 0 4px var(--rh-gold),
    inset 0 0 0 5px var(--rh-vellum),
    inset 0 0 0 6px color-mix(in oklab, var(--rh-vermilion) 70%, transparent),
    0 6px 18px #0009;
}
.rh-console[data-tier='rotten'] .rh-panel {
  clip-path: polygon(
    0 0,
    100% 0,
    100% 88%,
    97% 91%,
    98.5% 95%,
    95% 100%,
    0 100%
  );
}
.rh-pane {
  padding: 1rem 1.1rem;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.rh-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.7rem 0.4rem;
  min-width: 0;
}
.rh-title-crown {
  width: 1.1rem;
  height: 1.1rem;
  flex: none;
  color: var(--rh-gold-lo);
}
.rh-title-text {
  overflow: hidden;
  color: var(--rh-lapis);
  font-size: 1rem;
  font-variant: small-caps;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1.05;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rh-title-small {
  font-size: 0.75em;
  font-style: italic;
  color: var(--rh-ink-soft);
}
.rh-rubric {
  display: inline-block;
  margin-right: 0.04em;
  padding: 0 0.12em;
  border-radius: 0.12em;
  background: var(--rh-gilt);
  color: var(--rh-vermilion);
  font-size: 1.25em;
  line-height: 1;
  box-shadow: inset 0 0 0 1px var(--rh-gold-lo);
}
@container rh (min-width: 56rem) {
  .rh-title {
    flex-direction: column;
    gap: 0;
    padding: 0.7rem 0.8rem 0.8rem;
    text-align: center;
  }
  .rh-title-text {
    font-size: 1.55rem;
    white-space: normal;
  }
  .rh-title-crown {
    width: 1.4rem;
    height: 1.4rem;
  }
}

.rh-hud {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
  align-self: start;
}
.rh-capsule {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  min-height: 1.9rem;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background: linear-gradient(180deg, var(--rh-vellum), var(--rh-vellum-2));
  color: var(--rh-ink);
  font-family: var(--rh-chronicle);
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
  box-shadow:
    inset 0 0 0 1px var(--rh-gold-lo),
    inset 0 0 0 2.5px var(--rh-gold),
    0 3px 8px #0008;
}
.rh-capsule-icon {
  width: 1rem;
  height: 1rem;
  color: var(--rh-gold-lo);
}
@container rh (max-width: 30rem) {
  .rh-capsule {
    padding: 0.1rem 0.45rem;
    font-size: 0.72rem;
  }
  .rh-time-label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
  .rh-title-text {
    font-size: 0.82rem;
    white-space: normal;
  }
  .rh-title-crown {
    display: none;
  }
}
@container rh (min-width: 56rem) {
  .rh-capsule {
    min-height: 2.4rem;
    padding: 0.2rem 0.95rem;
    font-size: 0.95rem;
  }
  .rh-capsule-icon {
    width: 1.2rem;
    height: 1.2rem;
  }
}

.rh-meters {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.15rem 0.5rem;
  padding: 0.45rem 0.6rem 0.5rem;
}
.rh-meter {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas:
    'icon label value'
    'bar bar bar';
  align-items: center;
  gap: 0.1rem 0.3rem;
  min-width: 0;
}
.rh-meter-roundel {
  grid-area: icon;
  display: grid;
  place-items: center;
  width: 1.3rem;
  height: 1.3rem;
  border-radius: 999px;
  background: var(--rh-gilt);
  box-shadow: inset 0 0 0 1px var(--rh-gold-lo);
}
.rh-meter-icon {
  width: 0.8rem;
  height: 0.8rem;
  color: var(--meter-ink);
}
.rh-meter-label {
  grid-area: label;
  overflow: hidden;
  font-size: 0.68rem;
  font-variant: small-caps;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rh-meter-value {
  grid-area: value;
  font-size: 0.72rem;
  font-weight: 700;
}
.rh-meter[data-low='true'] .rh-meter-value {
  color: var(--rh-vermilion);
}
.rh-meter-track {
  grid-area: bar;
  position: relative;
  display: block;
  height: 0.42rem;
  overflow: hidden;
  border-radius: 999px;
  background: rgb(42 28 16 / 0.82);
  box-shadow:
    inset 0 0 0 1px var(--rh-gold-lo),
    0 1px 0 var(--rh-vellum);
}
.rh-meter-fill {
  position: absolute;
  inset: 1px auto 1px 1px;
  max-width: calc(100% - 2px);
  border-radius: 999px;
  background: linear-gradient(
    180deg,
    color-mix(in oklab, var(--meter-ink) 70%, white),
    var(--meter-ink) 60%
  );
  box-shadow: inset 0 -1px 0 rgb(0 0 0 / 0.3);
  transition: width 0.6s ease;
}
@container rh (max-width: 30rem) {
  .rh-meters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.2rem 0.8rem;
  }
}
.rh-meter[data-axis='joy'] {
  --meter-ink: var(--rh-vermilion);
}
.rh-meter[data-axis='nature'] {
  --meter-ink: var(--rh-verdigris);
}
.rh-meter[data-axis='prosperity'] {
  --meter-ink: var(--rh-ochre);
}
.rh-meter[data-axis='order'] {
  --meter-ink: var(--rh-lapis);
}
@container rh (min-width: 56rem) {
  .rh-meters {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.55rem;
    padding: 0.8rem 0.85rem 0.9rem;
  }
  .rh-meter {
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-areas:
      'icon label value'
      'icon bar bar';
    gap: 0.15rem 0.55rem;
  }
  .rh-meter-roundel {
    width: 2.3rem;
    height: 2.3rem;
  }
  .rh-meter-icon {
    width: 1.25rem;
    height: 1.25rem;
  }
  .rh-meter-label {
    font-size: 0.95rem;
  }
  .rh-meter-value {
    font-size: 0.95rem;
  }
  .rh-meter-track {
    height: 0.6rem;
  }
}

/* Broadside documents: rag paper, woodcut rules, madder/ochre/verdigris. */
.rh-broadside {
  position: relative;
  border-radius: 0.15rem;
  color: var(--rh-woodcut);
  font-family: var(--rh-press);
  background:
    repeating-linear-gradient(
      90deg,
      rgb(120 90 50 / 0.04) 0 1px,
      transparent 1px 5px
    ),
    radial-gradient(ellipse at 30% 20%, #f6ecd4, transparent 70%), var(--rh-rag);
  box-shadow:
    inset 0 0 0 3px var(--rh-woodcut),
    inset 0 0 0 5px var(--rh-rag),
    inset 0 0 0 6px var(--rh-woodcut),
    0 8px 22px #000a;
  --color-base-100: #f3e8cf;
  --color-base-200: #e8d9b6;
  --color-base-300: #b9a37a;
  --color-base-content: #1d150d;
  --color-primary: #9e2b25;
  --color-primary-content: #fbf2dc;
  --color-secondary: #3a8f77;
  --color-accent: #c99532;
  --color-neutral: #1d150d;
  --color-neutral-content: #f3e8cf;
}
.rh-broadside-head {
  color: var(--rh-madder);
  font-family: var(--rh-press);
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.rh-petition {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
  padding: 0.4rem 0.7rem 0.55rem 0.5rem;
  border: 0;
  background:
    repeating-linear-gradient(
      90deg,
      rgb(120 90 50 / 0.05) 0 1px,
      transparent 1px 5px
    ),
    var(--rh-rag);
  color: var(--rh-woodcut);
  font-family: var(--rh-press);
  text-align: left;
  cursor: pointer;
  clip-path: polygon(
    0 0,
    100% 0,
    100% 100%,
    55% 100%,
    50% 88%,
    45% 100%,
    0 100%
  );
  box-shadow:
    inset 0 0 0 2px var(--rh-woodcut),
    inset 0 4px 0 2px var(--rh-madder);
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
    0 0 0 3px var(--rh-gold-hi);
}
.rh-seal {
  display: grid;
  flex: none;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  background: radial-gradient(
    circle at 38% 35%,
    #d4554a,
    var(--rh-madder) 55%,
    #5e1712
  );
  color: #f7d9c4;
  box-shadow:
    0 0 0 2px #7a1f19,
    0 2px 4px #0008;
}
.rh-petition-head {
  display: block;
  color: var(--rh-madder);
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.rh-petition-body {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: 0.85rem;
  font-style: italic;
  font-weight: 700;
  line-height: 1.2;
}
@container rh (min-width: 56rem) {
  .rh-petition {
    padding: 0.7rem 0.9rem 1rem 0.7rem;
  }
  .rh-seal {
    width: 2.7rem;
    height: 2.7rem;
  }
  .rh-petition-head {
    font-size: 0.85rem;
  }
  .rh-petition-body {
    font-size: 1rem;
  }
}

/* The five-tab deck and the prompt footer. */
.rh-deck {
  display: flex;
  align-items: stretch;
  gap: 0.25rem;
  min-width: 0;
}
.rh-tab,
.rh-bumper {
  position: relative;
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.1rem;
  min-width: 0;
  min-height: 3rem;
  padding: 0.3rem 0.2rem;
  border: 0;
  border-radius: 0.35rem 0.35rem 0.2rem 0.2rem;
  background: linear-gradient(180deg, var(--rh-vellum), var(--rh-vellum-2));
  color: var(--rh-ink);
  font-family: var(--rh-chronicle);
  cursor: pointer;
  box-shadow:
    inset 0 0 0 1px var(--rh-gold-lo),
    inset 0 0 0 3px var(--rh-gold),
    0 4px 10px #0009;
  transition:
    transform 0.15s ease,
    background 0.2s ease;
}
.rh-bumper {
  flex: 0 0 auto;
  width: 2rem;
  font-weight: 900;
  font-size: 0.8rem;
  background: var(--rh-lapis-deep);
  color: var(--rh-gold-hi);
}
.rh-tab:hover,
.rh-tab:focus-visible,
.rh-bumper:hover,
.rh-bumper:focus-visible {
  transform: translateY(-2px);
  outline: none;
}
.rh-tab:focus-visible,
.rh-bumper:focus-visible {
  box-shadow:
    inset 0 0 0 1px var(--rh-gold-lo),
    inset 0 0 0 3px var(--rh-gold),
    0 0 0 3px var(--rh-gold-hi);
}
.rh-tab[aria-current='page'] {
  background:
    radial-gradient(
      ellipse at 50% 0%,
      color-mix(in oklab, var(--rh-gold-hi) 35%, transparent),
      transparent 65%
    ),
    linear-gradient(180deg, var(--rh-lapis), var(--rh-lapis-deep));
  color: var(--rh-gold-hi);
  transform: translateY(-3px);
}
.rh-tab-icon {
  width: 1.15rem;
  height: 1.15rem;
  flex: none;
}
.rh-tab-label {
  max-width: 100%;
  overflow: hidden;
  font-size: 0.66rem;
  font-variant: small-caps;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rh-tab-dot {
  position: absolute;
  top: 0.3rem;
  right: 0.35rem;
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 999px;
  background: var(--rh-vermilion);
  box-shadow: 0 0 0 2px var(--rh-vellum);
}
@container rh (max-width: 26rem) {
  .rh-bumper {
    display: none;
  }
}
@container rh (min-width: 56rem) {
  .rh-tab {
    flex-direction: row;
    gap: 0.5rem;
    min-height: 3.4rem;
  }
  .rh-tab-icon {
    width: 1.5rem;
    height: 1.5rem;
  }
  .rh-tab-label {
    font-size: 1.05rem;
  }
  .rh-bumper {
    width: 2.4rem;
  }
}
.rh-prompts {
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  padding: 0 0.4rem;
  color: var(--rh-vellum);
  font-family: var(--rh-chronicle);
  font-size: 0.9rem;
  font-weight: 700;
  text-shadow: 0 1px 3px #000;
}
.rh-prompt {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  white-space: nowrap;
}
.rh-key {
  display: inline-grid;
  place-items: center;
  min-width: 1.7rem;
  height: 1.7rem;
  padding: 0 0.3rem;
  border-radius: 999px;
  background: radial-gradient(
    circle at 40% 35%,
    var(--rh-lapis),
    var(--rh-lapis-deep)
  );
  color: var(--rh-gold-hi);
  font-family: var(--rh-chronicle);
  font-size: 0.8rem;
  font-weight: 900;
  box-shadow:
    0 0 0 1.5px var(--rh-gold),
    0 2px 4px #000a;
}
@media (prefers-reduced-motion: reduce) {
  .rh-tab,
  .rh-bumper,
  .rh-petition,
  .rh-meter-fill,
  .rh-backdrop {
    transition: none;
  }
}
</style>
