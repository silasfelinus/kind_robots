<template>
  <section
    class="overflow-hidden rounded-2xl border border-info/40 bg-base-200/90 p-4 shadow-lg"
    aria-labelledby="fishing-encounter-title"
  >
    <div class="mb-3 flex items-center justify-between gap-3">
      <div>
        <p class="text-xs font-bold uppercase tracking-widest opacity-65">The line is alive</p>
        <h3 id="fishing-encounter-title" class="font-serif text-xl font-bold">
          {{ encounter.fishName }}
        </h3>
        <p class="text-xs opacity-65">{{ encounter.catchBehavior }}</p>
      </div>
      <span class="badge badge-primary">{{ stageLabel }}</span>
    </div>

    <div v-if="encounter.stage === 'CAST' || encounter.stage === 'HOOK'" class="space-y-3">
      <p class="text-sm">
        {{ encounter.stage === 'CAST' ? '1. Stop the moving marker to cast your line.' : '2. Stop it again to hook the fish.' }}
      </p>
      <button
        type="button"
        class="relative block h-14 w-full overflow-hidden rounded-xl border-2 border-base-content/30 bg-base-300 focus-visible:outline-2 focus-visible:outline-primary"
        :aria-label="encounter.stage === 'CAST' ? 'Stop moving marker to cast' : 'Stop moving marker to hook fish'"
        @click="emit('stop', marker)"
      >
        <span class="absolute inset-y-0 left-[28%] w-[44%] bg-success/45" aria-hidden="true" />
        <span
          class="absolute inset-y-0 w-1.5 -translate-x-1/2 bg-base-content shadow-lg"
          :style="{ left: marker + '%' }"
          aria-hidden="true"
        />
        <span class="sr-only">The center green band improves your reel start. A miss is still playable.</span>
      </button>
      <p class="text-xs opacity-70">Press the bar, Space, or Enter. The green center offers a bonus, not a required hit.</p>
    </div>

    <div v-else-if="encounter.stage === 'REEL'" class="space-y-3">
      <div class="grid grid-cols-2 gap-3">
        <label class="text-xs font-bold">
          <span class="mb-1 flex justify-between"><span>Fish landed</span><span>{{ encounter.progress }}%</span></span>
          <progress class="progress progress-success w-full" :value="encounter.progress" max="100" />
        </label>
        <label class="text-xs font-bold">
          <span class="mb-1 flex justify-between"><span>Line tension</span><span>{{ encounter.tension }}%</span></span>
          <progress class="progress progress-warning w-full" :value="encounter.tension" max="100" />
        </label>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <button type="button" class="btn btn-primary min-h-16 text-lg" @click="emit('tap')">
          🎣 Tap to reel
        </button>
        <button type="button" class="btn btn-outline min-h-16 text-lg" @click="emit('release')">
          Give slack
        </button>
      </div>
      <p class="text-xs opacity-75">Tap Reel to advance. Tap Give slack when tension reaches 65%. You can always recover.</p>
    </div>

    <p class="mt-3 rounded-lg bg-base-300/70 p-3 text-sm" role="status" aria-live="polite">
      {{ encounter.cue }}
    </p>
  </section>
</template>

<script setup lang="ts">
import type { SimpleFishingEncounter } from '~/utils/rulerHooked/simpleFishing'

const props = defineProps<{ encounter: SimpleFishingEncounter }>()
const emit = defineEmits<{
  stop: [position: number]
  tap: []
  release: []
}>()

const marker = ref(0)
const stageLabel = computed(() => ({
  CAST: '1 / 3 · Cast',
  HOOK: '2 / 3 · Hook',
  REEL: '3 / 3 · Reel',
  LANDED: 'Landed',
  ESCAPED: 'Escaped',
}[props.encounter.stage]))
let animationId: number | null = null
let start = 0
function tick(now: number) {
  if (!start) start = now
  const fraction = ((now - start) % 2400) / 1200
  marker.value = fraction <= 1 ? Math.round(fraction * 100) : Math.round((2 - fraction) * 100)
  animationId = requestAnimationFrame(tick)
}
onMounted(() => { animationId = requestAnimationFrame(tick) })
onBeforeUnmount(() => { if (animationId !== null) cancelAnimationFrame(animationId) })
</script>
