<!-- /components/content/art/art-grid.vue -->
<template>
  <div class="relative w-full">
    <!-- Top-left Toggle -->
    <div class="absolute top-0 left-0 z-10 p-1">
      <button
        class="btn btn-xs btn-circle"
        @click="displayStore.toggleBigMode()"
      >
        <Icon
          :name="displayStore.bigMode ? 'lucide:compress' : 'lucide:expand'"
        />
      </button>
    </div>

    <!-- Title -->
    <div class="text-center mt-6 md:mt-0">
      <slot name="title" />
    </div>

    <!-- Layout Mode Switcher (optional visual controls, md+) -->
    <div class="hidden md:flex justify-center gap-2">
      <button
        class="btn btn-sm"
        :class="layoutMode === 'single' && 'btn-primary'"
        @click="setMode('single')"
      >
        📄 Single
      </button>
      <button
        class="btn btn-sm"
        :class="layoutMode === 'two-column' && 'btn-primary'"
        @click="setMode('two-column')"
      >
        🪟 Two
      </button>
      <button
        class="btn btn-sm"
        :class="layoutMode === 'three-column' && 'btn-primary'"
        @click="setMode('three-column')"
      >
        🖼️ Three
      </button>
    </div>

    <!-- Report / Error Section -->
    <div class="text-center px-4 md:px-12 lg:px-32 space-y-2">
      <slot name="report" />
    </div>

    <!-- Main Grid -->
    <div
      class="grid gap-6"
      :class="{
        'sm:grid-cols-1': true,
        'md:grid-cols-1': layoutMode === 'single',
        'md:grid-cols-2': layoutMode === 'two-column',
        'xl:grid-cols-3': layoutMode === 'three-column',
      }"
    >
      <!-- Left Column -->
      <div v-if="layoutMode !== 'single'" class="space-y-6">
        <slot name="left" />
      </div>

      <!-- Center Column (always shown) -->
      <div class="space-y-6">
        <slot name="center" />
      </div>

      <!-- Right Column -->
      <div v-if="layoutMode === 'three-column'" class="space-y-6">
        <slot name="right" />
      </div>
    </div>

    <!-- Extra Content -->
    <slot name="extra" />
  </div>
</template>

<script setup lang="ts">
// /components/layout/art-grid.vue
import { ref } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()
const layoutMode = ref<'single' | 'two-column' | 'three-column'>('three-column')

const setMode = (mode: typeof layoutMode.value) => {
  layoutMode.value = mode
}
</script>
