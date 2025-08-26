<template>
  <!-- Outer fills parent; inner is centered and shrinks to content -->
  <div class="w-full h-full flex">
    <header
      class="mx-auto inline-flex max-w-full w-fit h-full items-stretch gap-x-[0.5%] rounded-2xl bg-base-300 overflow-hidden [isolation:isolate]"
    >
      <!-- Avatar / Image area: takes all remaining space (title lives inside here) -->
      <div class="relative flex-auto min-w-0 h-full overflow-hidden">
        <avatar-image
          alt="User Avatar"
          class="h-full w-full object-cover object-center"
        />

        <!-- Display size badge (moved to top, centered) -->
        <div
          class="absolute top-[2%] left-1/2 -translate-x-1/2 z-50 text-white bg-primary/90 rounded-md px-[1%] py-[0.25em] text-[clamp(0.6rem,1.2vw,0.9rem)] leading-none"
        >
          {{ viewportSize }}
        </div>

        <!-- Title badge (inside image, larger, same color scheme as display size) -->
        <div
          v-if="!bigMode"
          class="absolute inset-y-0 left-[1%] z-40 flex items-center"
        >
          <div class="max-w-full overflow-hidden group">
            <h1
              class="m-0 inline-flex items-center text-white bg-primary/90 rounded-md px-[0.75%] py-[0.15em] font-bold tracking-tight leading-none whitespace-nowrap text-[min(8vh,8vw)] transition-transform duration-[8000ms] ease-linear group-hover:-translate-x-[30%]"
              title="Kind {{ page?.title || 'Robots' }}"
            >
              Kind {{ page?.title || 'Robots' }}
            </h1>
          </div>
        </div>
      </div>

      <!-- Smart Icons: natural content width -->
      <div class="flex-none h-full">
        <smart-icons class="h-full w-auto max-w-full" />
      </div>

      <!-- Smart Toggles: natural content width (circles handled in component) -->
      <div class="flex-none h-full">
        <smart-toggles class="h-full w-auto" />
      </div>
    </header>
  </div>
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
