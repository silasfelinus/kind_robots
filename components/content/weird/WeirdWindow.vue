<template>
  <div class="teleport-container">
    <!-- Background Image -->
    <div
      class="image-layer"
      :class="{ 'pixelate-out': isPixelatingOut, 'pixelate-in': isPixelatingIn }"
      :style="imageStyle"
    ></div>
    <new-eyeball position="top-left" class="absolute top-0 left-0" />
    <new-eyeball position="top-right" class="absolute top-0 right-0" />

    <div class="game-overlay">
      <div class="p-10 rounded-xl shadow-2xl bg-opacity-70 max-w-xl text-center space-y-6 relative">
        <weirdlandia-game />
        <!-- Moved the teleport button here -->
        <button class="teleport-button btn btn-primary shadow-xl" @click="teleportButton">
          Teleport
        </button>
        <milestone-reward v-if="shouldShowMilestoneCheck" :id="3"></milestone-reward>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watchEffect } from 'vue'

const src = ref('')
const isPixelatingOut = ref(false)
const isPixelatingIn = ref(false)

const imageStyle = ref({})
const shouldShowMilestoneCheck = ref(false)

watchEffect(() => {
  imageStyle.value = { backgroundImage: `url(${src.value})` }
})

const teleportButton = async () => {
  shouldShowMilestoneCheck.value = true // This will make the milestone check appear
  await fetchImage()
}

const fetchImage = async () => {
  isPixelatingOut.value = true

  await new Promise((resolve) => setTimeout(resolve, 750))

  try {
    const res = await fetch('/api/galleries/random/name/background')
    const data = await res.json()

    if (data.success && data.image) {
      isPixelatingIn.value = true
      src.value = data.image
    } else {
      console.error('API returned an unexpected structure:', data)
    }
  } catch (err) {
    console.error('Error fetching images:', err)
  } finally {
    isPixelatingOut.value = false

    setTimeout(() => {
      isPixelatingIn.value = false
    }, 500)
  }
}
const handleScroll = () => {
  const scrollY = window.scrollY
  const parallaxFactor = 0.25 // Adjust this factor, experiment with values like 0.2 or 0.25 to find what suits best.
  const yOffset = scrollY * parallaxFactor
  imageStyle.value.backgroundPosition = `center ${-yOffset}px`
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  fetchImage()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.teleport-container {
  position: relative;
  width: 100%;
  height: 130vh; /* Adjust this to fit your needs, either 110vh or 130vh based on your preference. */
  overflow: hidden;
}

.image-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  height: 150vh; /* This should be slightly taller than the teleport-container to accommodate the parallax effect. */
  background-size: cover;
  background-position: center;
  transition: background-image 0.5s ease-in-out;
}
.teleport-button {
  appearance: none;
  border: none;
  background: #007bff;
  color: white;
  cursor: pointer;
  padding: 12px 24px;
  margin-top: 20px; /* Adding margin-top to space it out from the game element */
  border-radius: 4px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition:
    background-color 0.3s ease,
    transform 0.3s ease;
}

.teleport-button:hover {
  background-color: #0056b3;
  transform: scale(1.05);
}

.game-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1; /* or a higher value if necessary */
}

@keyframes pixelateOut {
  0% {
    filter: blur(0px);
  }
  50% {
    filter: blur(4px);
  }
  100% {
    filter: blur(8px);
  }
}

@keyframes pixelateIn {
  0% {
    filter: blur(8px);
  }
  50% {
    filter: blur(4px);
  }
  100% {
    filter: blur(0px);
  }
}

.pixelate-out {
  animation: pixelateOut 1s forwards;
}

.pixelate-in {
  animation: pixelateIn 1s forwards;
}
</style>
