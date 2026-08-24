<template>
  <div ref="element">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { observeViewportHydration } from '@/utils/viewportHydration'

const emit = defineEmits<{ hydrate: [] }>()
const element = ref<HTMLElement>()
let stopObserving: (() => void) | null = null

onMounted(() => {
  if (!element.value) return
  stopObserving = observeViewportHydration(element.value, () => {
    stopObserving = null
    emit('hydrate')
  })
})

onBeforeUnmount(() => {
  stopObserving?.()
  stopObserving = null
})
</script>
