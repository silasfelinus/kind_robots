<template>
  <div class="relative flex items-center justify-center h-full">
    <!-- Butterfly Icon Box with toggle -->
    <div
      class="Icon-box flex items-center justify-center h-full w-full rounded-full hover:bg-accent-200"
      @click="toggleAmiSwarm"
    >
      <Icon
        name="kind-icon:butterfly"
        title="Kind Butterflies"
        :class="{ glow: showSwarm }"
        class="h-8 w-8 md:w-10 md:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 transition-transform transform hover:scale-110 duration-300 ease-in-out cursor-pointer"
      />
    </div>

    <!-- Full-screen Butterfly Swarm Animation -->
    <div
      v-if="showSwarm"
      class="fixed inset-0 overflow-hidden z-50 pointer-events-none full-page"
    >
      <butterfly-animation />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'




// Reactive variable for toggling the swarm
const showSwarm = ref(false)

// Toggle the butterfly swarm on and off
const toggleAmiSwarm = () => {
  
  showSwarm.value = !showSwarm.value // Toggle the swarm
}
</script>

<style scoped>
/* Add aura glow effect */
.glow {
  box-shadow: 0 0 8px rgba(255, 255, 0, 0.8);
}

/* Full-screen style for butterfly swarm */
.full-page {
  width: 100vw;
  height: 100vh;
}
</style>
