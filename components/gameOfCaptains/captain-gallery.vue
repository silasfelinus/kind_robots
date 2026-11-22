<template>
  <div
    class="scg"
    :class="{ 'scg-reduced': reducedMotion, 'scg-large': largeText }"
    data-testid="space-couch-captain-gallery"
  >
    <div
      ref="galleryEl"
      class="scg-gallery"
      role="radiogroup"
      aria-label="Choose your captain"
      @keydown="onKey"
      @scroll.passive="onScroll"
    >
      <button
        v-for="captain in CAPTAINS"
        :key="captain.id"
        :ref="(el) => setCard(captain.id, el)"
        type="button"
        role="radio"
        class="scg-card"
        :class="{ chosen: captain.id === modelValue }"
        :aria-checked="captain.id === modelValue"
        :tabindex="captain.id === modelValue ? 0 : -1"
        :data-captain="captain.id"
        :data-testid="
          captain.id === modelValue
            ? 'space-couch-captain-hero'
            : 'space-couch-captain-card-' + captain.id
        "
        @click="choose(captain.id)"
      >
        <img
          class="scg-card-art"
          :src="painting(captain.id)"
          :alt="
            captain.name + ', ' + captain.epithet + ', full-length portrait'
          "
          loading="eager"
          decoding="async"
          @error="onArtError($event, captain.id)"
        />
        <span class="scg-spine" aria-hidden="true">{{
          captain.name.replace('Captain ', '')
        }}</span>
        <span class="scg-plate">
          <small>CAPTAIN</small>
          <strong>{{ captain.name.replace('Captain ', '') }}</strong>
          <em>{{ captain.epithet }}</em>
        </span>
      </button>
    </div>

    <section
      class="scg-dossier"
      :class="'scg-on-' + tab"
      aria-live="polite"
      :aria-label="active.name + ' dossier'"
    >
      <header class="scg-dossier-head">
        <div>
          <small>{{ active.epithet }}</small>
          <h2>{{ active.name }}</h2>
        </div>
        <button
          type="button"
          class="scg-tab"
          data-testid="space-couch-captain-dossier-tab"
          @click="cycleTab"
        >
          {{
            tab === 'stats'
              ? 'STORY ▸'
              : tab === 'history'
                ? 'ORDERS ▸'
                : 'STATS ▸'
          }}
        </button>
      </header>
      <blockquote class="scg-doctrine">“{{ active.doctrine }}”</blockquote>
      <div
        class="scg-stats"
        data-testid="space-couch-captain-stats"
        aria-label="Captain statistics"
      >
        <div
          v-for="skill in SKILLS"
          :key="skill"
          :class="{ peak: stats[skill] === peak }"
        >
          <small>{{ skill.toUpperCase() }}</small>
          <span class="scg-pips" aria-hidden="true"
            ><i v-for="n in 5" :key="n" :class="{ on: n <= stats[skill] }"
          /></span>
          <strong>{{ stats[skill] }}</strong>
        </div>
      </div>
      <div class="scg-copy">
        <template v-if="tab === 'stats'">
          <p class="scg-hook">{{ dossier.hook }}</p>
          <p>
            <b>Advantage:</b> {{ active.ability }}. <b>Price:</b>
            {{ active.cost }}
          </p>
        </template>
        <section
          v-else-if="tab === 'history'"
          class="scg-promise"
          data-testid="couch-captain-promise"
        >
          <p class="scg-hook">{{ dossier.hook }}</p>
          <p>{{ dossier.history }}</p>
          <p>{{ dossier.oddity }}</p>
          <p><b>Your kind of trouble:</b> {{ dossier.storyPromise }}</p>
          <p class="scg-muted">{{ dossier.crewSpark }}</p>
        </section>
        <template v-else>
          <p><b>First order:</b> {{ dossier.opening }}</p>
          <p><b>Unresolved liability:</b> {{ dossier.liability }}</p>
        </template>
      </div>
    </section>

    <button
      class="cap-primary scg-next"
      type="button"
      data-testid="captains-choose-crew"
      @click="emit('next')"
    >
      COMMAND THE COUCH AS
      {{ active.name.replace('Captain ', '').toUpperCase() }}
      <span>➜</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { CAPTAINS, type CaptainId } from '~/utils/gameOfCaptains/rules'
import { CAPTAIN_DOSSIERS } from '~/utils/gameOfCaptains/characterDossiers'
import { CAPTAIN_STATS, SKILLS } from '~/utils/gameOfCaptains/crewAssignments'
import { captainSelectionPainting } from '~/utils/gameOfCaptains/captainSelectionArt'

const props = defineProps<{
  modelValue: CaptainId
  /** The older square portrait, used if a selection painting fails to load. */
  fallbackPortrait: (id: CaptainId) => string | null
  fallbackImage: string
  largeText?: boolean
  reducedMotion?: boolean
}>()
const emit = defineEmits<{
  'update:modelValue': [id: CaptainId]
  next: []
}>()

const tab = ref<'stats' | 'history' | 'orders'>('stats')
const galleryEl = ref<HTMLElement | null>(null)
const cards = new Map<CaptainId, HTMLElement>()
const failed = ref<Record<string, number>>({})

const active = computed(
  () => CAPTAINS.find((c) => c.id === props.modelValue) ?? CAPTAINS[0]!,
)
const dossier = computed(() => CAPTAIN_DOSSIERS[active.value.id])
const stats = computed(() => CAPTAIN_STATS[active.value.id])
const peak = computed(() => Math.max(...Object.values(stats.value)))

function setCard(id: CaptainId, el: Element | ComponentPublicInstance | null) {
  if (el instanceof HTMLElement) cards.set(id, el)
  else cards.delete(id)
}

function painting(id: CaptainId): string {
  const tries = failed.value[id] ?? 0
  if (tries === 0) return captainSelectionPainting(id)
  if (tries === 1) return props.fallbackPortrait(id) || props.fallbackImage
  return props.fallbackImage
}

function onArtError(event: Event, id: CaptainId) {
  const tries = failed.value[id] ?? 0
  if (tries >= 2) return
  failed.value = { ...failed.value, [id]: tries + 1 }
  const image = event.target as HTMLImageElement
  const next = painting(id)
  if (image.getAttribute('src') !== next) image.src = next
}

function choose(id: CaptainId) {
  if (id !== props.modelValue) emit('update:modelValue', id)
}

function cycleTab() {
  tab.value =
    tab.value === 'stats'
      ? 'history'
      : tab.value === 'history'
        ? 'orders'
        : 'stats'
}

function onKey(event: KeyboardEvent) {
  const order = CAPTAINS.map((c) => c.id)
  const at = order.indexOf(props.modelValue)
  let next = at
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = at + 1
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = at - 1
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = order.length - 1
  else return
  event.preventDefault()
  const id = order[(next + order.length) % order.length]!
  choose(id)
  void nextTick(() => cards.get(id)?.focus())
}

// On a phone the gallery is a swipeable carousel: keep the chosen card in
// view, so a tap or arrow key never leaves the selection off screen.
function reveal(id: CaptainId, smooth: boolean) {
  const card = cards.get(id)
  const gallery = galleryEl.value
  if (!card || !gallery || gallery.scrollWidth <= gallery.clientWidth + 4)
    return
  gallery.scrollTo({
    left: card.offsetLeft - (gallery.clientWidth - card.clientWidth) / 2,
    behavior: smooth && !props.reducedMotion ? 'smooth' : 'auto',
  })
}
watch(
  () => props.modelValue,
  (id) => {
    tab.value = 'stats'
    void nextTick(() => reveal(id, true))
  },
)
onMounted(() => reveal(props.modelValue, false))

// Swiping the carousel chooses whichever painting settles in the middle.
let settle: ReturnType<typeof setTimeout> | null = null
function onScroll() {
  if (settle) clearTimeout(settle)
  settle = setTimeout(() => {
    const gallery = galleryEl.value
    if (!gallery || gallery.scrollWidth <= gallery.clientWidth + 4) return
    const middle = gallery.scrollLeft + gallery.clientWidth / 2
    let best: CaptainId | null = null
    let distance = Infinity
    for (const [id, card] of cards) {
      const gap = Math.abs(card.offsetLeft + card.clientWidth / 2 - middle)
      if (gap < distance) {
        distance = gap
        best = id
      }
    }
    if (best) choose(best)
  }, 140)
}
onBeforeUnmount(() => {
  if (settle) clearTimeout(settle)
})
</script>

<style scoped>
.scg {
  --scg-gold: #f2c893;
  --scg-ink: #0b1224;
  display: grid;
  width: 100%;
  height: 100%;
  min-height: 0;
  grid-template-columns: minmax(0, 1fr) minmax(16rem, 0.42fr);
  grid-template-rows: minmax(0, 1fr) auto;
  gap: clamp(0.5rem, 1.2cqi, 1rem);
}

/* The lineup: six full-length paintings. The chosen captain stands at full
   width; the others narrow to painted spines you can still recognise. */
.scg-gallery {
  display: flex;
  min-width: 0;
  min-height: 0;
  gap: clamp(0.3rem, 0.7cqi, 0.6rem);
}
.scg-card {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  padding: 0;
  border: 1px solid #91bbc366;
  border-radius: 0.9rem;
  background: var(--scg-ink);
  cursor: pointer;
  transition:
    flex-grow 420ms cubic-bezier(0.2, 0.8, 0.2, 1),
    border-color 200ms ease,
    box-shadow 200ms ease,
    filter 200ms ease;
  filter: saturate(0.75) brightness(0.78);
}
.scg-card:hover,
.scg-card:focus-visible {
  filter: saturate(1) brightness(0.95);
  border-color: #f2c89399;
}
.scg-card:focus-visible {
  outline: 3px solid var(--scg-gold);
  outline-offset: 2px;
}
.scg-card.chosen {
  flex-grow: 4.2;
  filter: none;
  border: 2px solid var(--scg-gold);
  box-shadow:
    0 0 0 1px #000a,
    0 18px 50px -12px #f2a35a66;
}
.scg-card-art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 22%;
}
.scg-spine {
  position: absolute;
  left: 50%;
  bottom: 0.9rem;
  transform: translateX(-50%) rotate(180deg);
  writing-mode: vertical-rl;
  padding: 0.6rem 0.3rem;
  border-radius: 999px;
  background: #0b1224cc;
  color: #ffe2bc;
  font:
    800 clamp(0.7rem, 1.1cqi, 0.95rem) / 1 ui-sans-serif,
    system-ui,
    sans-serif;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  transition: opacity 200ms ease;
}
.scg-plate {
  position: absolute;
  inset: auto 0 0;
  display: grid;
  gap: 0.15rem;
  padding: 2.6rem clamp(0.8rem, 1.6cqi, 1.3rem) clamp(0.7rem, 1.4cqi, 1.1rem);
  text-align: left;
  background: linear-gradient(to top, #070b18f2 30%, #070b1800);
  opacity: 0;
  transform: translateY(0.6rem);
  transition:
    opacity 260ms ease 120ms,
    transform 260ms ease 120ms;
  pointer-events: none;
}
.scg-plate small {
  color: var(--scg-gold);
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.22em;
}
.scg-plate strong {
  color: #fff4e4;
  font:
    700 clamp(1.6rem, 3.4cqi, 2.8rem) / 1 Georgia,
    'Times New Roman',
    serif;
  text-shadow: 0 2px 12px #000;
}
.scg-plate em {
  color: #bfe4e8;
  font-size: clamp(0.8rem, 1.2cqi, 1rem);
  font-style: normal;
}
.scg-card.chosen .scg-plate {
  opacity: 1;
  transform: none;
}
.scg-card.chosen .scg-spine {
  opacity: 0;
}

/* The dossier reads beside the painting, never on top of it. */
.scg-dossier {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  gap: clamp(0.4rem, 1cqh, 0.8rem);
  overflow: hidden;
  padding: clamp(0.7rem, 1.4cqi, 1.1rem);
  border: 1px solid #91bbc399;
  border-radius: 0.9rem;
  background: linear-gradient(160deg, #1f384fe8, #172238ee);
}
.scg-dossier-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.6rem;
}
.scg-dossier-head small {
  color: #bcdbdf;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.scg-dossier-head h2 {
  margin: 0.1rem 0 0;
  color: #ffe2bc;
  font:
    700 clamp(1.2rem, 2.1cqi, 1.8rem) / 1.05 Georgia,
    serif;
}
.scg-tab {
  flex: none;
  padding: 0.45rem 0.55rem;
  border: 1px solid #d8b887;
  border-radius: 0.35rem;
  color: #ffe2b7;
  font-size: 0.68rem;
  font-weight: 900;
  white-space: nowrap;
}
.scg-tab:hover,
.scg-tab:focus-visible {
  background: #36556a;
}
.scg-doctrine {
  margin: 0;
  padding-left: 0.7rem;
  border-left: 3px solid var(--scg-gold);
  color: #fff1dc;
  font:
    italic 600 clamp(0.88rem, 1.3cqi, 1.08rem) / 1.35 Georgia,
    serif;
}
.scg-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.35rem;
}
.scg-stats > div {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  align-items: center;
  gap: 0.15rem 0.4rem;
  padding: 0.35rem 0.5rem;
  border: 1px solid #ffffff1f;
  border-radius: 0.45rem;
  background: #0b122466;
}
.scg-stats > div.peak {
  border-color: #f2c89399;
}
.scg-stats small {
  color: #bcdbdf;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}
.scg-stats strong {
  grid-row: 1 / span 2;
  grid-column: 2;
  color: #ffe2bc;
  font-size: 1.15rem;
}
.scg-pips {
  display: flex;
  gap: 0.18rem;
}
.scg-pips i {
  width: 0.7rem;
  height: 0.28rem;
  border-radius: 1px;
  background: #ffffff26;
}
.scg-pips i.on {
  background: linear-gradient(90deg, #e6524f, #f2c893);
}
.scg-copy {
  min-height: 0;
  overflow-y: auto;
  padding-right: 0.2rem;
  color: #d9ecef;
  font-size: clamp(0.76rem, 1cqi, 0.9rem);
  line-height: 1.45;
}
.scg-copy p {
  margin: 0 0 0.45rem;
}
.scg-copy b {
  color: #ffe2bc;
}
.scg-hook {
  color: #fff1dc;
  font-weight: 700;
}
.scg-muted {
  opacity: 0.8;
}
.scg-next {
  grid-column: 1 / -1;
}
.scg-large .scg-copy {
  font-size: clamp(0.9rem, 1.2cqi, 1.05rem);
}
.scg-reduced .scg-card,
.scg-reduced .scg-plate {
  transition: none;
}
@media (prefers-reduced-motion: reduce) {
  .scg-card,
  .scg-plate {
    transition: none;
  }
}

/* Tablet portrait: paintings across the top, dossier underneath. */
@media (max-width: 900px) {
  .scg {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) auto auto;
  }
  .scg-dossier {
    max-height: 40cqh;
  }
  .scg-dossier .scg-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* Phone: a swipeable carousel of full paintings, one captain at a time. */
@media (max-width: 650px) {
  .scg {
    grid-template-rows: minmax(0, 1fr) auto auto;
    gap: 0.5rem;
  }
  .scg-gallery {
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    padding: 0 14%;
    gap: 0.6rem;
  }
  .scg-gallery::-webkit-scrollbar {
    display: none;
  }
  .scg-card,
  .scg-card.chosen {
    flex: 0 0 72%;
    scroll-snap-align: center;
  }
  .scg-card .scg-plate {
    opacity: 1;
    transform: none;
    padding-top: 2rem;
  }
  .scg-spine {
    display: none;
  }
  .scg-plate strong {
    font-size: 1.6rem;
  }
  .scg-dossier {
    position: relative;
    max-height: 36cqh;
    padding: 0.6rem;
    gap: 0.35rem;
  }
  /* The painting's plate already names the captain on a phone. */
  .scg-dossier-head {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
  }
  .scg-dossier-head > div {
    display: none;
  }
  .scg-doctrine {
    margin-right: 5.2rem;
    font-size: 0.86rem;
  }
  .scg-on-stats .scg-copy {
    display: none;
  }
  .scg-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.25rem;
  }
  .scg-stats > div {
    padding: 0.25rem 0.35rem;
  }
  .scg-pips {
    display: none;
  }
  .scg-stats strong {
    font-size: 0.95rem;
  }
}
</style>
