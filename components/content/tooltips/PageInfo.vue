<template>
  <!-- Icon to open the welcome page -->
  <div
    class="cursor-pointer p-2 flex items-center justify-center"
    @click="toggleSplash"
  >
    <Icon
      :name="
        isShowingSplash
          ? 'pepicons-pop:person-checkmark'
          : 'streamline:information-desk-solid'
      "
      :class="[
        'text-3xl transition duration-300',
        isShowingSplash
          ? 'text-secondary hover:text-secondary-focus glow-effect'
          : 'text-accent hover:text-info',
      ]"
    />
  </div>

  <!-- Welcome splash screen -->
  <div
    v-if="isShowingSplash"
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    @click.self="closeSplash"
  >
    <div
      class="bg-base-300 border border-accent rounded-2xl shadow-lg p-6 w-full max-w-md max-h-3/4 overflow-auto"
    >
      <!-- Page Content -->
      <div class="flex flex-col items-center justify-center space-y-6">
        <!-- Image -->
        <div class="flex justify-center items-center">
          <img
            :src="'/images/' + page.image"
            :style="imgStyle"
            alt="Main Image"
            class="rounded-2xl border border-base-300 shadow-md object-cover"
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

        <!-- Integrated Bot Message Cards as chat bubbles -->
        <div class="flex flex-col space-y-4 w-full">
          <!-- DottiBot Message Bubble -->
          <div class="flex justify-end">
            <div
              class="flex items-center space-x-4 p-4 border rounded-lg bg-primary border-secondary text-base-200 shadow-lg w-full md:w-3/4"
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

          <!-- AMIbot Message Bubble -->
          <div class="flex justify-start">
            <div
              class="flex items-center space-x-4 p-4 border rounded-lg bg-secondary border-primary text-base-200 shadow-lg w-full md:w-3/4"
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
          class="bg-info text-base-200 py-2 px-4 rounded-lg shadow-md hover:bg-info-focus transition duration-300"
          @click="closeSplash"
        >
          OK
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplayStore } from '@/stores/displayStore'

// Access the displayStore and page content
const displayStore = useDisplayStore()
const { page } = useContent()

// Local boolean to manage splash visibility
const isShowingSplash = ref(false)
const router = useRouter()

// Computed property for the store interaction
const showInfoInStore = computed({
  get: () => displayStore.showIntro,
  set: () => {
    displayStore.toggleIntro()
  },
})

// Auto-show splash based on store state when navigating to new routes
router.beforeEach((to, from, next) => {
  if (showInfoInStore.value) {
    isShowingSplash.value = true
  }
  next()
})

// Image size: max 50% of either viewport width (vw) or viewport height (vh)
const imgStyle = ref({ width: '', height: '' })

const updateImgStyle = () => {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const size = Math.min(vw, vh) / 2
  imgStyle.value = { width: `${size}px`, height: `${size}px` }
}

// Update image size on mount
onMounted(() => {
  updateImgStyle()
  window.addEventListener('resize', updateImgStyle)
})

const toggleSplash = () => {
  // Toggle the local splash visibility without affecting the store state
  isShowingSplash.value = !isShowingSplash.value
}

const closeSplash = () => {
  // Only close the splash locally, do not modify the store's auto-display logic
  isShowingSplash.value = false
}
</script>

<style scoped>
/* Updated glow effect using accent color */
.glow-effect {
  box-shadow:
    0 0 15px rgba(0, 170, 255, 0.8),
    /* Use accent/info color */ 0 0 25px rgba(0, 170, 255, 0.6); /* Adjust intensity for glow */
  transition: box-shadow 0.3s ease-in-out;
}

img {
  object-fit: cover;
}
</style>
