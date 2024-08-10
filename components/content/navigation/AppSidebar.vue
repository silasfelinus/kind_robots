<template>
  <div class="flex flex-col h-screen text-gray-800">
    <!-- Sidebar -->
    <div
      class="flex flex-col items-center bg-gradient-to-r from-bg-base-200 via-base-400 to-bg-base-600 rounded-r-xl space-y-4"
    >
      <!-- Toggle Switch -->
      <div class="flex justify-center items-center w-full px-4 bg-info rounded-2xl border">
        <button
          class="relative w-36 h-10"
          @click="toggleFlip"
        >
          <div
            :class="[
              'absolute inset-0 bg-accent transition-all duration-300',
              isChecked ? 'transform -skew-x-12' : 'transform skew-x-12',
            ]"
          />
          <div
            v-if="isChecked"
            class="absolute inset-0 flex items-center justify-center transition-all duration-300 transform skew-x-12"
          >
            <span class="transform skew-x-12">App View</span>
          </div>
          <div
            v-if="!isChecked"
            class="absolute inset-0 flex items-center justify-center transition-all duration-300 transform -skew-x-12"
          >
            <span class="transform -skew-x-12">Bot View</span>
          </div>
        </button>
      </div>
      <div
        ref="flipContainer"
        :class="{ flipped: !isChecked }"
        class="flex-grow flip-container w-full"
      >
        <!-- App View -->
        <div class="flip-front sidebar-content w-full">
          <img
            alt="Kind Robots Logo"
            src="/images/fulltitle.png"
            class="mx-auto rounded-l"
          >
          <vertical-nav />
        </div>

        <!-- Bot View -->
        <div class="flip-back sidebar-content w-full text-center profile-center">
          <h1>Welcome to Kind Robots</h1>
          <bot-selector />
          <div class="carousel-container">
            <bot-carousel />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

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
  }
  catch (e) {
    return false
  }
}

onMounted(() => {
  if (!hasLocalStorage.value) return

  const route = useRoute()
  const isBotRoute = route.path.startsWith('/bot/')
  const flipState = window.localStorage.getItem('flipState')

  if (isBotRoute || flipState === 'flipped') {
    flipContainer.value?.classList.add('flipped')
    isChecked.value = false
  }
})
</script>

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
</style>
