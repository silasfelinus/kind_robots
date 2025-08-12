<template>
  <div class="grid grid-cols-2 gap-4 w-full max-w-md mx-auto p-4">
    <NuxtLink
      to="/add-pantheon"
      class="flex flex-col items-center justify-center rounded-2xl p-4 bg-base-200 hover:bg-base-300 transition"
    >
      <Icon name="kind-icon:plus" class="text-4xl mb-2" />
      <span class="text-center text-sm font-semibold">Add Pantheon</span>
    </NuxtLink>

    <NuxtLink
      to="/pantheon-gallery"
      class="flex flex-col items-center justify-center rounded-2xl p-4 bg-base-200 hover:bg-base-300 transition"
    >
      <Icon name="kind-icon:grid" class="text-4xl mb-2" />
      <span class="text-center text-sm font-semibold">View Gallery</span>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
// Navigation for pantheon mode
</script>
