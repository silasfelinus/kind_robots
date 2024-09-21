<template>
  <div>
    <!-- Icon to open the welcome page -->
    <div 
      v-if="!showInfo" 
      @click="toggleInfo" 
      class="cursor-pointer absolute top-0 right-0 opacity-70 p-2 z-40"
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
      <div class="flex flex-col items-center justify-center">
        <!-- Image -->
        <div class="flex justify-center items-center m-1">
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

const { page } = useContent()
const displayStore = useDisplayStore()

// ShowInfo from the store
const showInfoInStore = computed({
  get: () => displayStore.showInfo,
  set: (value: boolean) => displayStore.showInfo = value
})

// Toggle Info function to show or hide the splash screen
const toggleInfo = () => {
  displayStore.showInfo = !displayStore.showInfo
}
</script>

<style scoped>
/* Splash screen full page overlay when open */
div.fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
}
</style>
