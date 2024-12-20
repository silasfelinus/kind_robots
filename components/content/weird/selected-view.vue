<template>
  <div class="flex-grow overflow-y-auto p-4">
    <Suspense>
      <template #default>
        <component :is="lazyComponent">
          <fallback-component v-if="lazyComponent === 'fallback-component'" />
        </component>
      </template>
      <template #fallback>
        <div>Loading...</div>
      </template>
    </Suspense>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, Suspense } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

function resolveComponentName(mode: string, action: string) {
  const reversedActions = ['gallery']
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

const currentComponentName = computed(() =>
  resolveComponentName(displayStore.displayMode, displayStore.displayAction),
)

// Dynamically import the component
const lazyComponent = computed(() => {
  const components = import.meta.glob('@/components/**/*.vue', {
    eager: false, // Lazy loading
  })

  const componentName = currentComponentName.value
  const matchingComponentPath = Object.keys(components).find((path) =>
    path.includes(`${componentName}.vue`),
  )

  if (matchingComponentPath) {
    return () => components[matchingComponentPath]()
  }

  // Fallback to static fallback-component
  return 'fallback-component'
})
</script>
