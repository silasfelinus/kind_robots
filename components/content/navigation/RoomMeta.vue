<!-- RoomMeta.vue -->
<template>
  <div class="flex flex-col justify-center items-center">
    <!-- Image -->
    <div class="flex justify-center items-center mb-4">
      <img
        :src="'/images/' + page.image"
        alt="Main Image"
        class="max-h-[25vh] md:max-h-[10vh] rounded-2xl border shadow-md"
      />
    </div>
    <!-- Title and Subtitle -->
    <div class="flex flex-col justify-center items-center">
      <room-title class="text-lg font-semibold mb-2" />
      <h2 class="text-md font-medium">{{ page.subtitle }}</h2>
    </div>
  </div>
</template>

<script setup lang="ts">
const { page } = useContent()
</script>
