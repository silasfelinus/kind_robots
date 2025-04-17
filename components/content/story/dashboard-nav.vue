<!-- /components/content/story/dashboard-nav.vue -->
<template>
  <div class="w-full flex flex-col items-center">
    <div class="flex justify-center flex-wrap gap-2 md:gap-3 lg:gap-4 w-full mb-3">
      <button
        v-for="tab in tabs"
        :key="tab.name"
        class="flex-1 min-w-[45%] max-w-[30%] md:min-w-[25%] lg:min-w-[15%] px-3 py-2 text-sm md:text-md lg:text-lg font-semibold border border-accent rounded-lg transition-all duration-300"
        :class="[
          tab.name === selected ? 'bg-primary text-black' : 'bg-secondary hover:bg-accent text-black',
        ]"
        @click="selectTab(tab.name)"
      >
        {{ tab.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDisplayStore } from '~/stores/displayStore'

const displayStore = useDisplayStore()

const tabs = [
  { name: 'user-dashboard', label: 'User Dashboard' },
  { name: 'navigation-trimmed', label: 'Site Navigation' },
  { name: 'user-gallery', label: 'User Gallery' },
  { name: 'jellybean-counter', label: 'Jellybean Counter' },
  { name: 'user-chat', label: 'User Chat' },
]

const selected = ref<string>('user-dashboard')

const selectTab = (tabName: string) => {
  selected.value = tabName
  displayStore.setMainComponent(tabName)
}

onMounted(() => {
  displayStore.setMainComponent(selected.value)
})
</script>
