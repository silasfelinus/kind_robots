<template>
  <div class="flex flex-col min-h-screen p-2 bg-base-200 m-2 overflow-y-auto">
    <!-- Header -->
    <header
      class="flex justify-between items-center bg-primary rounded-2xl border p-0.5 m-2 relative shadow-lg"
    >
      <layout-selector class="absolute left-2" />
      <h1 class="text-4xl text-default font-bold mx-auto">Kind Robots</h1>
      <login-toggle class="absolute right-2" />
    </header>

    <!-- Subtitle -->
    <div class="text-center bg-primary rounded-2xl border p-2 m-2 shadow-lg">
      <h1 v-if="page.title" class="text-2xl">{{ 'The ' + page.title + ' Room' }}</h1>
      <h1 v-else class="text-2xl text-accent">🌈 Fetching details...</h1>
    </div>

    <!-- Main Content -->
    <main
      class="flex-grow flex flex-col items-center p-2 m-2 bg-primary rounded-2xl border shadow-lg overflow-y-auto"
    >
      <slot />
    </main>

    <!-- Image and Tooltip Wrapper -->
    <div
      class="flex flex-col items-center p-2 m-2 bg-primary rounded-2xl border shadow-lg overflow-y-auto"
    >
      <!-- Image -->
      <div class="rounded-2xl border p-2 m-2 bg-primary shadow-md">
        <img
          :src="`/images/${page.image}`"
          alt="Splash Image"
          class="object-contain w-full h-full rounded-2xl"
        />
      </div>

      <!-- Tooltip -->
      <div class="rounded-2xl border p-2 m-2 bg-primary shadow-md overflow-y-auto">
        <streaming-tooltip :tooltip="page.tooltip" class="w-full" />
      </div>
    </div>

    <!-- Footer -->
    <footer
      class="flex justify-around items-center bg-primary rounded-2xl border p-2 m-2 shadow-lg fixed bottom-0 left-0 right-0"
    >
      <home-link />
      <theme-toggle />
      <butterfly-toggle />
      <footer-toggle />
    </footer>
  </div>
</template>

<script setup lang="ts">
const { page } = useContent()
useContentHead(page)
</script>

<style scoped></style>
