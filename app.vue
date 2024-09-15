<template>
  <div id="app" class="relative h-screen w-screen">
    <!-- Loader -->
    <div v-if="loading" class="absolute top-0 left-0 w-full h-full z-50">
      <ami-loader />
    </div>

    <!-- Intro Component -->
    <Intro v-if="!loading && !displayStore.introSeen" @finished="onIntroFinished" />

    <!-- Center Content Container with rounded-2xl border to display Nuxt Page -->
    <transition name="fade">
      <div v-if="displayStore.introSeen" class="absolute inset-0 flex justify-center items-center z-40">
        <div class="w-full max-w-4xl p-8 rounded-2xl border-2 border-gray-300 bg-white shadow-lg">
          <nuxt-page />
        </div>

        <!-- Subtle Toggle in the corner to repeat intro -->
        <button class="absolute bottom-8 right-8 bg-gray-200 text-gray-800 p-2 rounded-lg text-sm hover:bg-gray-300" @click="restartExperience">
          Repeat Intro?
        </button>
      </div>
    </transition>

    <!-- Header (Minimal Text Navigation) -->
    <header class="fixed top-0 left-0 w-full p-4 bg-black bg-opacity-60 z-50 flex justify-center">
      <nav class="flex gap-8">
        <nuxt-link to="/home" class="text-white text-lg hover:underline">Home</nuxt-link>
        <nuxt-link to="/artgallery" class="text-white text-lg hover:underline">Art Gallery</nuxt-link>
        <nuxt-link to="/botcafe" class="text-white text-lg hover:underline">Bot Cafe</nuxt-link>
        <nuxt-link to="/amibot" class="text-white text-lg hover:underline">AMIBot</nuxt-link>
      </nav>
    </header>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import Intro from '@/components/tooltips/IntroPage.vue'

const displayStore = useDisplayStore()

const loading = ref(true)

onMounted(() => {
  displayStore.loadState()
  loading.value = false
})

const onIntroFinished = () => {
  displayStore.introSeen = true
  displayStore.saveState()
}

const restartExperience = () => {
  displayStore.introSeen = false
  displayStore.saveState()
}
</script>

<style scoped>
html,
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.object-cover {
  object-fit: cover;
}

.object-contain {
  object-fit: contain; /* Ensures the image is fully visible */
}

.border-2xl {
  border-radius: 1rem;
}

.hover\:underline:hover {
  text-decoration: underline;
}

.text-lg {
  font-size: 1.125rem;
}

.text-sm {
  font-size: 0.875rem;
}

.rounded-2xl {
  border-radius: 1rem;
}
</style>
