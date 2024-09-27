<template>
  <!-- Art Gallery Container -->
  <div class="relative bg-base-300 rounded-2xl m-1 p-0">
    <h1>Pitch Gallery</h1>
    <!-- View Control Icons -->
    <div
      class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg"
    >
      <div class="flex space-x-2">
        <Icon
          name="grommet-Icons:grid"
          class="text-2xl cursor-pointer"
          @click="setView('fourRow')"
        />
        <Icon
          name="mdi:view-dashboard-outline"
          class="text-2xl cursor-pointer"
          @click="setView('threeRow')"
        />
        <Icon
          name="ion:grid-outline"
          class="text-2xl cursor-pointer"
          @click="setView('twoRow')"
        />
        <Icon
          name="bi:fullscreen"
          class="text-2xl cursor-pointer"
          @click="setView('single')"
        />
      </div>
    </div>
    <!-- Art Cards -->
    <div class="flex flex-wrap">
      <ArtCard
        v-for="art in filteredArtAssets"
        :key="art.id"
        :art="art"
        :class="itemClass"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useArtStore } from '../../../stores/artStore'
import { usePitchStore } from '../../../stores/pitchStore' // Import pitchStore

// Initialize stores
const artStore = useArtStore()
const pitchStore = usePitchStore()

// Fetch all art assets
const artAssetsArray = computed(() => Array.from(artStore.artAssets.values()))

// Filter art assets based on the selected pitch from pitchStore
const filteredArtAssets = computed(() => {
  const selectedPitch = pitchStore.selectedPitch
  if (selectedPitch) {
    return artAssetsArray.value.filter(
      (art) => art.pitchId === selectedPitch.id,
    )
  }
  return []
})

// View control logic
const view = ref('twoRow')
const itemClass = ref('w-1/2 p-4')

// Load saved view from local storage on mount
onMounted(() => {
  const savedView = window.localStorage.getItem('view')
  if (savedView) {
    view.value = savedView
  }
})

// Update view and save to local storage
const setView = (newView: string) => {
  view.value = newView
  window.localStorage.setItem('view', newView)
}

// Update item class based on the selected view
watch(view, (newView) => {
  if (newView === 'twoRow') {
    itemClass.value = 'w-1/2 p-4'
  } else if (newView === 'fourRow') {
    itemClass.value = 'w-1/4 p-4'
  } else if (newView === 'single') {
    itemClass.value = 'w-full p-4'
  } else {
    itemClass.value = 'w-1/3 p-4'
  }
})
</script>
