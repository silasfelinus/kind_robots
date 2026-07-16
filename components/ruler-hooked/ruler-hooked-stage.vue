<!-- components/ruler-hooked/ruler-hooked-stage.vue
     The composited play screen (compositing.md §5). Renders the region layers in
     z-order as stacked bands whose colour is driven by each region's current
     state, so choices visibly recomposite the scene even before real art lands.
     Any matching /images/ruler-hooked/{region}-{state}[-{time}].webp is overlaid
     on top via the asset fallback ladder; missing art simply shows the band. -->
<template>
  <div class="relative w-full overflow-hidden rounded-xl border border-base-300 shadow-inner"
       :aria-label="`Lakeside kingdom at ${scene?.time ?? 'day'}`">
    <div class="flex h-72 flex-col sm:h-96">
      <div
        v-for="layer in layers"
        :key="layer.region"
        class="relative flex-1 transition-colors duration-500 ease-out"
        :class="layer.classes"
      >
        <img
          v-if="layer.src"
          :src="layer.src"
          alt=""
          class="pointer-events-none absolute inset-0 h-full w-full object-cover"
          @error="onImgError(layer.region)"
        />
        <span class="absolute bottom-1 left-2 text-[10px] font-medium uppercase tracking-wide text-white/70 drop-shadow">
          {{ layer.label }}
        </span>
      </div>
    </div>
    <div class="pointer-events-none absolute right-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-xs text-white">
      {{ scene?.time ?? 'day' }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { assetCandidates } from '~/utils/rulerHooked/compositor'
import type { RegionKey, RegionsManifest, SceneState } from '~/types/ruler-hooked'

const props = defineProps<{
  scene: SceneState | null
  regions: RegionsManifest
}>()

// Per-region index into the asset fallback ladder (advances on <img> error).
const errIndex = reactive<Record<string, number>>({})
function onImgError(region: string) {
  errIndex[region] = (errIndex[region] ?? 0) + 1
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
  // single-state / cosmetic
  open: 'bg-gradient-to-b from-sky-300 to-sky-500',
  clear: 'bg-gradient-to-b from-cyan-400 to-blue-600',
  grassy: 'bg-gradient-to-b from-green-400 to-green-600',
  fishing: 'bg-gradient-to-b from-amber-200 to-amber-400',
}

interface Layer { region: RegionKey; label: string; classes: string; src: string | null }

const layers = computed<Layer[]>(() => {
  const scene = props.scene
  if (!scene) return []
  const regs = props.regions.regions
  return (Object.keys(regs) as RegionKey[])
    .filter((k) => !!regs[k])
    .sort((a, b) => (regs[a]!.z ?? 0) - (regs[b]!.z ?? 0))
    .map((region) => {
      const state = scene.regionStates[region]
      const cands = assetCandidates(region, state, scene.time)
      const idx = errIndex[region] ?? 0
      return {
        region,
        label: state ? `${region} · ${state}` : region,
        classes: STATE_CLASS[state ?? 'open'] ?? 'bg-base-300',
        src: cands[idx] ?? null,
      }
    })
})
</script>
