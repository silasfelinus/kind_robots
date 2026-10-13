<template>
  <div
    class="ticker relative flex items-center overflow-hidden rounded-xl border-2 border-stone-800 bg-stone-900 text-amber-100"
    role="marquee"
    aria-label="PAL announcements"
  >
    <span
      class="z-10 shrink-0 bg-amber-300 px-3 py-1.5 font-mono text-[11px] font-black uppercase tracking-[.2em] text-stone-900"
      >PAL</span
    >
    <div class="ticker-window min-w-0 flex-1 overflow-hidden">
      <p
        :key="trackKey"
        class="ticker-track whitespace-nowrap py-1.5 font-mono text-xs"
        :style="{ animationDuration: `${duration}s` }"
      >
        <span v-for="(line, i) in doubled" :key="i" class="px-6"
          >{{ line }} <span class="opacity-40">✦</span></span
        >
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ lines: string[] }>()

const shown = computed(() => props.lines.slice(0, 8))
const doubled = computed(() => [...shown.value, ...shown.value])
const trackKey = computed(() => shown.value.join('|'))
const duration = computed(() =>
  Math.max(30, Math.round(shown.value.join(' ').length / 6)),
)
</script>

<style scoped>
.ticker-track {
  display: inline-block;
  animation: ticker-scroll linear infinite;
}

@keyframes ticker-scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ticker-track {
    animation: none;
    white-space: normal;
  }
}
</style>
