<template>
  <div class="flex flex-col items-center bg-base-600 min-h-screen p-4 text-gray-800">
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

      <div class="bg-base p-4 rounded-lg mt-4">
        <div class="text-center mb-4">
          <h2 class="text-xl font-semibold">Modules (In Development)</h2>
        </div>
        <div class="flex flex-wrap justify-center gap-4">
          <div
            v-for="(moduleName, index) in parsedModules"
            :key="index"
            class="card w-48 bg-base-400 content"
          >
            <div class="card-body items-center text-center p-2">
              <h2 class="card-title text-md truncate">{{ moduleName }}</h2>
              <p class="truncate">{{ moduleData[moduleName]?.description || '' }}</p>
              <div class="card-actions justify-end mt-2">
                <button
                  class="btn btn-accent text-xs"
                  :title="moduleData[moduleName]?.description || ''"
                  @click="selectModule(moduleName)"
                >
                  {{ moduleName }}
                </button>
                <div class="text-sm text-gray-600 mt-2 truncate">
                  {{ moduleData[moduleName]?.description || 'No example available' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
