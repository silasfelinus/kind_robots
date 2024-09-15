<template>
  <div id="app" class="relative h-screen w-screen">
    <!-- Loader -->
    <div v-if="loading" class="absolute top-0 left-0 w-full h-full z-50">
      <ami-loader />
    </div>

    <!-- Intro Component -->
    <Intro v-if="!loading && displayStore.showIntro" @finished="onIntroFinished" />

    <!-- Header (Minimal Text Navigation) -->
    <header class="fixed top-0 left-0 w-full z-50 bg-black bg-opacity-60 flex justify-center" :style="{ height: headerHeight }">
      <nav class="flex gap-8 items-center">
        <nuxt-link to="/home" class="text-white text-lg hover:underline" @click="onIntroFinished">Home</nuxt-link>
        <nuxt-link to="/artgallery" class="text-white text-lg hover:underline" @click="onIntroFinished">Art Gallery</nuxt-link>
        <nuxt-link to="/botcafe" class="text-white text-lg hover:underline" @click="onIntroFinished">Bot Cafe</nuxt-link>
        <nuxt-link to="/amibot" class="text-white text-lg hover:underline" @click="onIntroFinished">AMIBot</nuxt-link>
      </nav>

      <!-- Hide Intro Toggle -->
      <div class="absolute right-8 top-1/2 transform -translate-y-1/2">
        <button
          class="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm hover:bg-gray-300"
          @click="toggleIntro"
        >
          {{ displayStore.showIntro ? 'Hide Intro' : 'Show Intro' }}
        </button>
      </div>
    </header>

    
    <div class="flex flex-row relative" :style="{ top: headerHeight }">
      <!-- Sidebar (aside) -->
      <aside class="w-1/4 p-4 bg-gray-100 shadow-lg">
        <kind-sidebar />
      </aside>

      
      <main class="w-3/4 p-8">
        <transition name="fade">
          <div v-if="!displayStore.showIntro" class="flex justify-center items-center">
            <div class="w-full max-w-4xl p-8 rounded-2xl border-2 border-gray-300 bg-white shadow-lg">
              <nuxt-page />
            </div>

            
            <button
              v-if="!displayStore.showIntro"
              class="absolute bottom-8 right-8 bg-gray-200 text-gray-800 p-2 rounded-lg text-sm hover:bg-gray-300"
              @click="restartExperience"
            >
              Repeat Intro?
            </button>
          </div>
        </transition>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import Intro from '@/components/content/tooltips/IntroPage.vue'

const displayStore = useDisplayStore()

const loading = ref(true)
const headerHeight = ref('7vh') // Set header height as a percentage of the viewport height

onMounted(() => {
  displayStore.loadState()
  loading.value = false
})

const onIntroFinished = () => {
  displayStore.showIntro = false
  displayStore.saveState()
}

const restartExperience = () => {
  displayStore.showIntro = true
  displayStore.saveState()
}

const toggleIntro = () => {
  displayStore.toggleIntroState()
}
</script>

<style scoped>
html,
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  height: 100vh; /* Ensure body takes the full height of the viewport */
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

.flex-row {
  display: flex;
  flex-direction: row;
}

.w-1/4 {
  width: 25%;
}

.w-3/4 {
  width: 75%;
}

@media (max-width: 768px) {
  .w-1/4 {
    width: 100%; /* Sidebar full width on small screens */
  }
  .w-3/4 {
    width: 100%; /* Main content full width on small screens */
  }
}
</style>
