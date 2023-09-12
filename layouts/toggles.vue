<template>
  <div>
    <!-- Header Toggle -->
    <div class="flex items-center justify-center p-2 cursor-pointer" @click="toggleHeader">
      <icon v-if="!isHeaderOpen" name="mdi:chevron-down" class="text-default" />
      <icon v-else name="mdi:chevron-up" class="text-default" />
    </div>

    <!-- Header and Screen FX Row -->
    <div v-if="isHeaderOpen" class="flex items-center p-2 relative">
      <!-- Header Bar -->
      <div
        class="flex-grow flex items-center h-[9rem] rounded-2xl border bg-primary p-4 transition-all duration-300 space-x-2 mr-2"
      >
        <home-link class="flex-grow" />
        <layout-selector class="relative flex-grow" />
        <!-- Butterfly Toggle -->
        <div class="flex items-center justify-center m-2 flex-grow">
          <butterfly-toggle />
        </div>
        <!-- Title and Subtitle -->
        <div class="flex flex-col items-center justify-center p-2 m-2 relative flex-grow">
          <h1 class="text-4xl text-default font-bold">Kind Robots</h1>
          <!-- Conditional rendering for title -->
          <h1 v-if="page.subtitle" class="text-4xl text-default font-bold">{{ page.subtitle }}</h1>
          <h1 v-else class="text-4xl text-default font-bold">Location: 🌀 Loading...</h1>
        </div>
        <!-- Theme Selector -->
        <div class="flex items-center justify-center relative flex-grow">
          <theme-toggle />
        </div>
      </div>

      <!-- Screen FX Collapsible Aside -->
      <aside
        class="flex items-center h-[9rem] rounded-2xl border bg-primary p-2 transition-all duration-300 relative"
      >
        <!-- Toggle Button -->
        <div class="flex items-center justify-center bg-primary p-2">
          <button class="h-[calc(100%-1rem)]" @click="toggleScreenFX">
            <icon
              v-if="isScreenFXOpen"
              name="mdi:arrow-collapse-right"
              class="text-default h-full"
            />
            <icon v-else name="mdi:arrow-collapse-left" class="text-default h-full" />
          </button>
        </div>
        <!-- Screen FX -->
        <div v-show="isScreenFXOpen" class="flex items-center justify-center relative ml-2">
          <screen-fx />
        </div>
      </aside>
    </div>

    <main class="flex-grow flex overflow-hidden">
      <!-- Main Content -->
      <div
        class="flex-grow flex flex-col h-full overflow-y-auto p-2 m-2 rounded-2xl border bg-primary"
      >
        <!-- Slot -->
        <slot />
      </div>

      <!-- Sidebar Toggle -->
      <div
        class="absolute top-0 right-0 m-4 p-2 rounded-full bg-primary cursor-pointer"
        @click="toggleSidebar"
      >
        <icon v-if="isSidebarOpen" name="mdi:chevron-right" class="text-default" />
        <icon v-else name="mdi:chevron-left" class="text-default" />
      </div>

      <!-- Image and Status Column -->
      <div
        v-if="isSidebarOpen"
        class="w-1/4 flex flex-col items-center h-full p-2 m-2 rounded-2xl border bg-primary"
      >
        <img
          :src="`/images/${page.image}`"
          alt="Splash Image"
          class="object-contain w-full rounded-2xl border-accent mb-2"
        />
        <h2 v-if="page.title" class="text-2xl text-default text-center">
          The {{ page.title }} Room
        </h2>
        <h2 v-else class="text-2xl text-accent">🌈 Fetching details...</h2>

        <!-- Streaming Tooltip moved here -->
        <div
          class="flex-grow flex items-start justify-start rounded-2xl p-2 m-2 border bg-primary overflow-y-auto"
        >
          <streaming-tooltip :tooltip="page.tooltip" class="w-full" />
          <login-toggle />
        </div>
      </div>
    </main>

    <!-- Footer Toggle -->
    <div class="flex items-center justify-center p-2 cursor-pointer" @click="toggleFooter">
      <icon v-if="!isFooterOpen" name="mdi:chevron-up" class="text-default" />
      <icon v-else name="mdi:chevron-down" class="text-default" />
    </div>

    <!-- Footer -->
    <footer v-if="isFooterOpen" class="p-2 m-2 rounded-2xl border bg-primary">
      <sort-nav />
    </footer>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'

const { page } = useContent()
useContentHead(page)

const isScreenFXOpen = ref(true)
const isHeaderOpen = ref(true)
const isSidebarOpen = ref(true)
const isFooterOpen = ref(true)

const toggleScreenFX = () => {
  isScreenFXOpen.value = !isScreenFXOpen.value
}

const toggleHeader = () => {
  isHeaderOpen.value = !isHeaderOpen.value
}

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const toggleFooter = () => {
  isFooterOpen.value = !isFooterOpen.value
}
</script>
