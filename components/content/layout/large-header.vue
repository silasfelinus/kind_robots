<template>
  <div
    class="flex flex-col md:flex-row items-center justify-between h-full text-center md:text-left space-y-2 md:space-y-0 px-4"
  >
    <div class="flex flex-col lg:flex-row items-center md:items-start flex-1">
      <h1 class="text-2xl lg:text-3xl xl:text-4xl font-semibold text-ellipsis">
        The {{ page.title || 'Room' }} Room
      </h1>
      <h2 class="text-lg lg:text-xl xl:text-2xl italic text-ellipsis">
        {{ subtitle }}
      </h2>
    </div>

    <div class="flex justify-center items-center md:ml-5 md:mr-5 flex-shrink-0">
      <login-path class="flex" />
      <theme-icon class="flex" />
      <swarm-icon class="flex" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Page and subtitle
const { page } = useContent()
const subtitle = computed(() => page.value?.subtitle ?? 'Welcome to Kind Robots')
</script>
