<template>
  <!-- Icon to open the welcome page -->
  <div
    class="cursor-pointer p-2 flex items-center justify-center"
    @click="toggleInfo"
  >
    <Icon
      :name="
        showInfo
          ? 'pepicons-pop:person-checkmark'
          : 'streamline:information-desk-solid'
      "
      :class="[
        'text-3xl transition duration-300',
        showInfo
          ? 'text-secondary hover:text-secondary-focus glow-effect'
          : 'text-accent hover:text-accent-focus',
      ]"
    />
  </div>

  <!-- Welcome splash screen -->
  <div
    v-if="showInfo"
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
  >
    <div
      class="bg-base-100 rounded-2xl shadow-lg p-6 w-full max-w-md max-h-1/2 overflow-auto"
    >
      <!-- Page Content -->
      <div class="flex flex-col items-center justify-center space-y-6">
        <!-- Image -->
        <div class="flex justify-center items-center">
          <img
            :src="'/images/' + page.image"
            alt="Main Image"
            class="rounded-2xl border border-base-300 shadow-md w-32 h-32 object-cover"
          />
        </div>

        <!-- Title and Subtitle -->
        <div class="flex flex-col justify-center items-center">
          <h1 class="text-2xl font-bold text-secondary">{{ page.title }}</h1>
          <h2 v-if="page.subtitle" class="text-lg font-medium text-accent">
            {{ page.subtitle }}
          </h2>
        </div>

        <!-- Description -->
        <div class="text-center text-base-content max-w-md">
          <p>{{ page.description }}</p>
        </div>

        <!-- Integrated Bot Message Cards -->
        <div class="flex flex-col space-y-4">
          <!-- AMIbot Message Card -->
          <div
            class="flex items-center space-x-4 p-4 rounded-lg border-2 bg-base-200 shadow-2xl border-accent"
          >
            <img
              src="/images/amibotsquare1.webp"
              alt="AMIbot Avatar"
              class="w-12 h-12 rounded-full shadow-md"
            />
            <div class="flex flex-col">
              <span class="text-sm font-semibold">AMIbot</span>
              <p class="text-sm">{{ page.amitip }}</p>
            </div>
          </div>

          <!-- DottiBot Message Card -->
          <div
            class="flex items-center space-x-4 p-4 rounded-lg border-2 bg-base-200 shadow-2xl border-secondary"
          >
            <img
              src="/images/avatars/dottie1.webp"
              alt="DottiBot Avatar"
              class="w-12 h-12 rounded-full shadow-md"
            />
            <div class="flex flex-col">
              <span class="text-sm font-semibold">DottiBot</span>
              <p class="text-sm">{{ page.dottitip }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- OK button and Show Info checkbox -->
      <div class="flex justify-between items-center mt-8">
        <div class="flex items-center">
          <input
            id="showInfo"
            v-model="showInfoInStore"
            type="checkbox"
            class="mr-2 h-4 w-4 text-accent focus:ring-0"
          />
          <label for="showInfo" class="text-base-content"
            >Don't show this again</label
          >
        </div>
        <button
          class="bg-secondary text-base-200 py-2 px-4 rounded-lg shadow-md hover:bg-secondary-focus transition duration-300"
          @click="toggleInfo"
        >
          OK
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDisplayStore } from '@/stores/displayStore'

// Access the displayStore and page content
const displayStore = useDisplayStore()
const { page } = useContent()

// Computed properties for store interactions
const showInfo = computed({
  get: () => displayStore.showInfo,
  set: (value: boolean) => (displayStore.showInfo = value),
})

// Toggles the visibility of the page info splash screen
const toggleInfo = () => {
  displayStore.showInfo = !displayStore.showInfo
}
</script>

<style scoped>
/* Add glow effect for selected icon */
.glow-effect {
  box-shadow:
    0 0 15px rgba(255, 204, 0, 0.8),
    0 0 25px rgba(255, 204, 0, 0.6);
  transition: box-shadow 0.3s ease-in-out;
}

img {
  object-fit: cover;
}
</style>
