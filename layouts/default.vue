<template>
  <div class="flex flex-col bg-base-200">
    <!-- Header -->
    <header class="flex flex-col md:flex-row justify-between items-center rounded-2xl">
      <smart-dashboard />
      <room-title />
    </header>

    <!-- Main Content -->
    <main
      class="flex-grow flex flex-col items-center p-2 m-2 rounded-2xl border shadow-lg overflow-y-auto"
    >
      <slot class="w-full h-full flex bg-base-200 rounded-2xl p-2 m-2 border" />
    </main>

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

      <!-- Tooltip -->
      <div class="rounded-2xl border p-2 m-2 shadow-md overflow-y-auto">
        <streaming-tooltip v-if="page && page.tooltip" :tooltip="page.tooltip" />
      </div>
    </div>
    <footer-toggle />
  </div>
</template>

<script setup lang="ts">
const { page } = useContent()
</script>

<style scoped></style>
