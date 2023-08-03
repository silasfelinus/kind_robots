<template>
  <div>
    <!-- Using KindRobot component for each bot with the selected layout -->
    <div v-for="bot in bots" :key="bot.id">
      <kind-robot :bot="bot" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBotStore } from '../../../stores/botStore'

const botStore = useBotStore()
const bots = computed(() => botStore.bots)
</script>
