<template>
  <!-- Full-width header; no clipping so toggles remain visible -->
  <header
    class="w-full h-full flex items-stretch gap-0 rounded-2xl bg-base-300 overflow-visible [isolation:isolate]"
  >
    <!-- Avatar / Image section: ~40% width, full height, flush top/left -->
    <div class="relative flex-none w-[40%] h-full overflow-hidden">
      <avatar-image
        alt="User Avatar"
        class="block w-full h-full object-cover object-center m-0 p-0"
      />

      <!-- Display size badge at top center -->
      <div
        class="absolute top-[2%] left-1/2 -translate-x-1/2 z-40 text-white bg-primary/90 rounded-md px-[1%] py-[0.25em] text-[clamp(0.65rem,1.1vw,0.95rem)] leading-none"
      >
        {{ viewportSize }}
      </div>

      <!-- Title inside the image (readable, no auto-scroll) -->
      <div
        v-if="!bigMode"
        class="absolute inset-y-0 left-[1%] z-40 flex items-center"
      >
        <h1
          class="m-0 text-white bg-primary/90 rounded-md px-[0.75%] py-[0.2em] font-bold tracking-tight leading-tight whitespace-normal break-words max-w-[95%] text-[clamp(1rem,6vh,3.25rem)]"
        >
          Kind {{ page?.title || 'Robots' }}
        </h1>
      </div>
    </div>

    <!-- Smart Icons: take remaining width (minus toggles) -->
    <div class="flex-1 min-w-0 h-full flex items-stretch">
      <smart-icons class="h-full w-full" />
    </div>

    <!-- Smart Toggles: natural width, circular handled in component -->
    <div class="flex-none h-full">
      <smart-toggles class="h-full w-auto" />
    </div>
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
