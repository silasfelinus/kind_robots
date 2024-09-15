<template>
  <div id="app" class="relative h-screen w-screen">
    <!-- Loader -->
    <div v-if="loading" class="absolute top-0 left-0 w-full h-full z-50">
      <ami-loader />
    </div>

    <!-- Intro Component -->
    <Intro v-if="!loading && displayStore.showIntro" @finished="onIntroFinished" />

    <!-- Header -->
    <header
      class="fixed top-0 left-0 w-full z-50 bg-black bg-opacity-60 flex justify-between items-center"
      :style="{ height: headerHeight }"
    >
      <!-- Sidebar Toggle -->
      <div class="p-4">
        <SidebarToggle />
      </div>

      <!-- Navigation Links -->
      <nav class="flex gap-8 items-center">
        <nuxt-link to="/home" class="text-white text-lg hover:underline" @click="onIntroFinished">Home</nuxt-link>
        <nuxt-link to="/artgallery" class="text-white text-lg hover:underline" @click="onIntroFinished">Art Gallery</nuxt-link>
        <nuxt-link to="/botcafe" class="text-white text-lg hover:underline" @click="onIntroFinished">Bot Cafe</nuxt-link>
        <nuxt-link to="/amibot" class="text-white text-lg hover:underline" @click="onIntroFinished">AMIBot</nuxt-link>
      </nav>

      <!-- Hide Intro Toggle -->
      <div class="absolute right-8 top-1/2 transform -translate-y-1/2">
        <button class="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm hover:bg-gray-300" @click="toggleIntro">
          {{ displayStore.showIntro ? 'Hide Intro' : 'Show Intro' }}
        </button>
      </div>
    </header>

    <!-- Main Layout -->
    <div class="flex flex-row relative" :style="{ top: headerHeight }">
      <!-- Sidebar (left) -->
      <aside v-if="displayStore.sidebarLeft !== 'hidden'" class="w-1/4 p-4 bg-gray-100 shadow-lg">
        <kind-sidebar />
      </aside>

      <!-- Main Content -->
      <main :class="[displayStore.sidebarLeft !== 'hidden' ? 'w-3/4' : 'w-full']" class="p-8">
        <transition name="fade">
          <div v-if="!displayStore.showIntro" class="flex justify-center items-center">
            <div class="w-full max-w-4xl p-8 rounded-2xl border-2 border-gray-300 bg-white shadow-lg">
              <nuxt-page />
            </div>
          </div>
        </transition>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const loading = ref(true)
const headerHeight = ref('7vh')

onMounted(() => {
  displayStore.loadState()
  loading.value = false
  updateViewport()
  window.addEventListener('resize', updateViewport)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewport)
})

const updateViewport = () => {
  displayStore.updateViewport()
}

const onIntroFinished = () => {
  displayStore.showIntro = false
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
  height: 100vh;
}

.object-cover {
  object-fit: cover;
}

.object-contain {
  object-fit: contain;
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
</style>
