<template>
  <div
    class="bg-base-200 border-2 border-accent rounded-md shadow-md m-4 p-4 flex flex-col items-center justify-center"
  >
    <!-- Avatar Image -->
    <avatar-image class="w-1/3 h-1/3 rounded-full object-cover mb-4" />
    <!-- Bot Information -->
    <div class="text-center">
      <h2 class="text-xl font-bold mb-2">{{ activeBot.name }}</h2>
      <p class="text-sm mb-2">{{ activeBot.intro }}</p>
    </div>
    <div v-if="activeBot.model || activeBot.post || activeBot.size" class="flex flex-wrap gap-2">
      <p v-if="activeBot.model" class="text-accent-700">Model: {{ activeBot.model }}</p>
      <p v-if="activeBot.post" class="text-accent-700">Post: {{ activeBot.post }}</p>
      <p v-if="activeBot.size" class="text-accent-700">Size: {{ activeBot.size }}</p>
      <bot-collectible />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBotsStore } from '../../stores/bots'

const botsStore = useBotsStore()
let activeBot = computed(() => botsStore.getActiveBot)
</script>

<style scoped>
.card-container {
  position: relative;
  border: 2px solid var(--bg-accent);
  padding: 20px;
  margin: 20px;
}

.theme-triangle {
  position: absolute;
  right: 0;
  top: 0;
  width: 0;
  height: 0;
  border-left: 50px solid transparent;
  border-right: 50px solid transparent;
  border-bottom: 100px solid var(--bg-base);
}

.avatar img {
  width: 100%;
  height: auto;
}

.description-container {
  background: #fff;
  border-radius: 25px;
  padding: 20px;
  margin-top: 20px;
}
</style>
