<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const isChecked = ref(true)
const flipContainer = ref<HTMLDivElement | null>(null)
const hasLocalStorage = ref(storageAvailable('localStorage'))

const toggleFlip = () => {
  if (flipContainer.value) {
    flipContainer.value.classList.toggle('flipped')
    const isFlipped = flipContainer.value.classList.contains('flipped')
    if (hasLocalStorage.value) {
      window.localStorage.setItem('flipState', isFlipped ? 'flipped' : 'unflipped')
    }
    isChecked.value = !isFlipped
  }
}

function storageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
  try {
    const storage = window[type]
    const testKey = '__storage_test__'
    storage.setItem(testKey, testKey)
    storage.removeItem(testKey)
    return true
  } catch (e) {
    return false
  }
}

onMounted(() => {
  if (!hasLocalStorage.value) return // Return early if local storage isn't available

  const route = useRoute()
  const isBotRoute = route.path.startsWith('/bot/')
  const flipState = window.localStorage.getItem('flipState')

  if (isBotRoute || flipState === 'flipped') {
    flipContainer.value?.classList.add('flipped')
    isChecked.value = false
  }
})
</script>
<template>
  <div
    class="flex flex-col md:flex-row h-screen text-gray-800 p-4 space-y-4 md:space-y-0 md:space-x-4"
  >
    <layout-selector class="relative" />
    <!-- Sidebar -->
    <div
      class="md:w-1/5 flex flex-col items-center bg-gradient-to-r from-bg-base-200 via-base-400 to-bg-base-600 rounded-r-xl space-y-4"
    >
      <div
        ref="flipContainer"
        :class="{ flipped: !isChecked }"
        class="flex-grow flip-container w-full"
      >
        <div class="flip-front sidebar-content w-full">
          <img alt="Kind Robots Logo" src="/images/fulltitle.png" class="mx-auto rounded-l" />

          <home-nav />
          <theme-selector />
        </div>
        <div class="flip-back sidebar-content w-full text-center profile-center">
          <h1>Welcome to Kind Robots</h1>
          <bot-selector />
          <div class="carousel-container">
            <bot-carousel />
          </div>
        </div>
      </div>
      <!-- Toggle Switch -->
      <div class="toggle-container flex justify-between items-center w-full">
        <span>Bot View</span>
        <label class="switch">
          <input
            type="checkbox"
            role="switch"
            aria-label="Toggle view"
            :checked="isChecked"
            @change="toggleFlip"
          />
          <span class="slider"></span>
        </label>
        <span>Nav View</span>
      </div>
    </div>
    <!-- Main Content -->
    <main-content> <slot /></main-content>
  </div>
</template>

<style scoped>
/* Fade animation for layout transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

/* Flip container setup */
.flip-container {
  perspective: 1000px;
}

/* Setup for the front and back content */
.flip-front,
.flip-back {
  backface-visibility: hidden;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  transform-style: preserve-3d;
  transition: transform 0.6s;
}

.flip-front {
  transform: rotateY(0deg);
}
.flip-back {
  transform: rotateY(180deg);
}

.flipped .flip-front {
  transform: rotateY(-180deg);
}
.flipped .flip-back {
  transform: rotateY(0deg);
}

/* Switch toggle styles */
.switch {
  position: relative;
  width: 60px;
  height: 34px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #4caf50;
  transition: 0.4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: '';
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #2196f3;
}

input:checked + .slider:before {
  transform: translateX(26px);
}
</style>
