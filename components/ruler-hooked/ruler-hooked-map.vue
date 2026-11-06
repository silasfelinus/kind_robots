<!-- components/ruler-hooked/ruler-hooked-map.vue
     The Map tab of the console (t-054): the kingdom drawn as a chronicle sheet
     from the same composited layers as the lake, its regions named where they
     lie, a card for the selected region (its current state, what drives it,
     the species living there) and the current objective from any arc under
     way. Only regions, states, habitats and arcs that exist are shown. -->
<template>
  <div class="contents">
    <section class="rh-main rh-map" aria-label="Kingdom map">
      <div class="rh-map-sheet">
        <RulerHookedStage
          :scene="store.scene"
          :regions="store.bundle.regions"
          :fill="true"
          :labels="false"
          class="rh-map-art !rounded-none !border-0"
        />
        <button
          v-for="region in regions"
          :key="region.key"
          type="button"
          class="rh-map-pin"
          :style="{ left: region.pin.x + '%', top: region.pin.y + '%' }"
          :aria-pressed="selected === region.key"
          :data-testid="`rh-region-${region.key}`"
          @click="selected = region.key"
        >
          {{ region.name }}
        </button>
      </div>
    </section>

    <section
      class="rh-aside flex flex-col gap-2 overflow-y-auto overscroll-contain kr-scroll"
    >
      <article v-if="current" class="rh-panel rh-region">
        <h2 class="rh-region-name">{{ current.name }}</h2>
        <div class="rh-region-art">
          <img
            v-if="regionArt"
            :key="regionArt"
            :src="regionArt"
            alt=""
            :style="{ objectPosition: `50% ${current.pin.y}%` }"
            @error="artMiss += 1"
          />
        </div>
        <p class="rh-region-state">
          <strong class="capitalize">{{ current.state }}</strong>
          <template v-if="current.pinned"> · held by tyranny</template>
          <template v-else-if="current.driver">
            · {{ current.driver.label }} {{ current.driver.value }}%
          </template>
        </p>
        <p v-if="current.fish.length" class="rh-region-line">
          <Icon name="kind-icon:fish" class="rh-region-icon" />
          <span>
            <strong>Key fish:</strong>
            {{ current.fish.join(', ') }}
          </span>
        </p>
        <button
          type="button"
          class="rh-region-go"
          data-testid="rh-map-fish"
          @click="emit('fish')"
        >
          <kbd class="rh-key">A</kbd> Fish the lake
        </button>
      </article>

      <article v-if="objective" class="rh-panel rh-region">
        <p class="rh-region-eyebrow">Current objective</p>
        <h3 class="rh-region-objective">{{ objective.title }}</h3>
        <p v-if="objective.step" class="rh-region-line">
          <Icon name="kind-icon:scroll" class="rh-region-icon" />
          <span>{{ objective.step }}</span>
        </p>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useRulerHookedStore } from '~/stores/rulerHookedStore'
import { assetCandidates } from '~/utils/rulerHooked/compositor'
import { availableFish } from '~/utils/rulerHooked/fish'
import {
  AXIS_LABEL,
  REGION_NAME,
  REGION_PIN,
} from '~/utils/rulerHooked/console'
import type { RegionKey } from '~/types/ruler-hooked'

const emit = defineEmits<{ fish: [] }>()
const store = useRulerHookedStore()

const regions = computed(() =>
  (Object.keys(REGION_PIN) as RegionKey[])
    .filter((key) => !!store.bundle.regions.regions[key])
    .map((key) => ({
      key,
      name: REGION_NAME[key] ?? key,
      pin: REGION_PIN[key]!,
    })),
)

const selected = ref<RegionKey>('lake')
const artMiss = ref(0)
watch(selected, () => {
  artMiss.value = 0
})

const current = computed(() => {
  const save = store.save
  const scene = store.scene
  const region = regions.value.find((r) => r.key === selected.value)
  if (!save || !scene || !region) return null
  const def = store.bundle.regions.regions[region.key]
  const state = scene.regionStates[region.key] ?? ''
  const pinned = (store.bundle.regions.pins ?? []).some(
    (pin) => scene.pins?.includes(pin.id) && pin.states[region.key] === state,
  )
  const slider = def?.driver?.slider
  const living = availableFish(save).filter((f) =>
    f.habitats.includes(region.key),
  )
  const known = living.filter((f) => save.fishopedia[f.slug])
  const unknown = living.length - known.length
  return {
    ...region,
    state: state.replace(/_/g, ' '),
    rawState: state,
    pinned,
    driver: slider
      ? {
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

const regionArt = computed(() => {
  const scene = store.scene
  const region = current.value
  if (!scene || !region) return null
  const fallback = scene.fallbackStates?.[region.key]
  const ladder = [
    ...assetCandidates(region.key, region.rawState, scene.time),
    ...(fallback ? assetCandidates(region.key, fallback, scene.time) : []),
  ]
  return ladder[artMiss.value] ?? null
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
  const keys = regions.value.map((r) => r.key)
  const at = Math.max(0, keys.indexOf(selected.value))
  selected.value = keys[(at + n + keys.length) % keys.length] ?? 'lake'
}

defineExpose({ step, travel: () => emit('fish') })
</script>

<style scoped>
.rh-map {
  container-type: size;
  display: flex;
  align-items: center;
  justify-content: center;
}
.rh-map-sheet {
  position: relative;
  width: 100%;
  max-height: 100%;
  aspect-ratio: 7 / 4;
  overflow: hidden;
  border-radius: 0.2rem;
  background: var(--rh-vellum);
  box-shadow:
    0 0 0 3px var(--rh-vellum-2),
    0 0 0 5px var(--rh-gold),
    0 0 0 6px var(--rh-gold-lo),
    0 10px 28px #000c;
}
.rh-map-sheet {
  width: min(100%, calc(100cqh * 7 / 4));
}
.rh-map-art {
  position: absolute !important;
  inset: 0;
  height: 100%;
  filter: sepia(0.28) saturate(0.85) contrast(1.05);
}
.rh-map-sheet::after {
  content: '';
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
.rh-map-pin {
  position: absolute;
  z-index: 2;
  transform: translate(-50%, -50%);
  max-width: 40%;
  padding: 0.15rem 0.55rem;
  border: 0;
  border-radius: 0.2rem;
  background: var(--rh-rag);
  color: var(--rh-woodcut);
  font-family: var(--rh-press);
  font-size: clamp(0.62rem, 1.6cqw, 0.95rem);
  font-style: italic;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;
  box-shadow:
    inset 0 0 0 1.5px var(--rh-woodcut),
    0 3px 6px #0009;
}
.rh-map-pin[aria-pressed='true'] {
  background: var(--rh-madder);
  color: #fbeedd;
  box-shadow:
    inset 0 0 0 1.5px #2b0b08,
    0 0 0 2px var(--rh-gold-hi),
    0 3px 8px #000b;
}
.rh-map-pin:focus-visible {
  outline: 3px solid var(--rh-gold-hi);
  outline-offset: 2px;
}
.rh-region {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.75rem 0.85rem 0.85rem;
}
.rh-region-name {
  color: var(--rh-lapis);
  font-size: 1.2rem;
  font-variant: small-caps;
  font-weight: 700;
  text-align: center;
}
.rh-region-art {
  aspect-ratio: 16 / 7;
  overflow: hidden;
  border-radius: 0.2rem;
  background:
    repeating-linear-gradient(
      135deg,
      rgb(90 60 20 / 0.08) 0 2px,
      transparent 2px 8px
    ),
    var(--rh-vellum-2);
  box-shadow: inset 0 0 0 2px var(--rh-gold);
}
.rh-region-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.rh-region-state {
  font-size: 0.9rem;
}
.rh-region-line {
  display: flex;
  gap: 0.4rem;
  font-size: 0.82rem;
  line-height: 1.3;
}
.rh-region-icon {
  width: 1rem;
  height: 1rem;
  flex: none;
  margin-top: 0.1rem;
  color: var(--rh-gold-lo);
}
.rh-region-eyebrow {
  align-self: center;
  padding: 0.05rem 0.6rem;
  border-radius: 0.2rem;
  background: var(--rh-lapis);
  color: var(--rh-gold-hi);
  font-size: 0.75rem;
  font-variant: small-caps;
  font-weight: 700;
  letter-spacing: 0.06em;
}
.rh-region-objective {
  color: var(--rh-ink);
  font-size: 1.05rem;
  font-weight: 700;
  text-align: center;
}
.rh-region-go {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 2.6rem;
  border: 0;
  border-radius: 0.3rem;
  background: linear-gradient(180deg, var(--rh-lapis), var(--rh-lapis-deep));
  color: var(--rh-gold-hi);
  font-family: var(--rh-chronicle);
  font-weight: 700;
  cursor: pointer;
  box-shadow:
    inset 0 0 0 1px var(--rh-gold-hi),
    inset 0 0 0 3px var(--rh-gold);
}
.rh-region-go:focus-visible {
  outline: 3px solid var(--rh-gold-hi);
  outline-offset: 2px;
}
</style>
