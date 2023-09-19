<template>
  <div class="flex flex-col h-screen overflow-y-auto p-2 bg-base-200 m-2">
    <!-- Header -->
    <header
      class="flex justify-between items-center bg-primary rounded-2xl border p-0.5 m-2 relative shadow-lg"
    >
      <home-link />
      <layout-selector class="relative" />
      <login-toggle />
      <!-- Title and Subtitle -->
      <h1 class="text-4xl text-default font-bold">Kind Robots</h1>
      <div class="flex flex-col items-center justify-center p-0.5 m-2 relative">
        <!-- Conditional rendering for title -->
        <h1 v-if="page.subtitle" class="text-4xl font-bold">{{ page.subtitle }}</h1>
        <h1 v-else class="text-4xl font-bold">Location: 🌀 Loading...</h1>
      </div>
      <!-- Theme Toggle -->
      <div class="flex items-center justify-center relative">
        <theme-toggle />
      </div>
      <!-- Butterfly Toggle -->
      <div class="flex items-center justify-center m-2">
        <butterfly-toggle />
      </div>
    </header>

    <main class="flex-grow flex flex-col md:flex-row overflow-hidden">
      <!-- Slot -->
      <div
        class="flex-grow flex flex-col items-center overflow-y-auto p-2 m-2 rounded-2xl border bg-primary shadow-lg max-h-[calc(100%-4rem)] max-w-full"
      >
        <slot />
      </div>

      <!-- Image and Tooltip Wrapper -->
      <div class="flex flex-col w-full md:w-1/4 h-full p-2 rounded-2xl shadow-lg">
        <!-- Status message -->
        <div class="flex-shrink-0">
          <!-- Conditional rendering for subtitle -->
          <h2 v-if="page.title" class="text-2xl text-center rounded-2xl bg-primary border">
            The {{ page.title }} Room
          </h2>
          <h2 v-else class="text-2xl text-accent">🌈 Fetching details...</h2>
        </div>

        <!-- Image -->
        <div class="flex-shrink-0 rounded-2xl border p-2 m-2 bg-primary shadow-md">
          <img
            :src="`/images/${page.image}`"
            alt="Splash Image"
            class="object-contain w-full h-full rounded-2xl"
          />
        </div>

        <!-- Tooltip -->
        <div
          class="flex-grow flex items-start rounded-2xl border p-2 m-2 bg-primary overflow-y-auto shadow-md"
          style="max-height: calc(100% - 4rem)"
        >
          <streaming-tooltip :tooltip="page.tooltip" class="w-full" />
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer>
      <footer-toggle />
    </footer>
  </div>
</template>

<script setup lang="ts">
const { page } = useContent()
useContentHead(page)
</script>

<style scoped>
.main-content {
  scroll-snap-type: y mandatory;
}
.section {
  scroll-snap-align: start;
}
</style>
