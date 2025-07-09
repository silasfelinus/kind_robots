<!-- /components/content/sandbox/sandbox-grid.vue -->
<template>
  <div
    class="relative flex flex-col"
    :style="{
      height: mainContentHeight,
      width: mainContentWidth,
      padding: 'p-5',
    }"
  >
    <!-- Top menu -->
    <sandbox-environment class="w-full flex justify-center pt-3 pb-2 z-10" />

    <!-- Main area (sidebars + canvas) -->
    <div class="flex flex-grow overflow-hidden">
      <!-- Left sidebar -->
      <div class="w-20 flex-shrink-0 flex flex-col pt-7 overflow-y-auto z-10">
        <sandbox-persists />
      </div>

      <!-- Canvas area -->
      <div class="flex-grow relative">
        <canvas
          ref="canvasRef"
          class="w-full h-full border rounded-xl bg-base-200"
        />

        <!-- Right floating sidebar + external context icons -->
        <div class="absolute top-12 right-0 z-20 flex flex-col items-end gap-3 pr-2">
          <!-- External context icons -->
          <div class="flex flex-col gap-2 items-center">
            <sandbox-icon
              v-for="(tool, i) in store.contextTools"
              :key="i"
              :icon="tool.icon"
              :label="tool.label"
              @click="activate(tool)"
            />
          </div>

          <!-- Original context box -->
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
import { useSandboxStore } from '@/stores/sandboxStore'

const displayStore = useDisplayStore()
const { mainContentHeight, mainContentWidth } = storeToRefs(displayStore)

const store = useSandboxStore()

function activate(tool: { label: string }) {
  store.toggleContextTool?.(tool.label)
}
</script>
