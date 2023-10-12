<template>
  <div
    class="icon-container flex items-center justify-center space-x-3 p-4 rounded-lg bg-accent-100 flex-col"
  >
    <div
      class="icon-box transition-transform transform hover:scale-125 cursor-pointer p-3 rounded-full hover:bg-accent-200"
      @click="toggleAmiSwarm"
    >
      <icon
        name="emojione:butterfly"
        title="Kind Butterflies"
        :active="fxStore.showAmiSwarm"
        :class="{ glow: fxStore.showAmiSwarm }"
        class="w-12 h-12 md:w-8 md:h-8"
      />
    </div>
    <div v-if="fxStore.showAmiSwarm">
      <ami-butterfly
        v-for="i in butterflyCount"
        :key="i"
        :style="{ '--animation-delay': i * 0.01 + 's' }"
      />
    </div>

    <!-- Moved the label below the icon -->
    <div
      v-if="!fxStore.showAmiSwarm"
      class="label-container mt-2 text-xl text-default font-bold"
    ></div>
    <div v-else class="label-container mt-2 text-xl text-default font-bold">We're free!</div>
  </div>
</template>

<script setup lang="ts">
import { useScreenStore } from '../../../stores/screenStore'

const fxStore = useScreenStore()

const toggleAmiSwarm = () => fxStore.toggleAmiSwarm()

const butterflyCount = 50
</script>
<style>
.icon-box {
  border-radius: 50%;
}

.glow {
  animation: glow 1s ease-in-out infinite alternate;
  border-radius: 50%;
  /* Add this line to apply the delay */
  animation-delay: var(--animation-delay, 0s);
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

.label-container {
  font-size: 1rem;
  display: flex;
  align-items: center;
  color: bg-accent-100; /* Adjust color to fit your design */
}

.arrow {
  margin-right: 5px;
  font-weight: bold;
}
</style>
