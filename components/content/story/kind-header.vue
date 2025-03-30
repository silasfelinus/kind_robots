<!-- /components/mode-tabs.vue -->
<template>
  <div
    class="flex items-center justify-between px-2 md:px-4 bg-base-300 z-30 shadow-md rounded-2xl"
  >
    <!-- Left: Gallery Link -->
    <NuxtLink
      to="/weirdlandia/gallery"
      class="flex items-center gap-2 px-3 py-1 rounded-xl transition-transform duration-200 hover:scale-105 hover:bg-base-100 border border-transparent hover:border-primary"
    >
      <Icon
        :name="currentMode?.icon"
        class="w-5 h-5 md:w-6 md:h-6 text-accent"
      />
      <span class="text-md md:text-lg font-semibold text-accent">
        {{ pluralLabel }}
      </span>
    </NuxtLink>

    <!-- Right: Add New Link -->
    <NuxtLink
      to="/weirdlandia/add"
      class="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-accent text-accent transition-transform duration-200 hover:scale-110 hover:rotate-6 bg-base-100 shadow-md"
    >
      <Icon name="kind-icon:add" class="w-6 h-6 md:w-8 md:h-8" />
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
// /components/mode-tabs.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const modes = [
  { name: 'scenarios', icon: 'kind-icon:plus', label: 'Scenario' },
  { name: 'characters', icon: 'kind-icon:plus', label: 'Character' },
  { name: 'rewards', icon: 'kind-icon:plus', label: 'Reward' },
  { name: 'chats', icon: 'kind-icon:plus', label: 'Chat' },
  { name: 'bots', icon: 'kind-icon:plus', label: 'Bot' },
  { name: 'pitches', icon: 'kind-icon:plus', label: 'Pitch' },
  { name: 'art', icon: 'kind-icon:plus', label: 'Art' },
]

const currentMode = computed(() =>
  modes.find((m) => m.name === displayStore.displayMode),
)

const pluralLabel = computed(() =>
  currentMode.value ? currentMode.value.label + 's' : 'Items',
)
</script>
