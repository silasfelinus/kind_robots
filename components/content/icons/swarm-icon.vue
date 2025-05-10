<!-- /components/content/story/swarm-icon.vue -->
<template>
  <div
    class="group relative flex items-center justify-center w-[3rem] h-[3rem]"
    @click="toggleAmiSwarm"
  >
    <div class="flex items-center justify-center w-[3rem] h-[3rem]">
      <Icon
        name="kind-icon:butterfly"
        title="Kind Butterflies"
        :class="['transition-transform', 'duration-300', { glow: showSwarm }]"
        class="w-full h-full max-w-[3rem] max-h-[3rem]"
      />
    </div>

    <div
      v-if="showSwarm"
      class="fixed inset-0 overflow-hidden z-50 pointer-events-none full-page"
    >
      <butterfly-animation />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { swarmMessages } from '@/stores/seeds/swarmMessages'

const showSwarm = ref(false)
const swarmText = ref("We're free!")

const toggleAmiSwarm = () => {
  showSwarm.value = !showSwarm.value
  if (showSwarm.value) {
    const randomIndex = Math.floor(Math.random() * swarmMessages.length)
    swarmText.value = swarmMessages[randomIndex]
  }
}

const navLabel = computed(() => (showSwarm.value ? swarmText.value : 'Swarm?'))
defineExpose({ navLabel })
</script>

<style scoped>
.glow {
  box-shadow: 0 0 8px rgba(255, 255, 0, 0.8);
  transition: box-shadow 0.3s ease-in-out;
}
.full-page {
  width: 100vw;
  height: 100vh;
}
</style>
