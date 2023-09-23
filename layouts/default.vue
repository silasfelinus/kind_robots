<template>
  <div class="flex flex-col p-2 bg-base-200 m-2">
    <!-- Header -->
    <header
      class="flex justify-between items-center rounded-2xl border p-0.5 m-2 relative shadow-lg"
    >
      <smart-dashboard class="flex flex-row bg-base-200 border rounded-2xl p-2 m-1" />
      <h1 class="text-4xl text-default font-bold">Kind Robots</h1>
    </header>

    <!-- Subtitle -->
    <div class="text-center rounded-2xl border p-2 m-2 shadow-lg">
      <h1 v-if="page.title" class="text-2xl">The {{ page.title }} Room</h1>
      <h1 v-else class="text-2xl">🌈 Fetching details...</h1>
    </div>

    <!-- Main Content -->
    <main
      class="flex-grow flex flex-col items-center p-2 m-2 rounded-2xl border shadow-lg overflow-y-auto"
    >
      <slot />
    </main>

    <!-- Image and Tooltip Wrapper -->
    <div class="flex flex-col items-center p-2 m-2 rounded-2xl border shadow-lg overflow-y-auto">
      <!-- Image -->
      <div class="rounded-2xl border p-2 m-2 shadow-md">
        <img
          :src="`/images/${page.image}`"
          alt="Splash Image"
          class="object-contain w-full h-full rounded-2xl"
        />
      </div>

      <!-- Tooltip -->
      <div class="rounded-2xl border p-2 m-2 shadow-md overflow-y-auto">
        <streaming-tooltip :tooltip="page.tooltip" class="w-full" />
      </div>
    </div>

    <footer class="flex justify-around items-center rounded-2xl border p-2 m-2 shadow-lg">
      <home-link />
      <theme-toggle />
      <butterfly-toggle />
    </footer>
    <footer-toggle />
  </div>
</template>

<script setup lang="ts">
const { page } = useContent()
</script>

<style scoped></style>
