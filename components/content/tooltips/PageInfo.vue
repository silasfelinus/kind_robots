<template>
  <div>
    <!-- Icon to open the welcome page -->
    <div 
      v-if="!showInfo" 
      @click="toggleInfo" 
      class="absolute top-4 right-4 opacity-70 p-2 cursor-pointer z-40"
    >
      <icon name="i-info" class="text-3xl text-gray-700 hover:text-gray-900 transition duration-300" />
    </div>

    <!-- Welcome splash screen -->
    <div v-if="showInfo" class="fixed inset-0 bg-white bg-opacity-90 z-50 flex flex-col justify-between p-6">
      <!-- X button in the top right corner -->
      <button @click="toggleInfo" class="absolute top-4 right-4 text-2xl text-gray-700 hover:text-gray-900">
        <icon name="i-close" />
      </button>

      <!-- Page Content -->
      <div class="flex flex-col items-center justify-center flex-grow space-y-6">
        <!-- Image -->
        <div class="flex justify-center items-center">
          <img
            :src="'/images/' + page.image"
            alt="Main Image"
            class="rounded-2xl border border-gray-300 shadow-md w-64 h-64 object-cover"
          />
        </div>

        <!-- Title and Subtitle -->
        <div class="flex flex-col justify-center items-center">
          <h1 class="text-4xl font-bold text-gray-800">{{ pageTitle }}</h1>
          <h2 v-if="pageSubtitle" class="text-lg font-medium text-gray-600">{{ pageSubtitle }}</h2>
        </div>

        <!-- Description -->
        <div class="text-center text-gray-600 max-w-xl">
          <p>{{ pageDescription }}</p>
        </div>

        <!-- Tooltip Info -->
        <div class="mt-2 text-center text-gray-500">
          <p v-if="pageTooltip" class="italic">{{ pageTooltip }}</p>
          <p v-if="pageDottitip" class="mt-1">{{ pageDottitip }}</p>
          <p v-if="pageAmitip" class="mt-1 text-sm">{{ pageAmitip }}</p>
        </div>
      </div>

      <!-- OK button and Show Info checkbox -->
      <div class="flex justify-between items-center mt-8">
        <div class="flex items-center">
          <input type="checkbox" id="showInfo" v-model="showInfoInStore" class="mr-2 h-4 w-4 text-primary focus:ring-0" />
          <label for="showInfo" class="text-gray-700">Don't show this again</label>
        </div>
        <button @click="toggleInfo" class="bg-primary text-white py-2 px-4 rounded-lg shadow-md hover:bg-primary-dark transition duration-300">
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
/* Custom styles for icons */
.icon {
  transition: color 0.3s ease;
}

.icon:hover {
  color: #1a202c; /* Tailwind's default gray-900 */
}
</style>
