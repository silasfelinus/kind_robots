<template>
  <div>
    <layout-selector class="absolute hidden" />
    <NuxtLayout :key="currentLayout" :name="currentLayout">
      <ContentDoc />
    </NuxtLayout>
  </div>
</template>
<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useLayoutStore } from '~/stores/layoutStore'

const layoutStore = useLayoutStore()

// Computed property to get the current layout from the store
const currentLayout = computed(() => layoutStore.currentLayout)

// Get the current page title and append "- Kind Robots" to it
const title = computed(() => {
  const defaultTitle = 'Welcome' // Replace with your default title
  if (process.client) {
    return `${document.title || defaultTitle} - Kind Robots`
  }
  return defaultTitle
})

watchEffect(() => {
  useHead({
    title: title.value
  })
})
</script>
