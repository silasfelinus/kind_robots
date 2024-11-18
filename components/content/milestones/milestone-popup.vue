<template>
  <!-- Popup Content -->
  <div
    v-if="showPopup"
    class="fixed inset-0 flex justify-center items-center border border-red-500 z-50"
  >
    <div
      class="rounded-2xl p-10 text-center relative border-accent bg-base-100 max-w-lg mx-auto shadow-xl"
    >
      <h2 class="text-3xl font-semibold mb-6">
        Congratulations, {{ userStore.username }}!
      </h2>
      <div v-if="milestone">
        <Icon
          :name="milestone.icon ?? 'kind-icon:map'"
          class="h-20 w-20 mx-auto mb-6 text-primary"
        />
        <p class="text-xl font-medium mb-4">
          🌟 You earned the {{ milestone.label }} milestone! 🌟
        </p>
        <p class="my-4 text-gray-700">{{ milestone.message }}</p>
        <div class="karma-award flex flex-col items-center">
          <p class="text-lg font-semibold">Bonus: +{{ milestone.karma }}</p>
          <p class="text-lg mb-4">You Found 1 Jellybean!</p>
          <Icon name="kind-icon:jellybean" class="p-2 h-16 w-16 text-accent" />
        </div>
        <button
          class="bg-primary text-white rounded-2xl border px-6 py-3 mt-6 hover:bg-primary-focus transition"
          @click="confirmMilestone"
        >
          Yay! (Close)
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import confetti from 'canvas-confetti'
import { useLoadStore } from './../../../stores/loadStore'

const { randomLoadMessage } = useLoadStore()
const currentMessage = ref('Building Kind Robots...')

const butterflyCount = ref(20)
const fadeOut = ref(false)
const butterflyFadeOut = ref(false)
const pageReady = ref(false)

const startFadeOut = () => {
  fadeOut.value = true
}

const startButterflyFadeOut = () => {
  butterflyFadeOut.value = true
  launchConfetti() // Trigger confetti at the start of butterfly fade-out
}

const updateMessage = () => {
  currentMessage.value = randomLoadMessage()
}

const launchConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { x: 0.5, y: 0.5 }, // Center of the screen
  })
}

let intervalId: NodeJS.Timeout
onMounted(() => {
  setTimeout(() => {
    currentMessage.value = randomLoadMessage()
    intervalId = setInterval(updateMessage, 1700)
  }, 100)

  setTimeout(startFadeOut, 1300)

  setTimeout(startButterflyFadeOut, 10000)
})

onUnmounted(() => {
  clearInterval(intervalId)
})

const handleTransitionEnd = () => {
  if (fadeOut.value) {
    pageReady.value = true
  }
}
</script>

<style>
/* Full-screen overlay styling */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.fade-scale-enter,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
