<!-- /components/screen-fx/animation-interact.vue -->
<template>
  <div
    v-if="animationStore.isActive"
    class="pointer-events-none fixed inset-0 z-9999"
  >
    <div
      class="pointer-events-auto absolute left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 px-3"
      :style="controlsStyle"
    >
      <div
        class="flex items-center gap-1 rounded-2xl border border-white/20 bg-black/50 px-3 py-2 shadow-xl backdrop-blur-sm"
      >
        <button
          class="btn btn-xs btn-ghost text-white hover:bg-white/20"
          type="button"
          title="Previous effect"
          @click="animationStore.prevEffect()"
        >
          <Icon name="kind-icon:chevron-left" class="h-4 w-4" />
        </button>

        <span
          class="min-w-28 select-none text-center text-xs font-semibold text-white/90"
        >
          {{ animationStore.activeEffect?.label ?? 'Animating' }}
        </span>

        <button
          class="btn btn-xs btn-ghost text-white hover:bg-white/20"
          type="button"
          title="Next effect"
          @click="animationStore.nextEffect()"
        >
          <Icon name="kind-icon:chevron-right" class="h-4 w-4" />
        </button>

        <div class="mx-1 h-4 w-px bg-white/20" />

        <button
          class="btn btn-xs btn-ghost text-white/70 hover:bg-white/20 hover:text-white"
          type="button"
          title="Stop animation"
          @click="animationStore.stop()"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
        </button>
      </div>

      <p class="select-none text-center text-xs font-medium text-white/60">
        {{ animationStore.message }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/screen-fx/animation-interact.vue
import { computed } from 'vue'
import { useAnimationStore } from '@/stores/animationStore'

const animationStore = useAnimationStore()

const controlsStyle = computed(() => {
  return {
    top: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
  }
})
</script>
