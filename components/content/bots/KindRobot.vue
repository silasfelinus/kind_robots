<template>
  <div class="flex flex-col items-center bg-primary min-h-screen p-4 text-gray-800">
    <div
      v-if="currentBot"
      :data-theme="currentBot.theme"
      class="w-full max-w-3xl p-4 bg-base-600 rounded-lg shadow-md"
    >
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-theme">{{ currentBot.name }}</h1>
        <span class="text-sm text-gray-600">Bot ID#{{ currentBot.id }} Collect Them All!</span>
      </div>
      <div v-if="currentBot.avatarImage" class="flex justify-center my-4">
        <img :src="currentBot.avatarImage" alt="Bot Avatar" class="w-32 h-32 rounded-full" />
      </div>
      <h2 v-if="currentBot.subtitle" class="text-xl font-semibold mb-2">
        {{ currentBot.subtitle }}
      </h2>
      <p v-if="currentBot.description" class="mb-2 text-lg">{{ currentBot.description }}</p>
      <div v-if="currentBot.modules" class="flex flex-wrap justify-center mb-4">
        <button
          v-for="(moduleName, index) in parsedModules"
          :key="index"
          :title="moduleData[moduleName]?.description || ''"
          class="btn btn-accent m-1"
          @click="selectModule(moduleName)"
        >
          {{ moduleName }}
        </button>
      </div>
      <div><bot-prompt /></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useBotStore } from '../../../stores/botStore'
import { moduleData } from '../../../training/modules'

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

const selectModule = (moduleName: string) => {
  const selectedModule = moduleData[moduleName]
  if (selectedModule) {
    const { description, example } = selectedModule
    console.log('Sending', { moduleName })
  }
}
const parsedModules = computed(() => {
  if (currentBot.value && currentBot.value.modules) {
    return currentBot.value.modules.split(',').map((moduleName) => moduleName.trim())
  }
  return []
})
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
