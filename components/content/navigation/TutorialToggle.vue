<template>
  <button
    v-if="!isFullScreen"
    class="fixed top-30 right-4 bg-primary text-base-200 rounded-lg shadow-md hover:bg-accent transition duration-300 z-50 p-1"
    @click="toggleTutorial"
  >
    Show {{ showTutorial ? 'Nuxt Page' : 'Tutorial' }}
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const isFullScreen = computed(() => displayStore.isFullScreen)

const showTutorial = computed(() => displayStore.showTutorial)

const toggleTutorial = () => {
  displayStore.toggleTutorial()
}
</script>

<style scoped>
button {
  pointer-events: auto;
}
</style>
