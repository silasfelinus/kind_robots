// /components/content/story/magic-container.vue
<template>
  <div :class="containerClass">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '~/stores/displayStore'

const displayStore = useDisplayStore()

const containerClass = computed(() =>
  displayStore.bigMode
    ? 'scale-[1.5] transition-transform duration-500 ease-in-out'
    : 'scale-100 transition-transform duration-500 ease-in-out',
)
</script>
