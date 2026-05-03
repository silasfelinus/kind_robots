<!-- /components/content/story/magic-container.vue -->
<template>
  <div class="relative inline-block">
    <div
      class="h-full w-full origin-center transition-transform duration-500 ease-in-out"
      :class="{
        'scale-[1.5]': isCompactHeader,
        'scale-100': !isCompactHeader,
      }"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/story/magic-container.vue
import { computed } from 'vue'
import { useDisplayStore } from '~/stores/displayStore'

const displayStore = useDisplayStore()

const isCompactHeader = computed(() => displayStore.headerState === 'compact')
</script>
