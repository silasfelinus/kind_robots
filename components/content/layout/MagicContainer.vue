<template>
  <div :class="['container', containerClasses]" :style="containerStyles">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useContainerStore } from '@/stores/containerStore'

const store = useContainerStore()

const containerClasses = computed(() => [
  store.bgColor,
  store.margin,
  store.padding,
  'rounded-2xl', // Ensuring all containers have rounded-2xl borders
  store.borderRadius,
  store.border,
  store.shadow,
  store.transition,
  store.backdrop,
])

const containerStyles = computed(() => ({
  borderColor: 'var(--border-accent)', // Utilizing theme color for border
  borderWidth: '0.5rem', // Setting a thick border line
  borderStyle: 'solid',
}))
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 2rem;
  background-color: var(--bg-base-200);
}
</style>
