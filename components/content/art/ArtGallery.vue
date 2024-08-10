<template>
  <div class="relative bg-base-200 rounded-2xl m-1 p-0">
    <div
      class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg"
    >
      <div class="flex space-x-2">
        <icon
          name="grommet-icons:grid"
          class="text-2xl cursor-pointer"
          @click="setView('fourRow')"
        />
        <icon
          name="mdi:view-dashboard-outline"
          class="text-2xl cursor-pointer"
          @click="setView('threeRow')"
        />
        <icon
          name="ion:grid-outline"
          class="text-2xl cursor-pointer"
          @click="setView('twoRow')"
        />
        <icon
          name="bi:fullscreen"
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
import { useArtStore } from '@/stores/artStore'
import { useTagStore } from '@/stores/tagStore'

const artStore = useArtStore()
const tagStore = useTagStore()

const artAssetsArray = computed(() => Array.from(artStore.artAssets.values()))

const filteredArtAssets = computed(() => {
  if (tagStore.selectedPitch) {
    const selectedPitchTitle = tagStore.selectedPitch.title
    if (typeof selectedPitchTitle === 'string') {
      return artAssetsArray.value.filter(art => art.pitch === selectedPitchTitle)
    }
  }
  return []
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

const itemClass = ref('w-1/2 p-4')

watch(view, (newView) => {
  if (newView === 'twoRow') {
    itemClass.value = 'w-1/2 p-4'
  }
  else if (newView === 'fourRow') {
    itemClass.value = 'w-1/4 p-4'
  }
  else if (newView === 'single') {
    itemClass.value = 'w-full p-4'
  }
  else {
    itemClass.value = 'w-1/3 p-4'
  }
})
</script>
