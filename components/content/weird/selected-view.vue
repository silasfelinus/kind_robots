<template>
  <div class="flex-grow overflow-y-auto p-4">
    <component :is="lazyComponent" />
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Function to resolve component names based on mode and action
function resolveComponentName(mode: string, action: string) {
  const reversedActions = ['gallery', 'interact']
  const componentName = reversedActions.includes(action)
    ? `${mode}-${action}`
    : `${action}-${mode}`

  const availableComponents = import.meta.glob('@/components/**/*.vue', {
    eager: false, // Lazy loading
  })

  const isComponentAvailable = Object.keys(availableComponents).some((path) =>
    path.includes(`${componentName}.vue`),
  )

  return isComponentAvailable ? componentName : 'fallback-component'
}

// Computed to determine the current component name
const currentComponentName = computed(() =>
  resolveComponentName(displayStore.displayMode, displayStore.displayAction),
)

const lazyComponent = computed(() => {
  const components = import.meta.glob('@/components/**/*.vue', {
    eager: false, // Lazy loading
  })

  const componentName = currentComponentName.value
  const matchingComponentPath = Object.keys(components).find((path) =>
    path.includes(`${componentName}.vue`),
  )

  if (matchingComponentPath) {
    return defineAsyncComponent(() =>
      components[matchingComponentPath]().then((mod) => {
        const component = mod as { default: ReturnType<typeof defineComponent> }
        return component.default
      }),
    )
  }

  // Fallback to static fallback-component if no match found
  return 'fallback-component'
})
</script>
