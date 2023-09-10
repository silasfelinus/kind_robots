<template>
  <div class="flex flex-col h-screen overflow-hidden p-2 bg-base-200">
    <!-- Header and Screen FX Row -->
    <div class="flex items-center p-2 relative">
      <!-- Header Bar -->
      <div
        class="flex-grow flex items-center h-[9rem] rounded-2xl border bg-accent p-4 transition-all duration-300 space-x-2 mr-2"
      >
        <home-link class="flex-grow" />
        <layout-selector class="relative flex-grow" />
        <!-- Butterfly Toggle -->
        <div class="flex items-center justify-center m-2 flex-grow">
          <butterfly-toggle />
        </div>
        <!-- Title and Subtitle -->
        <div class="flex flex-col items-center justify-center p-2 m-2 relative flex-grow">
          <h1 class="text-4xl text-white font-bold">Kind Robots</h1>
          <!-- Conditional rendering for title -->
          <h1 v-if="page.subtitle" class="text-4xl text-white font-bold">{{ page.subtitle }}</h1>
          <h1 v-else class="text-4xl text-white font-bold">Location: 🌀 Loading...</h1>
        </div>
        <!-- Theme Selector -->
        <div class="flex items-center justify-center relative flex-grow">
          <theme-toggle />
        </div>
      </div>

      <!-- Screen FX Collapsible Aside -->
      <aside
        class="flex items-center h-[9rem] rounded-2xl border bg-accent p-2 transition-all duration-300 relative"
      >
        <!-- Toggle Button -->
        <div class="flex items-center justify-center bg-accent p-2">
          <button class="h-[calc(100%-1rem)]" @click="toggleScreenFX">
            <icon v-if="isScreenFXOpen" name="mdi:arrow-collapse-right" class="text-white h-full" />
            <icon v-else name="mdi:arrow-collapse-left" class="text-white h-full" />
          </button>
        </div>
        <!-- Screen FX -->
        <div v-show="isScreenFXOpen" class="flex items-center justify-center relative ml-2">
          <screen-fx />
        </div>
      </aside>
    </div>

    <main class="flex h-[calc(100vh-11rem)] overflow-hidden">
      <!-- Image and Status Column -->
      <div class="w-1/4 flex flex-col items-center h-full p-2 m-2 rounded-2xl border bg-primary">
        <img
          :src="`/images/${page.image}`"
          alt="Splash Image"
          class="object-contain w-full rounded-2xl border-accent mb-2"
        />
        <h2 v-if="page.title" class="text-2xl text-white text-center">The {{ page.title }} Room</h2>
        <h2 v-else class="text-2xl text-accent">🌈 Fetching details...</h2>

        <!-- Streaming Tooltip moved here -->
        <div
          class="flex-grow flex items-start justify-start rounded-2xl p-2 m-2 border bg-primary overflow-y-auto"
        >
          <streaming-tooltip :tooltip="page.tooltip" class="w-full" />
        </div>
      </div>

      <!-- Slot -->
      <div
        class="flex-grow flex flex-col items-center w-full h-full max-h-full overflow-y-auto p-2 m-2 ml-2 rounded-2xl border bg-primary"
      >
        <slot />
      </div>
    </main>

    <!-- Footer -->
    <footer class="p-2 m-2 rounded-2xl border bg-primary">
      <home-nav />
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const { page } = useContent()
useContentHead(page)

const isScreenFXOpen = ref(true)
const toggleScreenFX = () => {
  isScreenFXOpen.value = !isScreenFXOpen.value
}
</script>
