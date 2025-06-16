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

    </template>

    <!-- Center Column -->
    <template #center>
      
      <art-randomizer />
    </template>

    <!-- Right Column -->
    <template #right>
    
      <art-museum />>
    </template>

    <!-- Extra Content Below -->
    <template #extra>
      <art-display />
            <prompt-handler />
  <generate-button />
    </template>
  </art-grid>
</template>
