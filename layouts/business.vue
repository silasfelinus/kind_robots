<template>
  <div class="flex flex-col min-h-screen">
    <!-- Navbar -->
    <nav class="flex justify-between items-center p-4 bg-primary text-default">
      <div class="logo text-2xl font-bold">KindRobots</div>
      <smart-dashboard class="flex flex-row bg-base-200 border rounded-2xl m-1" />
      <h1 class="text-lg font-semibold">The {{ page.title }} Room</h1>
      <h2 class="text-md font-semibold">{{ page.subtitle }}</h2>
    </nav>
    <!-- Display tooltip -->
    <div v-if="showTooltip" class="mt-4 p-2 text-xl rounded-2xl border bg-secondary">
      {{ page.tooltip }}
    </div>

    <!-- Main Content -->
    <main class="flex-1 p-4">
      <slot class="w-full h-full flex bg-base-200 rounded-2xl p-2 m-2" />
    </main>

    <!-- Footer -->
    <footer class="p-4 bg-base-200 text-default text-center m-h-1/3">
      <!-- Adjusted Image URL -->
      <img
        :src="'/images/' + page.image"
        alt="Main Image"
        class="mx-auto my-4 rounded-2xl border shadow-md"
      />
      <!-- Footer -->
      <footer-toggle />
      KindRobots © 2023
    </footer>
  </div>
</template>

<script setup lang="ts">
const { page } = useContent()

const showTooltip = ref<boolean>(true)
</script>
