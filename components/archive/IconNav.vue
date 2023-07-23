<template>
  <div
    class="icon-container flex items-center justify-center space-x-3 p-4 rounded-lg bg-accent-100"
  >
    <butterfly-toggle />
    <div
      class="icon-box transition-transform transform hover:scale-125 cursor-pointer p-3 rounded-full hover:bg-accent-200"
      @click="toggleRainEffect"
    >
      <icon
        name="twemoji:cloud-with-rain"
        title="Kind Weather"
        :active="fxStore.showRainEffect"
        :class="{ glow: fxStore.showRainEffect }"
        class="w-6 h-6 md:w-8 md:h-8"
      />
    </div>
    <div
      class="icon-box transition-transform transform hover:scale-125 cursor-pointer p-3 rounded-full hover:bg-accent-200"
      @click="toggleSoapBubbles"
    >
      <icon
        name="icon-park:soap-bubble"
        title="Kind Bubbles"
        :active="fxStore.showSoapBubbles"
        :class="{ glow: fxStore.showSoapBubbles }"
        class="w-6 h-6 md:w-8 md:h-8"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFxStore } from '../../stores/screenfx'

const fxStore = useFxStore()

const toggleRainEffect = () => fxStore.toggleRainEffect()
const toggleSoapBubbles = () => fxStore.toggleSoapBubbles()
</script>
<style scoped>
.icon-box {
  /* existing styles... */
  border-radius: 50%;
}

.glow {
  animation: glow 1s ease-in-out infinite alternate;
  border-radius: 50%;
}

@keyframes glow {
  from {
    box-shadow: 0 0 5px #ffcc00, 0 0 10px #ffcc00, 0 0 15px #ffcc00, 0 0 20px #ffcc00;
  }
  to {
    box-shadow: 0 0 10px #ffaa00, 0 0 20px #ffaa00, 0 0 30px #ffaa00, 0 0 40px #ffaa00;
  }
}
</style>
stores/screenfx ../../stores/gameStore
