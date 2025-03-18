<template>
  <div
    class="button-container flex flex-col items-center overflow-hidden"
    :style="displayStore.mainContentStyle"
  >
    <!-- Dynamic Component Section -->
    <div class="flex-grow w-full overflow-y-auto h-full">
      <component :is="lazyComponent" v-if="lazyComponent" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, type Component } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Function to resolve component names based on mode and action
function resolveComponentName(mode: string, action: string) {
  const reversedActions = ['gallery', 'interact']
  const componentName = reversedActions.includes(action)
    ? `${mode}-${action}`
    : `${action}-${mode}`

  const availableComponents = import.meta.glob('@/components/**/*.vue')

  return Object.keys(availableComponents).some((path) =>
    path.includes(`${componentName}.vue`),
  )
    ? componentName
    : 'fallback-component'
}

// Computed property for resolving the component
const currentComponentName = computed(() =>
  resolveComponentName(displayStore.displayMode, displayStore.displayAction),
)

const lazyComponent = computed(() => {
  const components = import.meta.glob('@/components/**/*.vue')

  const componentName = currentComponentName.value
  const matchingComponentPath = Object.keys(components).find((path) =>
    path.includes(`${componentName}.vue`),
  )

  return matchingComponentPath
    ? defineAsyncComponent(async () => {
        const mod = (await components[matchingComponentPath]()) as {
          default: Component
        }
        return mod.default
      })
    : null
})
</script>
