<template>
  <div
    class="Icon-container flex items-center justify-center space-x-3 p-4 rounded-lg bg-accent-100"
  >
    <butterfly-toggle />
    <div
      class="Icon-box transition-transform transform hover:scale-125 cursor-pointer p-3 rounded-full hover:bg-accent-200"
      @click="toggleRainEffect"
    >
      <Icon
        name="twemoji:cloud-with-rain"
        title="Kind Weather"
        :active="fxStore.showRainEffect"
        :class="{ glow: fxStore.showRainEffect }"
        class="w-6 h-6 md:w-8 md:h-8"
      />
    </div>
    <div
      class="Icon-box transition-transform transform hover:scale-125 cursor-pointer p-3 rounded-full hover:bg-accent-200"
      @click="toggleSoapBubbles"
    >
      <Icon
        name="Icon-park:soap-bubble"
        title="Kind Bubbles"
        :active="fxStore.showSoapBubbles"
        :class="{ glow: fxStore.showSoapBubbles }"
        class="w-6 h-6 md:w-8 md:h-8"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useScreenStore } from '../../../stores/screenStore'

const fxStore = useScreenStore()

const toggleRainEffect = () => fxStore.toggleRainEffect()
const toggleSoapBubbles = () => fxStore.toggleSoapBubbles()
</script>

<style scoped>
.Icon-box {
  /* existing styles... */
  border-radius: 50%;
}

.glow {
  animation: glow 1s ease-in-out infinite alternate;
  border-radius: 50%;
}

@keyframes glow {
  from {
    box-shadow:
      0 0 5px #ffcc00,
      0 0 10px #ffcc00,
      0 0 15px #ffcc00,
      0 0 20px #ffcc00;
  }
  to {
    box-shadow:
      0 0 10px #ffaa00,
      0 0 20px #ffaa00,
      0 0 30px #ffaa00,
      0 0 40px #ffaa00;
  }
}
</style>
