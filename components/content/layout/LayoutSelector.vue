<template>
  <div class="flex flex-col items-start text-default">
    <label for="layoutSelector" class="mr-2">Choose Layout:</label>
    <select id="layoutSelector" v-model="selectedLayout" class="text-black" @change="changeLayout">
      <option v-for="layout in allowedLayouts" :key="layout" :value="layout" class="text-black">
        {{ layout }}
      </option>
    </select>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useLayoutStore, allowedLayouts } from '@/stores/layoutStore'

const layoutStore = useLayoutStore()
layoutStore.initialize() // Call initialize action here

const selectedLayout = computed({
  get: () => layoutStore.currentLayout,
  set: (value) => {
    if (allowedLayouts.includes(value)) {
      layoutStore.setLayout(value, true) // Ensure isUserAction is true
    }
  }
})

const localStorageLayout = ref('') // Ref to store the layout from localStorage

onMounted(() => {
  localStorageLayout.value = localStorage.getItem('currentLayout') || 'Not Set'
})

const changeLayout = () => {
  localStorageLayout.value = localStorage.getItem('currentLayout') || 'Not Set' // Update the localStorage layout after change
}
</script>
