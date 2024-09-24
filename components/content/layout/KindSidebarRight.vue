<template>
  <div
    v-if="displayStore.sidebarRight !== 'hidden'"
    :style="{ width: displayStore.sidebarRightVw + 'vw' }"
    class="kind-sidebar-right h-full bg-secondary text-white flex flex-col p-4 transition-all duration-500"
  >
    <h2 class="text-xl font-bold mb-4" v-if="displayStore.sidebarRight === 'open'">Right Sidebar</h2>
    
    <ul class="space-y-2">
      <li
        v-for="item in items"
        :key="item.id"
        @click="navigate(item.path)" 
        class="hover:bg-primary p-2 rounded-md cursor-pointer flex flex-col items-center transition-all duration-500"
      >
        <!-- Icon with dynamic sizing -->
        <Icon
          :name="item.icon" 
          :class="{
            'h-12 w-12': displayStore.sidebarRight === 'open',
            'h-8 w-8': displayStore.sidebarRight === 'compact',
          }"
          class="mb-2"
        />

        <!-- Only show text when sidebar is open -->
        <span
          v-if="displayStore.sidebarRight === 'open'"
          class="text-sm font-semibold"
        >
          {{ item.name }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { useRouter } from 'vue-router'

const displayStore = useDisplayStore()
const router = useRouter()

// Dummy data for sidebar items, replace with actual data as needed
const items = ref([
  { id: 1, name: 'Item 1', icon: 'home', path: '/home' },
  { id: 2, name: 'Item 2', icon: 'settings', path: '/settings' },
  { id: 3, name: 'Item 3', icon: 'user', path: '/profile' },
  { id: 4, name: 'Item 4', icon: 'help', path: '/help' },
])

// Function to handle navigation
const navigate = (path: string) => {
  router.push(path)
}
</script>

<style scoped>
.kind-sidebar-right {
  /* Ensure the sidebar takes up the full height of the viewport */
  height: 100%;
}
</style>
