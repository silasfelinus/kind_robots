<!-- /components/content/icons/splash-nav.vue -->
<template>
  <div class="flex flex-col gap-4 w-full pointer-events-auto">
    <div
      v-if="parsedNavComponent && parsedNavComponent !== 'mode-row'"
      class="text-center"
    >
      <button
        class="btn btn-xs md:btn-sm btn-outline border-base-content/40 bg-accent rounded-2xl transition-all"
        @click="showNavComponent = !showNavComponent"
      >
        Toggle Navigation:
        <span class="ml-1 font-mono">
          {{ showNavComponent ? parsedNavComponent : 'Mode Row' }}
        </span>
      </button>
    </div>

    <Transition name="fade-expand">
      <div
        v-if="parsedNavComponent && showNavComponent"
        class="space-y-2 min-h-[300px] bg-base-200 border border-dashed border-accent rounded-2xl p-4"
      >
        <div class="flex justify-center w-full max-w-3xl mx-auto">
          <component :is="parsedNavComponent" class="w-full" />
        </div>
      </div>
    </Transition>

    <Transition name="fade-expand">
      <div
        v-if="!showNavComponent"
        class="space-y-2 border border-base-300 bg-base-100 rounded-2xl"
      >
        <label
          class="text-sm font-semibold text-base-content/70 text-center block"
        >
          🎮 Mode Row
        </label>
        <div class="flex justify-center">
          <mode-row class="w-full max-w-3xl" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()
const navComponent = computed(() => pageStore.page?.navComponent)
const parsedNavComponent = computed(() => {
  const raw = navComponent.value
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null
})
const showNavComponent = ref(true)
</script>
