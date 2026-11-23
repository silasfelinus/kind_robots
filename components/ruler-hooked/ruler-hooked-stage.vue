<!-- Opaque region renders are complete vistas, never alpha layers. Show one
     inspectable region at a time rather than obscuring the kingdom under the
     last image in an opaque z-stack. The ruler remains outside the POV. -->
<template>
  <div
    class="relative w-full overflow-hidden rounded-xl border border-base-300 shadow-inner"
    :aria-label="
      'Lakeside kingdom at ' +
      (scene?.time ?? 'day') +
      ', viewing ' +
      (activeLayer?.label ?? 'the realm')
    "
  >
    <div class="relative" :class="fill ? 'h-full' : 'aspect-[7/4]'">
      <div
        class="absolute inset-0 transition-colors duration-500 ease-out motion-reduce:transition-none"
        :class="activeLayer?.classes ?? 'bg-base-300'"
      />
      <img
        v-if="activeLayer?.src"
        :key="activeLayer.ladder"
        :src="activeLayer.src"
        alt=""
        class="pointer-events-none absolute inset-0 h-full w-full object-cover"
        :style="
          focus === undefined
            ? undefined
            : { objectPosition: '50% ' + focus + '%' }
        "
        @error="onImgError(activeLayer.ladder)"
      />
      <div
        v-if="labels && activeLayer"
        class="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 to-transparent px-3 py-2 text-sm font-semibold text-white"
        aria-live="polite"
      >
        {{ activeLayer.label.replaceAll('_', ' ') }}
        <span class="ml-2 text-xs font-normal text-white/80">
          {{ scene?.time ?? 'day' }}
        </span>
      </div>
      <div
        v-if="labels && layers.length > 1"
        role="group"
        aria-label="Explore kingdom landscape regions"
        class="absolute inset-x-0 bottom-0 z-10 flex max-w-full gap-2 overflow-x-auto bg-black/65 p-2 [scrollbar-width:thin]"
      >
        <button
          v-for="layer in layers"
          :key="layer.region"
          type="button"
          class="min-h-11 shrink-0 rounded-lg border border-white/40 bg-indigo-950/80 px-3 py-2 text-xs font-semibold capitalize text-white transition-colors hover:bg-fuchsia-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 motion-reduce:transition-none"
          :class="
            activeLayer?.region === layer.region
              ? 'border-cyan-200 bg-fuchsia-700'
              : ''
          "
          :aria-pressed="activeLayer?.region === layer.region"
          :aria-label="'View ' + layer.label.replaceAll('_', ' ')"
          @click="selectedRegion = layer.region"
        >
          {{ layer.region.replaceAll('_', ' ') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { assetCandidates } from '~/utils/rulerHooked/compositor'
import type {
  RegionKey,
  RegionsManifest,
  SceneState,
} from '~/types/ruler-hooked'

const props = withDefaults(
  defineProps<{
    scene: SceneState | null
    regions: RegionsManifest
    showImages?: boolean
    /** Fill the parent's box instead of keeping the art's 7:4 aspect. */
    fill?: boolean
    /** The placeholder bands' region/state captions and the time chip. */
    labels?: boolean
    /** Vertical object-position (%) when the frame crops the art. */
    focus?: number
  }>(),
  { showImages: true, fill: false, labels: true, focus: undefined },
)

// The ruler's portrait belongs exclusively to the coronation screen. The
// environment stage MUST NOT resolve, request, or paint ruler artwork.
const errIndex = reactive<Record<string, number>>({})
function onImgError(ladder: string) {
  errIndex[ladder] = (errIndex[ladder] ?? 0) + 1
}

// A readable placeholder palette keyed by state so recompositing is visible.
const STATE_CLASS: Record<string, string> = {
  // treeline
  wild: 'bg-gradient-to-b from-green-700 to-green-900',
  tended: 'bg-gradient-to-b from-green-500 to-green-700',
  logged: 'bg-gradient-to-b from-amber-700 to-yellow-900',
  overbuilt: 'bg-gradient-to-b from-stone-500 to-stone-700',
  // far_shore
  pristine: 'bg-gradient-to-b from-emerald-500 to-teal-700',
  farmed: 'bg-gradient-to-b from-lime-500 to-green-700',
  industrial: 'bg-gradient-to-b from-slate-500 to-slate-800',
  // village_edge
  hamlet: 'bg-gradient-to-b from-orange-300 to-amber-500',
  township: 'bg-gradient-to-b from-orange-400 to-amber-600',
  boomtown: 'bg-gradient-to-b from-zinc-400 to-zinc-600',
  // castle_grounds
  humble: 'bg-gradient-to-b from-indigo-300 to-indigo-500',
  flourishing: 'bg-gradient-to-b from-violet-400 to-purple-600',
  gaudy: 'bg-gradient-to-b from-fuchsia-400 to-yellow-500',
  gallows: 'bg-gradient-to-b from-fuchsia-600 to-indigo-950',
  garrisoned: 'bg-gradient-to-b from-violet-600 to-indigo-900',
  // sky, lake and near bank decay ramps (t-054)
  open: 'bg-gradient-to-b from-sky-300 to-sky-500',
  overcast: 'bg-gradient-to-b from-violet-400 to-fuchsia-500',
  choked: 'bg-gradient-to-b from-lime-400 to-violet-800',
  clear: 'bg-gradient-to-b from-cyan-400 to-blue-600',
  murky: 'bg-gradient-to-b from-teal-400 to-lime-500',
  poisoned: 'bg-gradient-to-b from-lime-300 via-fuchsia-500 to-indigo-900',
  grassy: 'bg-gradient-to-b from-green-400 to-green-600',
  trampled: 'bg-gradient-to-b from-lime-500 to-orange-500',
  dead: 'bg-gradient-to-b from-lime-300 to-violet-700',
  fishing: 'bg-gradient-to-b from-amber-200 to-amber-400',
}

interface Layer {
  region: RegionKey
  ladder: string
  label: string
  classes: string
  src: string | null
}

const layers = computed<Layer[]>(() => {
  const scene = props.scene
  if (!scene) return []
  const regs = props.regions.regions
  return (Object.keys(regs) as RegionKey[])
    .filter((k) => !!regs[k] && k !== 'ruler')
    .sort((a, b) => (regs[a]!.z ?? 0) - (regs[b]!.z ?? 0))
    .map((region) => {
      const state = scene.regionStates[region]
      const fallback = scene.fallbackStates?.[region]
      const candidates = props.showImages
        ? [
            ...assetCandidates(region, state, scene.time),
            ...(fallback ? assetCandidates(region, fallback, scene.time) : []),
          ]
        : []
      const ladder = candidates.join('|')
      const idx = errIndex[ladder] ?? 0
      return {
        region,
        ladder,
        label: state ? `${region} · ${state}` : region,
        classes: STATE_CLASS[state ?? 'open'] ?? 'bg-base-300',
        src: candidates[idx] ?? null,
      }
    })
})

// Region paintings are opaque full-frame vistas. One active image remains
// visible; selecting a region exposes its state, including held/decayed art.
const selectedRegion = ref<RegionKey>('far_shore')
const activeLayer = computed(
  () =>
    layers.value.find((layer) => layer.region === selectedRegion.value) ??
    layers.value[0] ??
    null,
)

const VISTA_PRIORITY: RegionKey[] = [
  'far_shore',
  'treeline',
  'village_edge',
  'castle_grounds',
  'lake',
  'near_bank',
  'sky',
]

watch(
  () => props.scene?.regionStates,
  (current, previous) => {
    if (!current || !previous) return
    const changed = VISTA_PRIORITY.find(
      (region) =>
        layers.value.some((layer) => layer.region === region) &&
        current[region] !== previous[region],
    )
    if (changed) selectedRegion.value = changed
  },
)
</script>
