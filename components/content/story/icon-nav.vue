<!-- /components/content/story/icon-nav.vue -->
<template>
  <div class="grid grid-cols-2 gap-4 w-full max-w-md mx-auto p-4">
    <NuxtLink
      to="/addicon"
      class="flex flex-col items-center justify-center rounded-2xl p-4 bg-base-200 hover:bg-base-300 transition"
    >
      <Icon name="kind-icon:plus" class="text-4xl mb-2" />
      <span class="text-center text-sm font-semibold">Add Icon</span>
    </NuxtLink>

    <NuxtLink
      to="/icongallery"
      class="flex flex-col items-center justify-center rounded-2xl p-4 bg-base-200 hover:bg-base-300 transition"
    >
      <Icon name="lucide:grid" class="text-4xl mb-2" />
      <span class="text-center text-sm font-semibold">Icon Gallery</span>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
// Navigation for icon mode
</script>
