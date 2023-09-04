<template>
  <div class="flex items-center">
    <label for="layoutSelector" class="mr-2">Choose Layout:</label>
    <select id="layoutSelector" v-model="selectedLayout" @change="changeLayout">
      <option v-for="layout in allowedLayouts" :key="layout" :value="layout">
        {{ layout }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useLayoutStore, allowedLayouts } from '@/stores/layoutStore'

const layoutStore = useLayoutStore()
const selectedLayout = ref(layoutStore.currentLayout)

// Function to enable custom layout
function enableCustomLayout(layout: string) {
  layoutStore.setLayout(layout)
}

definePageMeta({
  layout: false
})

const changeLayout = () => {
  if (allowedLayouts.includes(selectedLayout.value)) {
    layoutStore.setLayout(selectedLayout.value)
    enableCustomLayout(selectedLayout.value)
    console.log(`Layout changed to: ${selectedLayout.value}`) // Debug line
  }
}
</script>
