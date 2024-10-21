<template>
  <div
    class="Icon-container relative flex items-center justify-center space-x-1 rounded-lg bg-accent-100 flex-col"
  >
    <!-- Butterfly Icon Box -->
    <div
      class="Icon-box transition-transform transform hover:scale-125 cursor-pointer rounded-full hover:bg-accent-200"
      @click="toggleAmiSwarm"
    >
      <Icon
        name="kind-icon:butterfly"
        title="Kind Butterflies"
        :active="fxStore.showAmiSwarm"
        :class="{ glow: fxStore.showAmiSwarm }"
        class="w-8 h-8 cursor-pointer transform transition-transform ease-in-out hover:scale-110"
      />
    </div>

    <!-- Butterfly Swarm Animation Covering the Screen -->
    <div
      v-if="fxStore.showAmiSwarm"
      class="full-page inset-0 overflow-hidden z-50 pointer-events-none"
    >
      <ami-butterfly
        v-for="i in butterflyCount"
        :key="i"
        :style="{ '--animation-delay': i * 0.01 + 's' }"
        class="absolute animate-fly"
      />
    </div>

    <!-- Absolutely Positioned Label (No Layout Shifting) -->
    <div
      v-if="fxStore.showAmiSwarm"
      class="label-container absolute top-full mt-2 text-default font-bold text-center"
    >
      We're Free!
    </div>
  </div>
</template>

<script setup lang="ts">
import { useScreenStore } from '../../../stores/screenStore'

const fxStore = useScreenStore()

const toggleAmiSwarm = () => fxStore.toggleAmiSwarm()

const butterflyCount = 15
</script>

<style scoped>
.Icon-box {
  border-radius: 50%;
}

.glow {
  animation: glow 1s ease-in-out infinite alternate;
  border-radius: 50%;
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
  color: var(--text-accent);
}

.full-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
}

/* Butterfly Animation */
.ami-butterfly {
  width: 50px;
  height: 50px;
  animation: fly 5s linear infinite;
}

@keyframes fly {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(calc(100vw - 50px), calc(100vh - 50px));
  }
}
</style>
