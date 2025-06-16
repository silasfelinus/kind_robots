<!-- /components/content/art/add-art.vue -->
<template>
  <art-grid>
    <!-- Title -->
    <template #title>
      <h1 class="text-3xl font-bold text-primary">
        🎨 Welcome to the Art-Maker
      </h1>
    </template>

    <!-- Left Section -->
    <template #left>
      <checkpoint-gallery />
    </template>

    <!-- Center Section -->
    <template #center>
      <art-randomizer />
    </template>

    <!-- Right Section -->
    <template #right>
      <art-museum />
    </template>

<template #extra>
  <div class="relative w-full h-full flex flex-col justify-end gap-4 p-4 pb-20">
    <prompt-handler class="flex-grow" />
    <div class="fixed bottom-4 left-0 right-0 z-40 px-4 flex justify-center pointer-events-none">
      <div class="pointer-events-auto">
        <generate-button />
      </div>
    </div>
  </div>
</template>


    <!-- Overlay (full-screen focus area) -->
    <template #overlay>
      <art-display />
    </template>
  </art-grid>
</template>
