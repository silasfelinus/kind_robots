<template>
  <art-grid>
    <!-- Section Labels -->
    <template #label-left>🧠 Model</template>
    <template #label-center>📝 Prompt</template>
    <template #label-right>🏛️ Gallery</template>

    <!-- Title -->
    <template #title>
      <h1 class="text-3xl font-bold text-primary">🎨 Art-Maker</h1>
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
      <collection-gallery />
    </template>



    <!-- Overlay -->
    <template #overlay>
      <art-display />
    </template>
  </art-grid>
</template>
