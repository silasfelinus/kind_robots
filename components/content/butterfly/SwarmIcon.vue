<!-- /components/content/story/swarm-icon.vue -->
<template>
  <div
    class="group flex flex-col items-center justify-center w-[80px] min-w-[72px] max-w-[90px] transition-all"
    @click="toggleAmiSwarm"
  >
    <div
      class="flex items-center justify-center rounded-full hover:bg-accent cursor-pointer"
    >
      <Icon
        name="kind-icon:butterfly"
        title="Kind Butterflies"
        :class="{ glow: showSwarm }"
        class="h-8 w-8 md:w-10 md:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 transition-transform transform hover:scale-110 duration-300 ease-in-out"
      />
    </div>

    <!-- Dynamic Label -->
    <span class="mt-2 text-center text-sm md:block hidden">
      {{ showSwarm ? "We're free!" : 'Swarm?' }}
    </span>

    <!-- Full-screen Swarm Animation -->
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

const showSwarm = ref(false)

const toggleAmiSwarm = () => {
  showSwarm.value = !showSwarm.value
}
</script>

<style scoped>
.glow {
  box-shadow: 0 0 8px rgba(255, 255, 0, 0.8);
}
.full-page {
  width: 100vw;
  height: 100vh;
}
</style>
