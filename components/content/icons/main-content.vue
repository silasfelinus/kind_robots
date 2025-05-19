<!-- /components/content/icons/main-content.vue -->
<template>
  <div class="relative h-full w-full rounded-2xl overflow-hidden bg-base-300">
    <!-- Mobile View: Flip between page and splash -->
    <div v-if="displayStore.isMobileViewport" class="h-full w-full">
      <flip-panel :flipped="sidebarRightOpen">
        <template #front>
          <div class="absolute inset-0">
            <NuxtPage :key="$route.fullPath" class="min-h-[100vh] w-full" />
          </div>
        </template>

        <template #back>
          <splash-tutorial />
        </template>
      </flip-panel>
    </div>

    <!-- Desktop View: Always show both -->
    <div v-else class="h-full w-full" key="desktop">
      <div class="h-full w-full overflow-y-auto">
        <NuxtPage :key="$route.fullPath" class="min-h-full w-full" />
      </div>
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
      class="fixed z-30 rounded-2xl border-6 border-secondary"
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
