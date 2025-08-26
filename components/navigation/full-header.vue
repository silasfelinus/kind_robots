<!-- /components/content/navigation/full-header.vue -->
<template>
  <header
    class="relative w-full h-full rounded-2xl bg-base-300 overflow-visible [isolation:isolate]"
  >
    <div class="flex items-stretch w-full h-full gap-0">
      <!-- Avatar (16%) -->
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

      <!-- Title: grows but (avatar + title) maxes at 45% -->
      <div
        v-if="!bigMode"
        class="min-w-0 h-full flex items-stretch flex-[1_1_auto] max-w-[calc(45%-16%)]"
      >
        <div class="relative h-full w-full overflow-hidden">
          <h1
            class="absolute m-0 h-full flex items-center font-bold tracking-tight leading-none text-left px-[0.5%] text-[min(8vh,8vw)] whitespace-nowrap transition-transform duration-[8000ms] ease-linear group-hover:-translate-x-full"
          >
            Kind {{ page?.title || 'Robots' }}
          </h1>
        </div>
      </div>

      <!-- Smart Icons: begin exactly where title ends, take the rest -->
      <div class="flex-1 min-w-0 h-full flex items-stretch">
        <smart-icons class="h-full w-full" />
      </div>

      <!-- Smart Toggles: right column, circles -->
      <div class="flex-none h-full w-[10%]">
        <smart-toggles class="h-full w-full" />
      </div>
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
