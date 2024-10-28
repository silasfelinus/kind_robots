<template>
  <div class="relative bg-base-300 rounded-2xl m-1 p-0">
    <div
      class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg"
    >
      <div class="flex space-x-2">
        <Icon
          name="kind-icon:grid"
          class="text-2xl cursor-pointer"
          @click="setView('fourRow')"
        />
        <Icon
          name="kind-icon:dashboard"
          class="text-2xl cursor-pointer"
          @click="setView('threeRow')"
        />
        <Icon
          name="ion:grid-outline"
          class="text-2xl cursor-pointer"
          @click="setView('twoRow')"
        />
        <Icon
          name="kind-icon:fullscreen"
          class="text-2xl cursor-pointer"
          @click="setView('single')"
        />
      </div>
    </div>
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
import { useArtStore } from './../../../stores/artStore'
import { usePitchStore } from './../../../stores/pitchStore'

const artStore = useArtStore()
const pitchStore = usePitchStore()

// Convert the art Map to an array
const artArray = computed(() => Array.from(artStore.art.values()))

// Filter art assets based on the selected pitch
const filteredArtAssets = computed(() => {
  if (pitchStore.selectedPitch) {
    const selectedPitchId = pitchStore.selectedPitch.id
    return artArray.value.filter((art) => art.pitchId === selectedPitchId)
  }
  return artArray.value // If no pitch is selected, return all art
})

const view = ref('twoRow')

onMounted(() => {
  const savedView = window.localStorage.getItem('view')
  if (savedView) {
    view.value = savedView
  }
})

const setView = (newView: string) => {
  view.value = newView
  window.localStorage.setItem('view', newView)
}

// Adjust item class based on the current view
const itemClass = ref('w-1/2 p-4')

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
