<template>
  <div
    class="flex flex-col items-center justify-center text-center h-full px-4"
  >
    <h1 class="text-lg font-semibold text-ellipsis">
      The {{ page.title || 'Room' }} Room
    </h1>
    <h2 class="text-sm italic text-ellipsis">
      {{ subtitle }}
    </h2>

<div class="flex justify-center items-center md:ml-5 md:mr-5 flex-shrink-0">
      <login-path class="flex" />
      <theme-icon class="flex" />
      <swarm-icon class="flex" />
    </div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Page and subtitle
const { page } = useContent()
const subtitle = computed(() => page.value?.subtitle ?? 'Welcome to Kind Robots')
</script>
