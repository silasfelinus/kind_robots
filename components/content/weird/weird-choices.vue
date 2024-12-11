<template>
  <div
    class="weird-choices bg-warning text-white flex flex-col items-center justify-center rounded-lg h-full"
  >
    <h2 class="text-lg font-bold mb-4">Choose Your Adventure</h2>

    <!-- Scene Selection -->
    <div v-if="sceneChoices.length" class="w-full">
      <h3 class="text-md font-semibold text-base-content mb-2">Scenes:</h3>
      <ul class="space-y-2">
        <li
          v-for="(scene, index) in sceneChoices"
          :key="index"
          class="cursor-pointer bg-base-200 text-primary p-4 rounded-md shadow-md hover:bg-base-300 transition"
          @click="selectScene(index)"
        >
          <div class="flex items-center space-x-4">
            <img
              :src="scene.image"
              alt="Scene Thumbnail"
              class="w-16 h-16 rounded-md object-cover"
            />
            <div>
              <h4 class="text-lg font-bold">{{ scene.title }}</h4>
              <p class="text-sm text-base-content">{{ scene.description }}</p>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <!-- Intro Selection -->
    <div v-else-if="selectedScene" class="w-full mt-4">
      <h3 class="text-md font-semibold text-base-content mb-2">
        Intros for {{ selectedScene.title }}:
      </h3>
      <ul class="space-y-2">
        <li
          v-for="(intro, index) in selectedScene.intros"
          :key="index"
          class="cursor-pointer bg-base-200 text-primary p-4 rounded-md shadow-md hover:bg-base-300 transition"
          @click="selectIntro(intro)"
        >
          {{ intro }}
        </li>
      </ul>
    </div>

    <!-- No Choices Available -->
    <p v-else class="text-center text-base-content">No options available</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useWeirdStore } from '@/stores/weirdStore'

const weirdStore = useWeirdStore()

// State to track the selected scene
const selectedSceneIndex = ref(null)

// Computed properties
const sceneChoices = computed(() => weirdStore.initialChoices || [])
const selectedScene = computed(() =>
  selectedSceneIndex.value !== null ? sceneChoices.value[selectedSceneIndex.value] : null
)

// Methods
const selectScene = (index) => {
  selectedSceneIndex.value = index
}

const selectIntro = (intro) => {
  weirdStore.processAction(intro)
  selectedSceneIndex.value = null // Reset to scene selection after choosing an intro
}
</script>
