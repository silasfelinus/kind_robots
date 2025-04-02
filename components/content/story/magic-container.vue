// /components/content/story/magic-container.vue
<template>
  <div
    class="transition-transform duration-500 ease-in-out origin-center"
    :class="{
      'scale-[1.5]': displayStore.bigMode,
      'scale-100': !displayStore.bigMode,
    }"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { useDisplayStore } from '~/stores/displayStore'

const displayStore = useDisplayStore()
</script>
