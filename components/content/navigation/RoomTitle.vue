<template>
  <div class="text-center">
    <h1
      v-if="page && page.title"
      class="text-2xl inline-block rounded-2xl border p-1 m-0 shadow-lg"
    >
      The {{ page.title }} Room
    </h1>
    <h1
      v-else
      class="text-2xl inline-block rounded-2xl border p-1 m-0 shadow-lg"
    >
      🌈 Fetching details...
    </h1>
  </div>
</template>

<script setup lang="ts">
const { page } = useContent()
</script>
