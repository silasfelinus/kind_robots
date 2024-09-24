<template>
  <div
    v-if="displayStore.sidebarRight !== 'hidden'"
    :class="{
      'w-1/5': displayStore.sidebarRight === 'open',
      'w-2': displayStore.sidebarRight === 'compact',
    }"
    class="kind-sidebar-right h-full bg-secondary text-white flex flex-col p-4 transition-all duration-500"
  >
    <h2 class="text-xl font-bold mb-4">Right Sidebar</h2>
    <ul class="space-y-2">
      <li v-for="item in items" :key="item.id" class="hover:bg-primary p-2 rounded-md cursor-pointer">
        {{ item.name }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Dummy data for sidebar items, replace with actual data as needed
const items = ref([
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
  { id: 3, name: 'Item 3' },
  { id: 4, name: 'Item 4' },
])
</script>

<style scoped>
.kind-sidebar-right {
  /* Ensure the sidebar takes up the full height of the viewport */
  height: 100%;
  background-color: var(--tw-bg-secondary);
  color: var(--tw-text-white);
}
</style>
