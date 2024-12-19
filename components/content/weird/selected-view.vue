<template>
  <div class="flex-grow overflow-y-auto p-4">
    <component :is="currentComponent">
      <fallback-component v-if="currentComponent === 'fallback-component'" />
    </component>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

function resolveComponentName(mode: string, action: string) {
  const reversedActions = ['gallery']
  const componentName = reversedActions.includes(action)
    ? `${mode}-${action}`
    : `${action}-${mode}`

  const availableComponents = import.meta.glob('@/components/**/*.vue', {
    eager: true,
  })
  const isComponentAvailable = Object.keys(availableComponents).some((path) =>
    path.includes(`${componentName}.vue`),
  )

  return isComponentAvailable ? componentName : 'fallback-component'
}

const currentComponent = computed(() =>
  resolveComponentName(displayStore.displayMode, displayStore.displayAction),
)
</script>
