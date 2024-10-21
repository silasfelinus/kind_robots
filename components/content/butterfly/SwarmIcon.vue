<template>
  <div class="relative">
    <!-- Butterfly Icon Box with toggle -->
    <div
      class="Icon-box transition-transform transform hover:scale-125 cursor-pointer rounded-full hover:bg-accent-200"
      @click="toggleAmiSwarm"
    >
      <Icon
        name="kind-icon:butterfly"
        title="Kind Butterflies"
        :class="{ glow: showSwarm }"
        class="w-8 h-8 cursor-pointer transform transition-transform ease-in-out hover:scale-110"
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
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// Reactive variable for toggling the swarm
const showSwarm = ref(false)

// Toggle the butterfly swarm on and off
const toggleAmiSwarm = () => {
  if (route.path !== '/butterflies' && showSwarm.value === false) {
    router.push('/butterflies') // Navigate to /butterflies if not already there
  }

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
  position: fixed;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
}
</style>
