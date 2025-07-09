<!-- /components/content/sandbox/sandbox-grid.vue -->
<template>
  <div
    class="relative flex flex-col"
    :style="{
      height: mainContentHeight,
      width: mainContentWidth,
      padding: '1rem', // matches p-4
    }"
  >
    <!-- Top menu -->
    <sandbox-environment class="w-full flex justify-center pt-3 pb-2 z-10" />

    <!-- Main area (sidebars + canvas) -->
    <div class="flex flex-grow overflow-hidden">
      <!-- Left sidebar -->
      <div class="w-20 flex-shrink-0 flex flex-col pt-6 overflow-y-auto z-10">
        <sandbox-persists />
      </div>

      <!-- Canvas area -->
      <div class="flex-grow relative">
        <canvas
          ref="canvasRef"
          class="w-full h-full border rounded-xl bg-base-200"
        />

        <!-- Right floating sidebar -->
        <div class="absolute top-12 right-0 w-40 h-[calc(100%-4rem)] z-20">
          <sandbox-context />
        </div>
      </div>
    </div>

    <!-- Bottom menu -->
    <div class="mt-4 w-full flex justify-center z-10">
      <sandbox-menu />
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()
const { mainContentHeight, mainContentWidth } = storeToRefs(displayStore)
</script>
