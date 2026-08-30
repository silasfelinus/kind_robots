<template>
  <details class="fishopedia-shell collapse collapse-arrow kr-panel-flat">
    <summary class="collapse-title flex items-center justify-between gap-3 pr-12 font-bold">
      <span>📖 Fishopedia</span>
      <span class="badge badge-outline">{{ discoveredCount }}/{{ roster.length }} discovered</span>
    </summary>

    <div class="collapse-content">
      <p class="mb-3 text-xs opacity-60">
        Unknown species stay hidden until caught. Discovered entries remember your best specimen and why that creature could exist in this reign.
      </p>

      <div class="fishopedia-grid grid gap-3">
        <article
          v-for="fish in roster"
          :key="fish.slug"
          class="min-h-32 rounded-xl border border-base-300 bg-base-200/50 p-3"
        >
          <template v-if="entryFor(fish.slug)">
            <div class="flex flex-wrap items-center gap-2">
              <span class="badge badge-xs" :class="affinityClass(fish.affinity)">{{ fish.affinity }}</span>
              <span class="badge badge-outline badge-xs">{{ fish.rarity }}</span>
              <span class="text-xs opacity-50">×{{ entryFor(fish.slug)!.countCaught }}</span>
            </div>
            <h4 class="mt-2 font-black">{{ fish.name }}</h4>
            <p class="mt-1 text-xs opacity-75">{{ fish.fishopediaNote }}</p>
            <dl class="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <dt class="opacity-50">Best size</dt>
                <dd class="font-semibold">{{ formatSize(entryFor(fish.slug)!.bestSizeCm) }}</dd>
              </div>
              <div>
                <dt class="opacity-50">Best quality</dt>
                <dd class="font-semibold">{{ entryFor(fish.slug)!.bestQualityScore }}/100</dd>
              </div>
            </dl>
            <p class="mt-2 border-t border-base-300 pt-2 text-xs opacity-60">{{ fish.consequenceReveal }}</p>
          </template>

          <template v-else>
            <div class="flex h-full min-h-24 items-center gap-3 opacity-40">
              <div class="flex size-14 shrink-0 items-center justify-center rounded-full border border-dashed border-current text-2xl">?</div>
              <div>
                <p class="font-bold">Unknown specimen</p>
                <p class="text-xs">Its place in this version of the lake has not been discovered.</p>
              </div>
            </div>
          </template>
        </article>
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import type { FishAffinity, RunSave } from '~/types/ruler-hooked'
import { RULER_HOOKED_FISH } from '~/utils/rulerHooked/fish'

const props = defineProps<{ save: RunSave }>()
const roster = RULER_HOOKED_FISH
const discoveredCount = computed(() => Object.keys(props.save.fishopedia).length)

function entryFor(slug: string) {
  return props.save.fishopedia[slug]
}

function affinityClass(affinity: FishAffinity): string {
  return {
    GOOD: 'badge-success',
    NEUTRAL: 'badge-ghost',
    EVIL: 'badge-error',
  }[affinity]
}

function formatSize(cm: number): string {
  if (cm >= 100) return `${(cm / 100).toFixed(cm >= 1000 ? 1 : 2)} m`
  return `${cm.toFixed(1)} cm`
}
</script>

<style scoped>
.fishopedia-shell {
  container-type: inline-size;
}

.fishopedia-grid {
  grid-template-columns: minmax(0, 1fr);
}

@container (min-width: 32rem) {
  .fishopedia-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
