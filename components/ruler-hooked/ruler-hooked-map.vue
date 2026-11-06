<!-- components/ruler-hooked/ruler-hooked-map.vue
     The kingdom map (t-054): the kingdom painted as a chronicle sheet with its
     regions named where they lie, a card for the selected region (its painting
     as the reign now leaves it, what drives it, the species living there) and
     the current objective from any arc under way. Decay and tyranny pins show
     here first: each card paints the resolved scene, falling back to the art
     the reign would show without them until those paintings exist. -->
<template>
  <div class="rh-chart">
    <div class="rh-chart__sheet">
      <RulerHookedArt
        class="rh-chart__art"
        :candidates="sheetArt"
        alt=""
        eager
        position="center 55%"
      />
      <span class="rh-chart__wash" aria-hidden="true" />
      <button
        v-for="region in regions"
        :key="region.key"
        type="button"
        class="rh-chart__pin"
        :style="{ left: region.pin.x + '%', top: region.pin.y + '%' }"
        :aria-pressed="selected === region.key"
        :data-testid="`rh-region-${region.key}`"
        @click="selected = region.key"
      >
        {{ region.name }}
      </button>
      <button
        type="button"
        class="rh-chart__pin is-fog"
        :style="{ left: '80%', top: '78%' }"
        :aria-pressed="selected === UNCHARTED"
        data-testid="rh-region-uncharted"
        @click="selected = UNCHARTED"
      >
        Uncharted
      </button>
    </div>

    <aside class="rh-chart__side kr-scroll">
      <article v-if="current" class="rh-parchment rh-region">
        <RulerHookedArt
          class="rh-region__art rh-tier-art"
          :candidates="current.art"
          :alt="current.name"
          :position="`center ${current.pin.y}%`"
        />
        <div class="rh-region__copy">
          <h3 class="rh-title">{{ current.name }}</h3>
          <p class="rh-region__state">
            {{ current.label }}
            <span v-if="current.pinned" class="rh-region__pinned"
              >held by tyranny</span
            >
          </p>
          <p class="rh-region__line">{{ current.line }}</p>
          <p v-if="current.driver" class="rh-region__axis">
            <RulerHookedGlyph :name="current.driver.key" />
            {{ current.driver.label }} {{ current.driver.value }}%
          </p>
          <p v-if="current.fish.length" class="rh-region__fish">
            <strong>Key fish:</strong> {{ current.fish.join(', ') }}
          </p>
          <button
            v-if="current.key === 'lake'"
            type="button"
            class="rh-btn rh-btn--gold rh-btn--small"
            data-testid="rh-map-fish"
            @click="emit('navigate', 'lake')"
          >
            Fish here
          </button>
        </div>
      </article>

      <article v-else class="rh-parchment rh-region">
        <span class="rh-region__art rh-region__fog" aria-hidden="true" />
        <div class="rh-region__copy">
          <h3 class="rh-title">The Outer Waterways</h3>
          <p class="rh-region__state">Uncharted</p>
          <p class="rh-region__line">
            Falls, flats and a river that runs uphill on Tuesdays. Quill is
            drawing the map.
          </p>
        </div>
      </article>

      <article v-if="objective" class="rh-parchment rh-region rh-objective">
        <p class="rh-eyebrow">Current objective</p>
        <h3 class="rh-title">{{ objective.title }}</h3>
        <p v-if="objective.step" class="rh-region__line">
          {{ objective.step }}
        </p>
      </article>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { useRulerHookedStore } from '~/stores/rulerHookedStore'
import {
  art,
  lakeBackdropCandidates,
  sceneVistaCandidates,
} from '~/utils/rulerHooked/artLibrary'
import { availableFish } from '~/utils/rulerHooked/fish'
import {
  AXIS_LABEL,
  REGION_NAME,
  REGION_PIN,
  regionCopy,
} from '~/utils/rulerHooked/console'
import type { RegionKey } from '~/types/ruler-hooked'
import type { ConsoleScreen } from '~/utils/rulerHooked/tutorial'

const emit = defineEmits<{ navigate: [screen: ConsoleScreen] }>()
const store = useRulerHookedStore()

const UNCHARTED = 'uncharted'
type Pick = RegionKey | typeof UNCHARTED

const sheetArt = computed(() => [
  art('backdrops/royal-map'),
  ...lakeBackdropCandidates(store.save, store.timeOfDay, store.scene),
])

const regions = computed(() =>
  (Object.keys(REGION_PIN) as RegionKey[])
    .filter((key) => !!store.bundle.regions.regions[key])
    .map((key) => ({
      key,
      name: REGION_NAME[key] ?? key,
      pin: REGION_PIN[key]!,
    })),
)

const selected = ref<Pick>('lake')

const current = computed(() => {
  const save = store.save
  const scene = store.scene
  const region = regions.value.find((r) => r.key === selected.value)
  if (!save || !scene || !region) return null
  const def = store.bundle.regions.regions[region.key]
  const state = scene.regionStates[region.key]
  const pinned = (store.bundle.regions.pins ?? []).some(
    (pin) => scene.pins?.includes(pin.id) && pin.states[region.key] === state,
  )
  const [label, line] = regionCopy(region.key, state)
  const slider = def?.driver?.slider
  const living = availableFish(save).filter((f) =>
    f.habitats.includes(region.key),
  )
  const known = living.filter((f) => save.fishopedia[f.slug])
  const unknown = living.length - known.length
  return {
    ...region,
    label,
    line,
    pinned,
    art: sceneVistaCandidates(
      region.key,
      scene,
      store.timeOfDay,
      save.regionStates[region.key],
    ),
    driver: slider
      ? {
          key: slider,
          label: AXIS_LABEL[slider],
          value: Math.round(save.kingdomHealth[slider] ?? 0),
        }
      : null,
    fish: [
      ...known.map((f) => f.name),
      ...(unknown > 0 ? [`${unknown} unknown species`] : []),
    ],
  }
})

const objective = computed(() => {
  const save = store.save
  if (!save) return null
  for (const [arcId, state] of Object.entries(save.deckState.activeArcs)) {
    const arc = store.bundle.arcs.find((a) => a.id === arcId)
    if (!arc?.title) continue
    const step =
      arc.steps.find((card) => card.id === state.step) ?? arc.steps[0]
    return { title: arc.title, step: step?.title ?? '' }
  }
  return null
})

function step(n: number) {
  const keys: Pick[] = [...regions.value.map((r) => r.key), UNCHARTED]
  const at = Math.max(0, keys.indexOf(selected.value))
  selected.value = keys[(at + n + keys.length) % keys.length] ?? 'lake'
}

function confirm() {
  if (selected.value === 'lake') emit('navigate', 'lake')
  else selected.value = 'lake'
}

defineExpose({ step, confirm })
</script>

<style scoped>
.rh-chart {
  display: grid;
  gap: clamp(0.5rem, 1.5cqi, 1rem);
  min-height: 0;
  height: 100%;
  grid-template-rows: minmax(0, 1fr) auto;
}
@container rhconsole (min-width: 900px) {
  .rh-chart {
    grid-template-columns: minmax(0, 1fr) minmax(16rem, 30%);
    grid-template-rows: minmax(0, 1fr);
  }
}
.rh-chart__sheet {
  position: relative;
  min-height: 9rem;
  overflow: hidden;
  border-radius: 0.25rem;
  background: var(--rh-vellum-2);
  box-shadow:
    0 0 0 3px var(--rh-vellum-2),
    0 0 0 5px var(--rh-gold),
    0 0 0 6px var(--rh-gold-lo),
    0 10px 28px rgb(0 0 0 / 0.55);
}
.rh-chart__art {
  position: absolute !important;
  inset: 0;
  filter: sepia(0.3) saturate(0.85) contrast(1.05);
}
.rh-console[data-tier='rotten'] .rh-chart__art {
  filter: sepia(0.5) saturate(0.55) brightness(0.8) contrast(1.1);
}
.rh-chart__wash {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(
      ellipse at 50% 50%,
      transparent 55%,
      rgb(90 60 20 / 0.45) 100%
    ),
    radial-gradient(
      ellipse at 0% 100%,
      rgb(14 10 6 / calc(var(--rh-soot) * 0.7)),
      transparent 50%
    );
  box-shadow: inset 0 0 0 1px var(--rh-gold-lo);
}
.rh-chart__pin {
  position: absolute;
  z-index: 2;
  transform: translate(-50%, -50%);
  max-width: 44%;
  min-height: 1.9rem;
  padding: 0.15rem 0.55rem;
  border: 0;
  border-radius: 0.2rem;
  background: var(--rh-rag);
  color: var(--rh-woodcut);
  font-family: var(--rh-display);
  font-size: clamp(0.66rem, 1.6cqi, 0.95rem);
  font-style: italic;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  box-shadow:
    inset 0 0 0 1.5px var(--rh-woodcut),
    0 3px 6px rgb(0 0 0 / 0.6);
}
.rh-chart__pin.is-fog {
  background: rgb(239 227 198 / 0.7);
  font-style: normal;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.rh-chart__pin[aria-pressed='true'] {
  background: var(--rh-madder);
  color: #fbeedd;
  box-shadow:
    inset 0 0 0 1.5px #2b0b08,
    0 0 0 2px var(--rh-gold-hi),
    0 3px 8px rgb(0 0 0 / 0.7);
}
.rh-chart__pin:focus-visible {
  outline: 3px solid var(--rh-gold-hi);
  outline-offset: 2px;
}
.rh-chart__side {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.rh-region {
  display: grid;
  grid-template-columns: minmax(6rem, 38%) minmax(0, 1fr);
  gap: 0.6rem;
  padding: 0.55rem;
}
@container rhconsole (min-width: 900px) {
  .rh-region {
    grid-template-columns: 1fr;
  }
}
.rh-region__art {
  display: block;
  aspect-ratio: 7 / 4;
  border-radius: 0.3rem;
  border: 2px solid var(--rh-gold);
}
.rh-region__fog {
  background:
    radial-gradient(circle at 30% 40%, rgb(255 255 255 / 0.5), transparent 50%),
    linear-gradient(160deg, #b9b2a0, #6f7a84);
}
.rh-region__copy {
  display: grid;
  gap: 0.25rem;
  align-content: start;
  justify-items: start;
  min-width: 0;
}
.rh-region__state {
  color: var(--rh-madder);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.rh-region__pinned {
  margin-left: 0.3rem;
  padding: 0 0.35rem;
  border-radius: 0.2rem;
  background: var(--rh-woodcut);
  color: var(--rh-rag);
  letter-spacing: 0.04em;
}
.rh-region__line {
  font-size: 0.88rem;
  font-style: italic;
  line-height: 1.35;
}
.rh-region__axis,
.rh-region__fish {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.82rem;
}
.rh-region__fish {
  display: block;
}
.rh-region__axis :deep(.rh-glyph) {
  width: 1.1rem;
  height: 1.1rem;
}
.rh-objective {
  grid-template-columns: 1fr;
  gap: 0.2rem;
}
@container rhconsole (max-width: 560px) {
  .rh-region__line {
    font-size: 0.8rem;
  }
  .rh-region__fish {
    display: none;
  }
}
</style>
