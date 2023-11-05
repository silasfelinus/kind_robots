<template>
  <div class="teleport-container">
    <!-- Background Image -->
    <div class="image-layer" :style="{ backgroundImage: 'url(' + src + ')' }"></div>

    <!-- Cover layers. These will hide the image except the 'windows' -->
    <div class="cover top"></div>
    <div class="cover bottom"></div>
    <div class="cover left"></div>
    <div class="cover right"></div>

    <button class="teleport-button btn btn-primary shadow-xl" @click="fetchImage">Teleport</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const src = ref('');
const isLoading = ref(true);
const offsetY = ref(0);
const warpEffect = ref(false);
const offsetX = ref(0); // Offset for the horizontal movement

const fetchImage = async () => {
  warpEffect.value = true;
  isLoading.value = true;

  const imageLayer = document.querySelector('.image-layer');
  imageLayer.classList.add('pixelate-out');

  await new Promise((resolve) => setTimeout(resolve, 750));

  try {
    const res = await fetch('/api/galleries/random/name/background');
    const data = await res.json();

    if (data.success && data.image) {
      src.value = data.image;
    } else {
      console.error('API returned an unexpected structure:', data);
    }
  } catch (err) {
    console.error('Error fetching images:', err);
  } finally {
    isLoading.value = false;

    setTimeout(() => {
      warpEffect.value = false;
      imageLayer.classList.remove('pixelate-out');
      imageLayer.classList.add('pixelate-in');

      setTimeout(() => {
        imageLayer.classList.remove('pixelate-in');
      }, 500);
    }, 500);
  }
};

const handleScroll = (event) => {
  let scrollY = window.scrollY;
  document.documentElement.style.setProperty('--offsetY', `${-scrollY * 0.5}px`);
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll); // Attach scroll listener to the window

  fetchImage(); // Fetch image when the component is mounted
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll); // Remove scroll listener when the component is unmounted
});
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
  transform: translateY(var(--offsetY)); /* For parallax effect */
  transition: background-image 0.5s ease-in-out; /* Smooth transition for image change */
}

.cover {
  background: white; /* Assuming white as your background color */
  position: absolute;
  z-index: 1;
}

/* Adjusting the masks to create a centered frame */

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
  background: #007bff; /* Assuming a blue color, adjust as needed */
  color: white;
  cursor: pointer;
  padding: 12px 24px;
  position: absolute;
  z-index: 2;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 4px; /* Rounded corners */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* Subtle shadow for depth */
  transition:
    background-color 0.3s ease,
    transform 0.3s ease; /* Smooth transitions for hover */
}

.teleport-button:hover {
  background-color: #0056b3; /* Slightly darker blue on hover */
  transform: translate(-50%, -50%) scale(1.05); /* A subtle increase in size on hover for emphasis */
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
