<!-- /components/content/icons/main-content.vue -->
<template>
  <div
    class="relative flex flex-col min-h-[100dvh] w-full rounded-2xl bg-base-300"
  >
    <!-- Mobile View -->
    <div v-if="displayStore.isMobileViewport" class="flex-1 w-full">
      <flip-panel :flipped="sidebarRightOpen">
        <template #front>
          <div class="relative h-[100dvh] w-full overflow-y-auto">
            <NuxtPage :key="$route.fullPath" class="min-h-full w-full" />
          </div>
        </template>
        <template #back>
          <div class="relative h-[100dvh] w-full overflow-y-auto">
            <splash-tutorial />
          </div>
        </template>
      </flip-panel>
    </div>

    <!-- Desktop View -->
    <div v-else class="relative flex-1 min-h-[100dvh] w-full overflow-y-auto">
      <NuxtPage :key="$route.fullPath" class="min-h-full w-full" />
    </div>

    <!-- Right Sidebar & Toggle -->
    <right-toggle
      class="fixed bottom-4 right-4 z-40"
      :class="{
        'bg-accent text-white shadow-xl': sidebarRightOpen,
        'bg-base-300 shadow': !sidebarRightOpen,
      }"
    />
    <aside
      v-if="!displayStore.isMobileViewport && sidebarRightOpen"
      class="fixed z-30 rounded-2xl border-6 border-secondary overflow-y-auto bg-base-200"
      :style="displayStore.rightSidebarStyle"
    >
      <splash-tutorial />
    </aside>
  </div>
</template>

<script setup lang="ts">
// /components/content/icons/main-content.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const sidebarRightOpen = computed(
  () =>
    displayStore.sidebarRightState !== 'hidden' &&
    displayStore.sidebarRightState !== 'disabled',
)
</script>
