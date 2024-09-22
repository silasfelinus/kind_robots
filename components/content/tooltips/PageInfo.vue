<template>
  <!-- Icon to open the welcome page -->
  <div
    class="cursor-pointer p-2 flex items-center justify-center"
    @click="toggleInfo"
  >
    <icon
      v-if="!showInfo"
      name="i-info"
      class="text-3xl text-accent hover:text-accent-focus transition duration-300"
    />
    <icon
      v-else
      name="i-close"
      class="text-3xl text-accent hover:text-accent-focus transition duration-300"
    />
  </div>

  <!-- Welcome splash screen -->
  <div
    v-if="showInfo"
    class="fixed inset-0 bg-primary bg-opacity-90 z-50 flex items-center justify-center p-4"
  >
    <div
      class="bg-base-200 rounded-2xl shadow-lg p-6 w-full max-w-lg max-h-full overflow-auto"
    >
      <!-- Page Content -->
      <div class="flex flex-col items-center justify-center space-y-6">
        <!-- Image -->
        <div class="flex justify-center items-center">
          <img
            :src="'/images/' + page.image"
            alt="Main Image"
            class="rounded-2xl border border-base-300 shadow-md w-64 h-64 object-cover"
          />
        </div>

        <!-- Title and Subtitle -->
        <div class="flex flex-col justify-center items-center">
          <h1 class="text-2xl font-bold text-secondary">{{ pageTitle }}</h1>
          <h2 v-if="pageSubtitle" class="text-lg font-medium text-accent">
            {{ pageSubtitle }}
          </h2>
        </div>

        <!-- Description -->
        <div class="text-center text-base-content max-w-md">
          <p>{{ pageDescription }}</p>
        </div>

        <!-- Tooltip Info -->
        <div class="mt-2 text-center text-neutral">
          <p v-if="pageTooltip" class="italic">{{ pageTooltip }}</p>
          <p v-if="pageDottitip" class="mt-1">{{ pageDottitip }}</p>
          <p v-if="pageAmitip" class="mt-1 text-sm">{{ pageAmitip }}</p>
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
import { useRoute, useRouter } from 'vue-router'
import { useDisplayStore } from '@/stores/displayStore'

// Access the displayStore and page content
const displayStore = useDisplayStore()
const { page } = useContent()
const route = useRoute()
const router = useRouter()

// Computed properties for store interactions
const showInfo = computed({
  get: () => displayStore.showInfo,
  set: (value: boolean) => (displayStore.showInfo = value),
})

// Toggles the visibility of the page info splash screen
const toggleInfo = () => {
  displayStore.showInfo = !displayStore.showInfo
}

// Reset the info toggle whenever the route changes
router.beforeEach((to, from, next) => {
  displayStore.showInfo = true // Reset the info toggle
  next()
})

// Access dynamic content from the page
const pageTitle = computed(() => page?.title || 'Welcome')
const pageSubtitle = computed(() => page?.subtitle || 'No subtitle available')
const pageDescription = computed(
  () => page?.description || 'No description available',
)
const pageTooltip = computed(() => page?.tooltip || 'No tooltip available')
const pageDottitip = computed(() => page?.dottitip || 'No dottitip available')
const pageAmitip = computed(() => page?.amitip || 'No amitip available')
</script>

<style scoped>
.icon:hover {
  color: var(--tw-text-opacity, 1);
}
</style>
