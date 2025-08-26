<template>
  <!-- Full-width header; no clipping so toggles remain visible -->
  <header
    class="w-full h-full flex items-stretch gap-0 rounded-2xl bg-base-300 overflow-visible [isolation:isolate]"
  >
    <!-- Avatar / Image section: fixed 40% width, full height, flush -->
    <div class="relative flex-none w-[40%] h-full overflow-hidden shrink-0">
      <avatar-image
        alt="User Avatar"
        class="block w-full h-full object-cover object-center m-0 p-0"
      />

      <!-- Display size badge at top center -->
      <div
        class="absolute top-[2%] left-1/2 -translate-x-1/2 z-40
               text-white bg-primary/90 rounded-md px-1 py-[0.25em]
               text-[clamp(0.65rem,1.1vw,0.95rem)] leading-none"
      >
        {{ viewportSize }}
      </div>

      <!-- Title inside image:
           - 'Kind' on tight background chip
           - remainder shows over image (no bg), wraps to use full width -->
      <div
        v-if="!bigMode"
        class="absolute inset-y-0 left-[1%] right-[2%] z-40 flex items-center"
      >
        <h1
          class="m-0 flex flex-wrap items-baseline gap-[0.35ch]
                 font-bold tracking-tight leading-tight
                 text-[clamp(0.9rem,5.2vh,2.75rem)]"
        >
          <!-- Background stops at 'Kind' -->
          <span
            class="text-white bg-primary/90 rounded-md px-1 py-[0.125em] whitespace-nowrap"
          >
            Kind
          </span>

          <!-- Rest of the title: no background, image visible behind; wraps fully -->
          <span
            class="text-white break-words pr-[0.25rem]
                   drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]"
          >
            {{ page?.title || 'Robots' }}
          </span>
        </h1>
      </div>
    </div>

    <!-- Smart Icons: take remaining width -->
    <div class="flex-1 min-w-0 h-full flex items-stretch">
      <smart-icons class="h-full w-full" />
    </div>

    <!-- Smart Toggles: natural width -->
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
