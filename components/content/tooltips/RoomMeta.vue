<!-- RoomMeta.vue -->
<template>
  <div class="flex flex-col justify-center items-center">
    <!-- Image -->
    <div class="flex justify-center items-center m-1">
      <img
        :src="'/images/' + page.image"
        alt="Main Image"
        class="rounded-2xl border shadow-md medium"
      >
    </div>
    <!-- Title and Subtitle -->
    <div class="flex flex-col justify-center items-center">
      <room-title class="text-lg font-semibold m-2" />
      <h2
        v-if="page.subtitle"
        class="text-md font-medium"
      >
        {{ page.subtitle }}
      </h2>
    </div>
  </div>
</template>

<script setup lang="ts">
const { page } = useContent()
</script>
