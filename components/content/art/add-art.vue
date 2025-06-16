<!-- /components/content/art/add-art.vue -->
<template>
  <art-grid>
    <!-- Title -->
    <template #title>
      <h1 class="text-3xl font-bold text-primary">
        🎨 Welcome to the Art-Maker
      </h1>
    </template>

    <!-- Left Column -->
    <template #left>
      <checkpoint-gallery />
      <collection-handler />
    </template>

    <!-- Center Column -->
    <template #center>
      <prompt-handler />
      <art-randomizer />
    </template>

    <!-- Right Column -->
    <template #right>
      <generate-button />
      <art-museum />>
    </template>

    <!-- Extra Content Below -->
    <template #extra>
      <art-display />
    </template>
  </art-grid>
</template>
