<!-- /components/content/story/swarm-icon.vue -->
<template>
  <div
    class="w-full h-full flex items-center justify-center transition-transform hover:scale-110"
    @click="toggleAmiSwarm"
  >
    <Icon
      name="kind-icon:butterfly"
      title="Kind Butterflies"
      :class="{ glow: showSwarm }"
      class="w-full h-full max-w-[3rem] max-h-[3rem]"
    />

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
import { ref, computed, nextTick } from 'vue'
import { swarmMessages } from '@/stores/seeds/swarmMessages'

const showSwarm = ref(false)
const swarmText = ref("We're free!")



const toggleAmiSwarm = async () => {
  showSwarm.value = !showSwarm.value

  if (showSwarm.value) {
    const randomIndex = Math.floor(Math.random() * swarmMessages.length)
    swarmText.value = swarmMessages[randomIndex]

    await nextTick() // forces DOM flush before animation paint
  }
}


const navLabel = computed(() => (showSwarm.value ? swarmText.value : 'Swarm?'))

// expose for smart-icons.vue
defineExpose({ navLabel })
</script>

<style scoped>
.glow {
  box-shadow: 0 0 8px rgba(255, 255, 0, 0.8);
}
.full-page {
  width: 100vw;
  height: 100vh;
}

.glow {
  box-shadow: 0 0 8px rgba(255, 255, 0, 0.8);
  transition: box-shadow 0.3s ease-in-out;
}

</style>
