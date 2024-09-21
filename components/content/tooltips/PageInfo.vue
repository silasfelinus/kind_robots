<template>
  <div>
    <!-- Icon to open the welcome page -->
    <div 
      v-if="!showInfo" 
      @click="toggleInfo" 
      class="absolute top-4 right-4 opacity-70 p-2 cursor-pointer z-40"
    >
      <icon name="i-info" class="text-2xl" />
    </div>

    <!-- Welcome splash screen -->
    <div v-if="showInfo" class="fixed inset-0 bg-white bg-opacity-90 z-50 flex flex-col justify-between p-8">
      <!-- X button in the top right corner -->
      <button @click="toggleInfo" class="absolute top-4 right-4 text-2xl z-50">
        <icon name="i-close" />
      </button>

      <!-- Page Content -->
      <div class="flex flex-col items-center justify-center flex-grow">
        <!-- Image -->
        <div class="flex justify-center items-center m-4">
          <img
            :src="'/images/' + page.image"
            alt="Main Image"
            class="rounded-2xl border shadow-md medium"
          />
        </div>

        <!-- Title and Subtitle -->
        <div class="flex flex-col justify-center items-center">
          <h1 class="text-3xl font-semibold m-2">{{ pageTitle }}</h1>
          <h2 v-if="pageSubtitle" class="text-lg font-medium">{{ pageSubtitle }}</h2>
        </div>

        <!-- Description -->
        <div class="text-center m-4 text-gray-600">
          <p>{{ pageDescription }}</p>
        </div>

        <!-- Tooltip Info -->
        <div class="mt-2 text-center">
          <p v-if="pageTooltip" class="italic">{{ pageTooltip }}</p>
          <p v-if="pageDottitip" class="mt-1">{{ pageDottitip }}</p>
          <p v-if="pageAmitip" class="mt-1 text-sm text-gray-500">{{ pageAmitip }}</p>
        </div>
      </div>

      <!-- OK button and Show Info checkbox -->
      <div class="flex justify-between items-center mt-8">
        <div class="flex items-center">
          <input type="checkbox" id="showInfo" v-model="showInfoInStore" class="mr-2" />
          <label for="showInfo" class="text-gray-700">Don't show this again</label>
        </div>
        <button @click="toggleInfo" class="bg-primary text-white py-2 px-4 rounded-md">
          OK
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDisplayStore } from '@/stores/displayStore'
import { useContent } from '@nuxt/content'

// Access the displayStore and page content
const displayStore = useDisplayStore()
const { page } = useContent()

// Computed properties for store interactions
const showInfo = computed({
  get: () => displayStore.showInfo,
  set: (value: boolean) => displayStore.showInfo = value
})

// Toggles the visibility of the page info splash screen
const toggleInfo = () => {
  displayStore.showInfo = !displayStore.showInfo
}

// Access dynamic content from the page
const pageTitle = computed(() => page?.title || 'Welcome')
const pageSubtitle = computed(() => page?.subtitle || '')
const pageDescription = computed(() => page?.description || '')
const pageTooltip = computed(() => page?.tooltip || '')
const pageDottitip = computed(() => page?.dottitip || '')
const pageAmitip = computed(() => page?.amitip || '')
</script>

<style scoped>
/* Ensure the page info icon is placed inside the main content area */
div.absolute {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 40;
}

/* Full-screen splash screen */
div.fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9); /* Slight opacity */
  z-index: 50;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Page info content */
div.flex {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

/* Responsive image inside the splash screen */
img.rounded-2xl {
  max-width: 100%;
  height: auto;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>
