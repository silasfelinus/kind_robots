<template>
  <!-- Outer fills parent; inner only as wide as needed and centered -->
  <div class="w-full h-full flex">
    <header
      class="mx-auto w-fit max-w-full inline-flex items-stretch h-full gap-x-[0.5%] rounded-2xl bg-base-300 overflow-hidden [isolation:isolate]"
    >
      <!-- Avatar -->
      <div class="relative flex-none h-full aspect-square overflow-hidden">
        <avatar-image
          alt="User Avatar"
          class="h-full w-full object-cover object-center"
        />
        <div
          class="absolute bottom-[2%] left-1/2 -translate-x-1/2 z-50 text-white bg-primary/90 rounded-md px-[6%] text-[0.7rem] leading-none"
        >
          {{ viewportSize }}
        </div>
      </div>

      <!-- Title: grows but (avatar + title) capped to 45% of container; no extra padding -->
      <div
        v-if="!bigMode"
        class="min-w-0 h-full flex items-stretch flex-none max-w-[calc(45%-16%)]"
      >
        <div class="relative h-full w-full overflow-hidden group">
          <h1
            class="absolute m-0 h-full flex items-center font-bold tracking-tight leading-none text-left px-[0.25%] text-[min(8vh,8vw)] whitespace-nowrap transition-transform duration-[8000ms] ease-linear group-hover:-translate-x-full"
          >
            Kind {{ page?.title || 'Robots' }}
          </h1>
        </div>
      </div>

      <!-- Smart Icons: starts right after title; takes needed width only -->
      <div class="flex-none h-full">
        <smart-icons class="h-full w-auto max-w-full" />
      </div>

      <!-- Smart Toggles: right column, circles -->
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
