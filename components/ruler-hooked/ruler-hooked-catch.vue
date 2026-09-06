<template>
  <section class="rounded-2xl border border-base-300 bg-base-200/70 p-4 shadow-sm">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div class="flex flex-wrap items-center gap-2">
          <span v-if="catchResult.newDiscovery" class="kr-badge-primary-sm">NEW SPECIES</span>
          <span class="badge badge-sm" :class="affinityClass">{{ catchResult.affinity }}</span>
          <span class="kr-badge-outline-sm">{{ catchResult.rarity }}</span>
        </div>
        <h3 class="mt-2 text-xl font-black">{{ catchResult.name }}</h3>
        <p class="mt-1 text-sm opacity-75">{{ catchResult.catchBehavior }}</p>
      </div>
      <div class="text-right">
        <p class="text-lg font-bold">{{ formatSize(catchResult.sizeCm) }}</p>
        <p class="text-xs uppercase tracking-wide opacity-60">{{ catchResult.quality }} · {{ catchResult.qualityScore }}/100</p>
      </div>
    </div>

    <div class="mt-3 rounded-xl bg-base-100/70 p-3 text-sm">
      <p class="font-semibold">Fishopedia</p>
      <p class="mt-1 opacity-80">{{ catchResult.fishopediaNote }}</p>
      <p v-if="catchResult.newDiscovery" class="mt-2 text-xs opacity-65">{{ catchResult.consequenceReveal }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CatchResult } from '~/types/ruler-hooked'

const props = defineProps<{ catchResult: CatchResult }>()

const affinityClass = computed(() => ({
  GOOD: 'badge-success',
  NEUTRAL: 'badge-ghost',
  EVIL: 'badge-error',
}[props.catchResult.affinity]))

function formatSize(cm: number): string {
  if (cm >= 100) return `${(cm / 100).toFixed(cm >= 1000 ? 1 : 2)} m`
  return `${cm.toFixed(1)} cm`
}
</script>
