<!-- /components/content/layout/layout-selector.vue -->
<template>
  <div class="flex flex-col items-start text-default rounded-2xl gap-1">
    <label for="layoutSelector" class="rounded-xl">Layout:</label>

    <select
      id="layoutSelector"
      v-model="selectedLayout"
      class="select select-sm select-bordered rounded-2xl text-base-content bg-base-100"
    >
      <option v-for="layout in allowedLayouts" :key="layout" :value="layout">
        {{ formatLayoutLabel(layout) }}
      </option>
    </select>

    <p class="text-xs opacity-70">Active: {{ layoutStore.resolvedLayout }}</p>
  </div>
</template>

<script setup lang="ts">
// /components/content/layout/layout-selector.vue
import { computed } from 'vue'
import {
  useLayoutStore,
  layoutKeys,
  type LayoutKey,
} from '@/stores/layoutStore'

const layoutStore = useLayoutStore()

const allowedLayouts = layoutKeys

const selectedLayout = computed<LayoutKey>({
  get: () => layoutStore.currentLayout,
  set: (value) => {
    layoutStore.setLayout(value)
  },
})

function formatLayoutLabel(layout: LayoutKey): string {
  if (layout === 'default') return 'Auto'
  if (layout === 'mobile') return 'Mobile'
  if (layout === 'tablet') return 'Tablet'
  return 'Desktop'
}
</script>
