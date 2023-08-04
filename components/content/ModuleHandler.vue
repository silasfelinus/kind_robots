<template>
  <div v-if="modules" class="flex flex-wrap justify-center mb-4">
    <button
      v-for="(moduleName, index) in modules.split(',')"
      :key="index"
      :title="moduleData[moduleName.trim()].description"
      class="p-2 m-1 bg-accent rounded-md hover:bg-accent-light transition-colors duration-300"
      @click="selectModule(moduleName.trim())"
    >
      {{ moduleName.trim() }}
    </button>
  </div>
</template>
<script setup lang="ts">
import { moduleData, ModuleData } from '../../training/modules'

const props = defineProps({
  modules: {
    type: String,
    default: ''
  }
})

const selectModule = (moduleName: string) => {
  const selectedModule = moduleData[moduleName]
  if (selectedModule) {
    const { description, example } = selectedModule
    // Prepare the data and send to the appropriate API
    // You can combine this module information with the bot data and send to the API
  }
}
</script>
