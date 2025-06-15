<!-- /components/content/art/art-grid.vue -->
<template>
  <div class="relative w-full h-[calc(100vh-4rem)] overflow-hidden">
    <!-- Fullscreen Toggle -->
    <div class="absolute top-0 left-0 z-10 p-1">
      <button
        class="btn btn-xs btn-circle"
        @click="displayStore.toggleFullscreen()"
      >
        <Icon
          :name="
            displayStore.isFullScreen
              ? 'kind-icon:compress'
              : 'kind-icon:expand'
          "
        />
      </button>
    </div>

    <!-- Title -->
    <div class="text-center mt-6 md:mt-0">
      <slot name="title" />
    </div>

    <!-- Layout Switcher -->
    <div class="hidden md:flex justify-center gap-2 mt-2">
      <button
        class="btn btn-sm"
        :class="layoutMode === 'single' && 'btn-primary'"
        @click="layoutMode = 'single'"
      >
        📄 Single
      </button>
      <button
        class="btn btn-sm"
        :class="layoutMode === 'two-column' && 'btn-primary'"
        @click="layoutMode = 'two-column'"
      >
        🪟 Two
      </button>
      <button
        class="btn btn-sm hidden lg:inline"
        :class="layoutMode === 'three-column' && 'btn-primary'"
        @click="layoutMode = 'three-column'"
      >
        🖼️ Three
      </button>
    </div>

    <!-- Report Section -->
    <div class="text-center px-4 md:px-12 lg:px-32 space-y-2">
      <slot name="report" />
    </div>

    <!-- Main Layout -->
    <div
      v-if="layoutMode === 'three-column'"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full w-full overflow-hidden"
    >
      <div class="flex flex-col h-full min-h-0 max-w-full overflow-hidden">
        <div class="flex-1 overflow-y-auto px-2 space-y-6">
          <slot name="left" />
        </div>
      </div>
      <div class="flex flex-col h-full min-h-0 max-w-full overflow-hidden">
        <div class="flex-1 overflow-y-auto px-2 space-y-6">
          <slot name="center" />
        </div>
      </div>
      <div class="flex flex-col h-full min-h-0 max-w-full overflow-hidden">
        <div class="flex-1 overflow-y-auto px-2 space-y-6">
          <slot name="right" />
        </div>
      </div>
    </div>

    <div v-else class="flex flex-col h-full min-h-0 max-w-full overflow-hidden">
      <div class="flex-1 overflow-y-auto px-2 space-y-6">
        <div
          class="grid gap-4 w-full"
          :class="{
            'grid-cols-1': layoutMode === 'single',
            'grid-cols-1 md:grid-cols-2': layoutMode === 'two-column',
          }"
        >
          <slot name="left" v-if="layoutMode !== 'single'" />
          <slot name="center" />
          <slot name="right" v-if="layoutMode === 'two-column'" />
        </div>
      </div>
    </div>

    <!-- Mobile fallback -->
    <div class="h-full w-full flex items-center justify-center xl:hidden">
      <div class="h-full w-[60%] overflow-y-auto px-2 space-y-4">
        <slot name="extra" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/art/art-grid.vue
import { ref } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()
const layoutMode = ref<'single' | 'two-column' | 'three-column'>('three-column')
</script>
