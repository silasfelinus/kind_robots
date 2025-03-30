<template>
  <div
    class="flex items-center justify-between px-2 md:px-4 bg-base-300 z-30 shadow-md rounded-2xl"
  >
    <!-- Mode Tabs -->
    <div class="flex items-center gap-1 md:gap-2 flex-wrap">
      <div
        v-for="mode in modes"
        :key="mode.name"
        @click="handleModeChange(mode.name)"
        :class="[
          'flex items-center px-2 py-1 cursor-pointer rounded-t-md border transition-all duration-200',
          mode.name === displayStore.displayMode
            ? 'bg-base-100 border-primary border-b-0 z-10 shadow-md'
            : 'bg-base-200 border-base-300 hover:shadow',
        ]"
      >
        <Icon :name="mode.icon" class="w-5 h-5 md:w-6 md:h-6" />
        <span class="ml-1 text-sm md:text-md font-semibold hidden md:inline">
          {{ mode.label }}
        </span>
      </div>
    </div>

    <!-- Dynamic Link: Add or Gallery -->
    <NuxtLink
      :to="
        displayStore.displayAction === 'add'
          ? '/weirdlandia/add'
          : '/weirdlandia/gallery'
      "
      class="flex items-center gap-1 px-3 py-1 rounded-xl transition-transform duration-200 hover:scale-105 bg-accent text-white font-semibold shadow-md"
    >
      <Icon
        v-if="displayStore.displayAction === 'add'"
        name="kind-icon:add"
        class="w-6 h-6 md:w-7 md:h-7"
      />
      <span v-else class="text-md md:text-lg">
        {{ pluralLabel }}
      </span>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
// /components/mode-tabs.vue
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDisplayStore } from '@/stores/displayStore'

const router = useRouter()
const route = useRoute()
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

function handleModeChange(modeName: string) {
  displayStore.setMode(modeName as displayModeState)
  if (route.path !== '/weirdlandia') router.push('/weirdlandia')
}

const pluralLabel = computed(() => {
  const current = modes.find((m) => m.name === displayStore.displayMode)
  return current ? current.label + 's' : 'Items'
})
</script>
