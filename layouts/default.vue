<template>
  <div class="flex flex-col h-screen overflow-hidden p-2 bg-base-200">
    <!-- Header -->
    <header
      class="flex justify-between items-center bg-accent rounded-2xl border p-2 relative shadow-lg"
    >
      <home-link />
      <layout-selector class="relative" />
      <!-- Butterfly Toggle -->
      <div class="flex items-center justify-center m-2">
        <butterfly-toggle />
      </div>
      <!-- Title and Subtitle -->
      <h1 class="text-4xl text-default font-bold">Kind Robots</h1>
      <div class="flex flex-col items-center justify-center p-2 m-2 relative">
        <!-- Conditional rendering for title -->
        <h1 v-if="page.subtitle" class="text-4xl text-default font-bold">{{ page.subtitle }}</h1>
        <h1 v-else class="text-4xl text-default font-bold">Location: 🌀 Loading...</h1>
      </div>
      <!-- Theme Selector -->
      <div class="flex items-center justify-center relative">
        <theme-toggle />
      </div>

      <!-- Screen FX -->
      <div class="flex items-center justify-center relative">
        <screen-fx />
      </div>
    </header>

    <!-- Main Content -->
    <main class="h-[calc(100vh-2rem-32px)] overflow-hidden flex items-center">
      <!-- Slot -->
      <div
        class="flex-grow flex flex-col items-center h-[calc(100%-16px)] max-h-[calc(100vh-2rem-32px-16px)] overflow-y-auto p-2 m-2 rounded-2xl border bg-primary shadow-lg"
      >
        <slot />
      </div>

      <!-- Image and Tooltip Wrapper -->
      <div class="flex flex-col w-1/5 h-full bg-base-200">
        <!-- Splash Image -->

        <div class="flex-3 flex items-center rounded-2xl border bg-primary p-2 m-2 shadow-md">
          <!-- Status message -->
          <!-- Conditional rendering for subtitle -->
          <h2 v-if="page.title" class="text-2xl text-default text-center">
            The {{ page.title }} Room
          </h2>
          <h2 v-else class="text-2xl text-accent">🌈 Fetching details...</h2>
        </div>

        <div class="flex-3 flex items-center rounded-2xl border bg-primary p-2 m-2 shadow-md">
          <img
            :src="`/images/${page.image}`"
            alt="Splash Image"
            class="object-contain h-full w-full rounded-2xl"
          />
        </div>

        <div
          class="flex-3 flex items-start justify-start rounded-2xl p-2 m-2 border bg-primary overflow-y-auto shadow-md"
          style="max-height: calc(100% - 4rem)"
        >
          <streaming-tooltip :tooltip="page.tooltip" class="w-full" />
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="p-2 m-2 rounded-2xl border bg-primary shadow-lg">
      <sort-nav />
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
