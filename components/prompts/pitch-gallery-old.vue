<!-- /components/content/prompts/pitch-gallery-old.vue -->
<template>
  <div class="relative bg-base-300 rounded-2xl m-1 p-0">
    <h1>Pitch Gallery</h1>

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
// /components/content/prompts/pitch-gallery-old.vue
import { ref, watch, onMounted, computed } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { usePitchStore } from '@/stores/pitchStore'
import type { Art } from '@prisma/client'

const artStore = useArtStore()
const pitchStore = usePitchStore()

const artArray = computed<Art[]>(
  () => Array.from(artStore.art.values()) as Art[],
)

const filteredArtAssets = computed<Art[]>(() => {
  const selectedPitch = pitchStore.selectedPitch
  if (!selectedPitch) return []
  return artArray.value.filter((a: Art) => a.pitchId === selectedPitch.id)
})

type ViewMode = 'twoRow' | 'threeRow' | 'fourRow' | 'single'

const view = ref<ViewMode>('twoRow')
const itemClass = ref('w-1/2 p-4')

onMounted(() => {
  const saved = window.localStorage.getItem('view') as ViewMode | null
  if (saved) view.value = saved
})

function setView(newView: ViewMode) {
  view.value = newView
  window.localStorage.setItem('view', newView)
}

watch(view, (newView: ViewMode) => {
  if (newView === 'twoRow') itemClass.value = 'w-1/2 p-4'
  else if (newView === 'fourRow') itemClass.value = 'w-1/4 p-4'
  else if (newView === 'single') itemClass.value = 'w-full p-4'
  else itemClass.value = 'w-1/3 p-4'
})
</script>
