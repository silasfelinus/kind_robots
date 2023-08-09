<template>
  <div
    class="flex flex-col md:flex-row h-screen text-gray-800 space-y-4 md:space-y-0 md:space-x-4 relative"
  >
    <!-- Image and its backside -->
    <div
      class="md:w-1/5 h-full flex flex-col overflow-y-auto shadow-lg bg-gradient-to-r from-bg-base-200 via-base-400 to-bg-base-600 rounded-r-xl p-4 space-y-4 relative"
    >
      <div v-if="showImage" class="cursor-pointer" @click="toggleImage">
        <img
          src="/images/fulltitle.png"
          class="mx-auto w-full h-auto shadow-lg hover:shadow-2xl transition-shadow duration-500"
          alt="Title"
        />
      </div>
      <div
        v-else
        class="absolute inset-0 bg-opacity-50 flex items-center justify-center"
        @click="toggleBotCarousel"
      >
        <home-nav></home-nav>
      </div>
      <theme-selector />
      <bot-carousel
        v-if="showBotCarousel"
        class="flex-grow bg-base rounded-xl p-4"
        @click="toggleNuxtPage"
      />
    </div>

    <!-- Nuxt page and its overlay -->
    <main
      v-if="showNuxtPage"
      class="md:w-3/5 h-full flex flex-col bg-base shadow-inner rounded-l-xl transition-all duration-500 relative p-4 space-y-4"
    >
      <div class="absolute inset-0 bg-black bg-opacity-50" @click="toggleAllDisplays"></div>
      <transition name="fade" mode="out-in">
        <div>
          <slot />
        </div>
      </transition>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const showImage = ref(true)
const showBotCarousel = ref(false)
const showNuxtPage = ref(false)

const toggleImage = () => {
  showImage.value = !showImage.value
}

const toggleBotCarousel = () => {
  showBotCarousel.value = !showBotCarousel.value
}

const toggleNuxtPage = () => {
  showNuxtPage.value = !showNuxtPage.value
}

const toggleAllDisplays = () => {
  showImage.value = true
  showBotCarousel.value = false
  showNuxtPage.value = false
}
</script>
