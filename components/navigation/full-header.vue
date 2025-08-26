<!-- /components/content/navigation/full-header.vue -->
<template>
  <header
    class="relative w-full h-full rounded-2xl bg-base-300 overflow-visible [isolation:isolate]"
  >
    <div class="flex items-stretch w-full h-full">
      <!-- Avatar (flush, fills its slot) -->
      <div
        class="relative flex-none h-full w-[16%] rounded-2xl overflow-hidden"
      >
        <avatar-image
          alt="User Avatar"
          class="h-full w-full object-cover object-center"
        />
        <div
          class="absolute bottom-[2%] left-1/2 -translate-x-1/2 z-50 text-white bg-primary/90 rounded-md px-[1%] text-[0.8rem] leading-none"
        >
          {{ viewportSize }}
        </div>
      </div>

      <!-- Title: prefers width; scales with width/height; minimal inline padding -->
      <div
        v-if="!bigMode"
        class="flex-[2_1_0%] min-w-0 h-full flex items-center"
      >
        <h1
          class="w-full truncate font-bold tracking-tight leading-none px-[1%] text-left [font-size:clamp(1rem,6vw,4rem)]"
        >
          Kind {{ page?.title || 'Robots' }}
        </h1>
      </div>

      <!-- Smart Icons: share remaining space -->
      <div class="flex-[1_1_0%] min-w-0 h-full flex items-center">
        <smart-icons class="h-full w-full" />
      </div>
    </div>

    <!-- Right overlay toggles (don’t affect layout) -->
    <smart-toggles />
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'
const displayStore = useDisplayStore()
const pageStore = usePageStore()
const page = computed(() => pageStore.page)
const viewportSize = computed(() => displayStore.viewportSize)
const bigMode = computed(() => displayStore.bigMode)
</script>
