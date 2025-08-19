<!-- /components/content/layout/full-header.vue -->
<template>
  <header
    class="relative bg-base-300 rounded-2xl w-full box-border overflow-visible"
  >
    <!-- Single row: Avatar • (optional) Title • spacer -->
    <div class="flex w-full items-stretch px-2" :class="rowHeight">
      <!-- Avatar -->
      <div
        class="relative flex items-center justify-center overflow-hidden rounded-2xl min-w-20 h-full"
        :class="bigMode ? 'w-[13%]' : 'w-[20%]'"
      >
        <avatar-image
          alt="User Avatar"
          class="block h-full w-full object-cover object-center rounded-2xl"
        />
        <div
          class="absolute bottom-1 left-1/2 -translate-x-1/2 z-40 text-white bg-primary rounded-md px-1 text-[10px] sm:text-xs md:text-sm"
        >
          {{ viewportSize }}
        </div>
      </div>

      <!-- Title (hidden in bigMode) -->
      <div
        v-if="!bigMode"
        class="hidden lg:flex flex-col justify-center items-center text-center w-[15%]"
      >
        <h1
          class="font-bold text-xl lg:text-2xl xl:text-3xl tracking-tight drop-shadow"
        >
          Kind {{ page?.title || 'Robots' }}
        </h1>
      </div>

      <div class="flex-grow" />
    </div>

    <!-- FLOATING LAYER (does not affect layout) -->
    <div class="absolute inset-x-0 top-full mt-2 z-[70] pointer-events-none">
      <div class="pointer-events-auto px-2 flex items-start justify-end gap-2">
        <smart-icons />
        <corner-panel v-if="showCorner" class="relative right-0" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
// /components/content/layout/full-header.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'

const displayStore = useDisplayStore()
const pageStore = usePageStore()

const page = computed(() => pageStore.page)
const viewportSize = computed(() => displayStore.viewportSize)
const bigMode = computed(() => displayStore.bigMode)

// Make the header shorter in bigMode (per your note)
// Bigger row when !bigMode so the avatar has more height to fill
const rowHeight = computed(() =>
  bigMode.value ? 'h-12 md:h-14' : 'h-16 md:h-20',
)

// Be resilient to either flag name
const showCorner = computed(() => {
  // prefer explicit showCorner if it exists, else fall back to showCounter
  // @ts-ignore - allow undefined on one of these
  return !!(displayStore.showCorner ?? displayStore.showCounter)
})
</script>
