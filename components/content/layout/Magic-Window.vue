<template>
  <div class="teleport-container">
    <!-- Background Image -->
    <div class="image-layer" :style="{ backgroundImage: 'url(' + src + ')' }" />

    <!-- Cover layers. These will hide the image except the 'windows' -->
    <div class="cover top" />
    <div class="cover bottom" />
    <div class="cover left" />
    <div class="cover right" />

    <button
      class="teleport-button btn btn-primary shadow-xl"
      @click="fetchImage"
    >
      Teleport
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const src = ref('')
const isLoading = ref(true)
const warpEffect = ref(false)

const fetchImage = async () => {
  warpEffect.value = true
  isLoading.value = true

  const imageLayer = document.querySelector(
    '.image-layer',
  ) as HTMLElement | null
  if (imageLayer) {
    imageLayer.classList.add('pixelate-out')
  }

  await new Promise((resolve) => setTimeout(resolve, 750))

  try {
    const res = await fetch('/api/galleries/random/name/background')
    const data = await res.json()

    if (data.success && data.image) {
      src.value = data.image
    } else {
      console.error('API returned an unexpected structure:', data)
    }
  } catch (err) {
    console.error('Error fetching images:', err)
  } finally {
    isLoading.value = false

    setTimeout(() => {
      warpEffect.value = false
      const imageLayer = document.querySelector(
        '.image-layer',
      ) as HTMLElement | null
      if (imageLayer) {
        imageLayer.classList.remove('pixelate-out')
        imageLayer.classList.add('pixelate-in')

        setTimeout(() => {
          imageLayer.classList.remove('pixelate-in')
        }, 500)
      }
    }, 500)
  }
}

const handleScroll = () => {
  const scrollY = window.scrollY
  document.documentElement.style.setProperty('--offsetY', `${-scrollY * 0.5}px`)
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)

  fetchImage() // Fetch image when the component is mounted
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.teleport-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.image-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-size: cover;
  background-position: center;
  transform: translateY(var(--offsetY));
  transition: background-image 0.5s ease-in-out;
}

.cover {
  background: white;
  position: absolute;
  z-index: 1;
}

.top {
  width: 100%;
  height: calc(50% - 100px);
  top: 0;
}

.bottom {
  width: 100%;
  height: calc(50% - 100px);
  bottom: 0;
}

.left {
  width: calc(50% - 150px);
  height: 200px;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
}

.right {
  width: calc(50% - 150px);
  height: 200px;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
}

.teleport-button {
  appearance: none;
  border: none;
  background: #007bff;
  color: white;
  cursor: pointer;
  padding: 12px 24px;
  position: absolute;
  z-index: 2;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 4px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition:
    background-color 0.3s ease,
    transform 0.3s ease;
}

.teleport-button:hover {
  background-color: #0056b3;
  transform: translate(-50%, -50%) scale(1.05);
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
