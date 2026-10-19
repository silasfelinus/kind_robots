<template>
  <svg
    viewBox="0 0 100 100"
    class="ecotone-emblem"
    role="img"
    :aria-label="`${name} emblem`"
  >
    <circle cx="50" cy="50" r="47" :fill="tone.bg" />
    <circle
      cx="50"
      cy="50"
      r="47"
      fill="none"
      :stroke="tone.ring"
      stroke-width="3"
    />
    <g v-if="id === 'mara'" :stroke="tone.ink" stroke-width="3" fill="none">
      <path d="M50 66 L50 34" />
      <circle cx="50" cy="30" r="5" :fill="tone.ink" />
      <path d="M50 40 Q 34 30 20 36" />
      <path d="M50 40 Q 66 30 80 36" />
      <path d="M50 48 Q 32 44 18 52" />
      <path d="M50 48 Q 68 44 82 52" />
      <path d="M50 56 Q 36 58 26 66" />
      <path d="M50 56 Q 64 58 74 66" />
      <path d="M44 70 L50 66 L56 70" />
    </g>
    <g v-else-if="id === 'kit'" :fill="tone.ink">
      <ellipse cx="34" cy="38" rx="6" ry="14" transform="rotate(-25 34 38)" />
      <ellipse cx="50" cy="28" rx="6" ry="14" />
      <ellipse cx="66" cy="38" rx="6" ry="14" transform="rotate(25 66 38)" />
      <circle
        cx="50"
        cy="66"
        r="13"
        fill="none"
        :stroke="tone.ink"
        stroke-width="5"
        stroke-dasharray="6 4"
      />
      <circle cx="50" cy="66" r="4" />
    </g>
    <g
      v-else-if="id === 'juniper'"
      :stroke="tone.ink"
      stroke-width="3"
      fill="none"
      stroke-linecap="round"
    >
      <path d="M50 80 Q 48 50 56 20" />
      <path
        v-for="leaf in leaves"
        :key="leaf"
        :d="`M${51 - leaf * 0.05} ${74 - leaf} q -14 -4 -20 -12 M${51 - leaf * 0.05} ${74 - leaf} q 14 -6 18 -14`"
      />
      <path d="M62 26 q 8 6 4 14" :stroke="tone.ring" stroke-width="4" />
    </g>
    <g
      v-else
      :stroke="tone.ink"
      stroke-width="3"
      fill="none"
      stroke-linecap="round"
    >
      <rect x="36" y="48" width="28" height="30" rx="5" :fill="tone.ink" />
      <path d="M58 48 L66 22" />
      <path d="M40 36 Q 50 26 60 36" />
      <path d="M32 30 Q 50 12 68 30" />
      <path d="M24 24 Q 50 0 76 24" opacity="0.6" />
      <circle cx="50" cy="62" r="5" :fill="tone.bg" stroke="none" />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CompanionId } from '~/utils/ecotone/content'

const props = defineProps<{ id: CompanionId; name: string }>()

const TONES: Record<CompanionId, { bg: string; ring: string; ink: string }> = {
  mara: { bg: '#1c2230', ring: '#e0b56a', ink: '#f2ead8' },
  kit: { bg: '#3a1b2a', ring: '#ff8a5c', ink: '#ffe3c9' },
  juniper: { bg: '#163225', ring: '#7dffb2', ink: '#d6f5c8' },
  cedar: { bg: '#2c2418', ring: '#9bd36a', ink: '#f0e2c2' },
}

const tone = computed(() => TONES[props.id])
const leaves = [8, 18, 28, 38, 48]
</script>
