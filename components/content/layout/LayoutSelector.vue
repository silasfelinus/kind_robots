<template>
  <div class="flex flex-col items-start text-default rounded-2xl">
    <label
      for="layoutSelector"
      class="mr-2 rounded-xl"
    >Layout:</label>
    <select
      id="layoutSelector"
      v-model="selectedLayout"
      class="text-black"
    >
      <option
        v-for="layout in allowedLayouts"
        :key="layout"
        :value="layout"
        class="text-black"
      >
        {{ layout }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useLayoutStore, allowedLayouts } from '@/stores/layoutStore'

const layoutStore = useLayoutStore()

const selectedLayout = computed({
  get: () => layoutStore.currentLayout,
  set: (value) => {
    if (allowedLayouts.includes(value)) {
      layoutStore.setLayout(value) // No need for isUserAction, as it's always true in this context
    }
  },
})
</script>
