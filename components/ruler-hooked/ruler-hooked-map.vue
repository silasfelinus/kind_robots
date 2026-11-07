<!-- components/ruler-hooked/ruler-hooked-map.vue
     The kingdom map (t-054): the kingdom painting in a bold ink frame with its
     regions named where they lie on flat label pills, a card for the selected region (its painting
     as the reign now leaves it, what drives it, the species living there) and
     the current objective from any arc under way. Decay and tyranny pins show
     here first: each card paints the resolved scene, falling back to the art
     the reign would show without them until those paintings exist. -->
<template>
  <div class="rh-chart">
    <div class="rh-chart__sheet">
      <RulerHookedArt
        class="rh-chart__art rh-tier-art"
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
  border: 3px solid var(--rh-ink);
  border-radius: 0.8rem;
  background: var(--rh-plum-deep);
  box-shadow: 5px 5px 0 var(--rh-gold);
}
.rh-chart__art {
  position: absolute !important;
  inset: 0;
}
.rh-chart__wash {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
      circle,
      rgb(16 19 61 / 0.12) 0.7px,
      transparent 1.1px
    )
    0 0 / 5px 5px;
}
.rh-chart__pin {
  position: absolute;
  z-index: 2;
  transform: translate(-50%, -50%);
  max-width: 44%;
  min-height: 1.9rem;
  padding: 0.15rem 0.6rem;
  border: 2px solid var(--rh-ink);
  border-radius: 999px;
  background: var(--rh-parch);
  color: var(--rh-ink);
  font-family: var(--rh-display);
  font-size: clamp(0.66rem, 1.6cqi, 0.95rem);
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  box-shadow: 2px 2px 0 var(--rh-plum);
}
.rh-chart__pin.is-fog {
  background: color-mix(in oklab, var(--rh-parch) 72%, transparent);
  border-style: dashed;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.rh-chart__pin[aria-pressed='true'] {
  background: var(--rh-gold-soft);
  color: var(--rh-ink);
  box-shadow:
    3px 3px 0 var(--rh-hot),
    0 0 0 3px var(--rh-hot);
}
.rh-chart__pin:focus-visible {
  outline: 3px solid var(--rh-gold-soft);
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
  border-radius: 0.5rem;
  border: 2px solid var(--rh-ink);
}
.rh-region__fog {
  background:
    radial-gradient(circle at 30% 40%, rgb(255 255 255 / 0.6), transparent 50%),
    radial-gradient(circle at 75% 70%, rgb(255 231 93 / 0.5), transparent 45%),
    linear-gradient(160deg, #9ff3ff, #c9a7ff 55%, #ffb3e6);
}
.rh-region__copy {
  display: grid;
  gap: 0.25rem;
  align-content: start;
  justify-items: start;
  min-width: 0;
}
.rh-region__state {
  color: var(--rh-pink-ink);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.rh-region__pinned {
  margin-left: 0.3rem;
  padding: 0 0.35rem;
  border-radius: 999px;
  background: var(--rh-ink);
  color: var(--rh-gold);
  letter-spacing: 0.04em;
}
.rh-region__line {
  font-size: 0.88rem;
  font-weight: 600;
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
