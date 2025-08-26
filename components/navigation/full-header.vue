<!-- /components/content/navigation/full-header.vue -->
<template>
  <header
    class="relative w-full h-full rounded-2xl bg-base-300 overflow-visible [isolation:isolate]"
  >
    <!-- Single row, no fixed heights; children scale to container -->
    <div class="flex items-stretch w-full h-full">
      <!-- Avatar (flush left, percent width) -->
      <div
        class="relative flex-none h-full w-[16%] rounded-2xl overflow-hidden"
      >
        <avatar-image
          alt="User Avatar"
          class="h-full w-full object-cover object-center"
        />
        <!-- Small readout; position is absolute but doesn’t affect layout -->
        <div
          class="absolute bottom-[2%] left-1/2 -translate-x-1/2 z-50 text-white bg-primary/90 rounded-md px-[1%] text-[0.8rem] leading-none"
        >
          {{ viewportSize }}
        </div>
      </div>

      <!-- Title: as wide as possible, fills height -->
      <div
        v-if="!bigMode"
        class="flex-1 min-w-0 h-full flex items-center justify-center"
      >
        <h1
          class="truncate font-bold tracking-tight leading-none text-[clamp(1rem,2.2vw,2rem)]"
        >
          Kind {{ page?.title || 'Robots' }}
        </h1>
      </div>

      <!-- Smart Icons: fills remaining space; 1vh top/bottom padding -->
      <div class="flex-1 min-w-0 h-full flex items-center">
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
