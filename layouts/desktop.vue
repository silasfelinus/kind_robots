<template>
  <div class="flex flex-col bg-base-200">
    <!-- Header -->
    <header class="flex flex-col md:flex-row justify-between items-center rounded-2xl">
      <new-dashboard />
      <room-title />
    </header>

    <slot class="w-full h-full flex bg-base-200 rounded-2xl p-1 m-1" />

    <!-- Image and Tooltip Wrapper -->
    <div class="flex flex-col items-center p-2 m-2 rounded-2xl border shadow-lg overflow-y-auto">
      <!-- Image -->
      <div class="rounded-2xl border p-2 m-2 shadow-md">
        <img
          v-if="page && page.image"
          :src="`/images/${page.image}`"
          alt="Splash Image"
          class="object-contain w-full h-full rounded-2xl"
        />
      </div>
    </div>
    <footer-toggle />
    <streaming-tooltip
      v-if="page.tooltip && page.amitip"
      :tooltip="page.tooltip"
      :amitip="page.amitip"
    />
    <random-link />
  </div>
</template>

<script setup lang="ts">
const { page } = useContent()
</script>
