<template>
  <div class="flex flex-col items-center bg-base-600 p-4 text-gray-800">
    <div
      v-if="currentBot"
      :data-theme="currentBot.theme"
      class="w-full max-w-3xl p-4 bg-base-600 rounded-lg shadow-md"
    >
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-3xl font-bold text-theme">{{ currentBot.name }}</h1>
        <span class="text-sm text-gray-600">Bot ID#{{ currentBot.id }} Collect Them All!</span>
      </div>
      <div><stream-test /></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useBotStore } from '../../../stores/botStore'

const botStore = useBotStore()
const route = useRoute()
const currentBot = computed(() => botStore.currentBot)

const handleBotSelection = () => {
  const id = Number(route.params.id)
  const name = route.params.name !== null ? String(route.params.name) : undefined

  if (id) {
    botStore.getBotById(id)
  } else if (name) {
    botStore.getBotByName(name)
  }
}

// Watch for changes to the route parameters
watch(route, () => {
  handleBotSelection()
})

// Initial selection based on the route parameters
handleBotSelection()
</script>

<style>
.animate-typing {
  overflow: hidden;
  white-space: nowrap;
  border-right: 0.15em solid transparent;
  animation:
    typing 2s steps(30, end),
    blink-caret 0.75s step-end infinite;
}

@keyframes typing {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}

@keyframes blink-caret {
  from,
  to {
    border-color: transparent;
  }
  50% {
    border-color: inherit;
  }
}
</style>
