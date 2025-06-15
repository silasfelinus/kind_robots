<!-- /components/content/story/main-component.vue -->

<template>
  <component :is="resolvedComponent" v-if="resolvedComponent" />
</template>

<script setup lang="ts">
import { computed, resolveComponent } from 'vue'
import { useDisplayStore } from '~/stores/displayStore'

const displayStore = useDisplayStore()

const resolvedComponent = computed(() => {
  const name = displayStore.mainComponent
  if (!name) return 'user-dashboard'
  try {
    return resolveComponent(name)
  } catch {
    return null
  }
})
</script>
