<template>
  <div class="teleport-container">
    <!-- Background Image -->
    <div
      class="image-layer"
      :class="{ 'pixelate-out': isPixelatingOut, 'pixelate-in': isPixelatingIn }"
      :style="imageStyle"
    ></div>
    <slot />

    <button class="teleport-button btn btn-primary shadow-xl" @click="fetchImage">Teleport</button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watchEffect } from 'vue';

const src = ref('');
const isPixelatingOut = ref(false);
const isPixelatingIn = ref(false);

const imageStyle = ref({});

watchEffect(() => {
  imageStyle.value = { backgroundImage: `url(${src.value})` };
});

const fetchImage = async () => {
  isPixelatingOut.value = true;

  await new Promise((resolve) => setTimeout(resolve, 750));

  try {
    const res = await fetch('/api/galleries/random/name/background');
    const data = await res.json();

    if (data.success && data.image) {
      isPixelatingIn.value = true;
      src.value = data.image;
    } else {
      console.error('API returned an unexpected structure:', data);
    }
  } catch (err) {
    console.error('Error fetching images:', err);
  } finally {
    isPixelatingOut.value = false;

    setTimeout(() => {
      isPixelatingIn.value = false;
    }, 500);
  }
};

const handleScroll = () => {
  const scrollY = window.scrollY;
  document.documentElement.style.setProperty('--offsetY', `${-scrollY * 0.3}px`);
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
  fetchImage();
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.teleport-container {
  position: relative;
  width: 100%; /* Will take up to the full width of its parent container */
  height: 150vh; /* Increase the height to give space for the parallax effect */
  overflow: hidden; /* Hide the overflow caused by the larger image */
}

.image-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  height: 200vh; /* Make the image much taller to enable the parallax effect */
  background-size: cover;
  background-position: center;
  background-attachment: fixed; /* This will give the parallax effect */
  transition: background-image 0.5s ease-in-out;
}

.teleport-button {
  appearance: none;
  border: none;
  background: #007bff;
  color: white;
  cursor: pointer;
  padding: 12px 24px;
  position: absolute; /* Positioned within teleport-container */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%); /* Center the button both vertically and horizontally */
  z-index: 1;
  border-radius: 4px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition:
    background-color 0.3s ease,
    transform 0.3s ease;
}

.teleport-button:hover {
  background-color: #0056b3;
  transform: scale(1.05) translate(-50%, -50%);
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
