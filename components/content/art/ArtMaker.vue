<template>
  <div class="art-maker">
    <h1>Art Maker 🎨</h1>
    <h2>Designer - {{ username }}</h2>
    <art-prompts />

    <!-- Special message for admin -->
    <div v-if="isAdmin">
      <p>You have all-access as an admin!</p>
    </div>

    <!-- Input for art prompt -->
    <input v-model="prompt" placeholder="Enter art prompt" />

    <!-- Generate Art Button -->
    <button :disabled="isGenerating" @click="generateArt">
      Generate Art
      <!-- Loader positioned over the button -->
      <div v-if="isGenerating" class="loader-overlay">
        <ami-butterfly />
      </div>
    </button>

    <!-- Display ArtCards -->
    <div v-for="art in artAssets" :key="art.id">
      <ArtCard :art="art" />
    </div>

    <!-- Loading State -->
    <div v-if="isGenerating">
      <p>Generating art, please wait...</p>
      <p>Your dream while you wait: {{ currentDream }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useArtStore, Art } from '@/stores/artStore'
import { useTagStore } from '@/stores/tagStore'
import { useUserStore } from '@/stores/userStore'
import { useDreamStore } from '@/stores/dreamStore'

const artStore = useArtStore()
const tagStore = useTagStore()
const userStore = useUserStore()
const dreamStore = useDreamStore()

onMounted(() => {
  // Initialize artStore
  artStore.init()
  tagStore.initializeTags()
})

const prompt = ref('')
const isGenerating = ref(false)
const artAssets = ref(artStore.artAssets)
const username = computed(() => userStore.username)
const isAdmin = computed(() => userStore.role === 'ADMIN')
const currentDream = ref('')

let timer: NodeJS.Timeout

const generateArt = async () => {
  isGenerating.value = true
  currentDream.value = dreamStore.randomDream()
  timer = setInterval(() => {
    currentDream.value = dreamStore.randomDream()
  }, 15000)

  try {
    await artStore.generateArt(prompt.value)
  } catch (error: any) {
    console.error('Error generating art:', error)
  } finally {
    isGenerating.value = false
    clearInterval(timer)
  }
}

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style scoped>
/* Your styles here */
.loader-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
