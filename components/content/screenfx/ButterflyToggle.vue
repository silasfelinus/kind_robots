<template>
  <div
    class="Icon-container flex items-center justify-center space-x-1 rounded-lg bg-accent-100 flex-col"
  >
    <div
      class="Icon-box transition-transform transform hover:scale-125 cursor-pointer rounded-full hover:bg-accent-200"
      @click="toggleAmiSwarm"
    >
      <Icon
        name="emojione:butterfly"
        title="Kind Butterflies"
        :active="fxStore.showAmiSwarm"
        :class="{ glow: fxStore.showAmiSwarm }"
        class="w-6 h-6 md:w-12 md:h-12 cursor-pointer transform transition-transform ease-in-out hover:scale-110"
      />
    </div>
    <div v-if="fxStore.showAmiSwarm">
      <ami-butterfly
        v-for="i in butterflyCount"
        :key="i"
        :style="{ '--animation-delay': i * 0.01 + 's' }"
      />
    </div>

    <!-- Moved the label below the Icon -->
    <div
      v-if="!fxStore.showAmiSwarm"
      class="label-container mt-1 text-xl text-default font-bold"
    />
    <div v-else class="label-container mt-1 text-xl text-default font-bold">
      We're free!
    </div>
  </div>
</template>

<script setup lang="ts">
import { useScreenStore } from '../../../stores/screenStore'

const fxStore = useScreenStore()

const toggleAmiSwarm = () => fxStore.toggleAmiSwarm()

const butterflyCount = 15
</script>

<style>
.Icon-box {
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
