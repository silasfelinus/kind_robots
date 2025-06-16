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

    <!-- Extra Section (bottom 20%) -->
    <template #extra>
      <prompt-handler />
      <generate-button />
    </template>

    <!-- Overlay (full-screen focus area) -->
    <template #overlay>
      <art-display />
    </template>
  </art-grid>
</template>
