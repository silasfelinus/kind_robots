// /components/content/story/magic-container.vue
<template>
  <div class="relative inline-block">
    <div
      class="transition-transform duration-500 ease-in-out origin-center w-full h-full"
      :class="{
        'scale-[1.5]': displayStore.bigMode,
        'scale-100': !displayStore.bigMode,
      }"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDisplayStore } from '~/stores/displayStore'

const displayStore = useDisplayStore()
</script>
