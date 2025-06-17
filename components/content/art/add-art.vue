<template>
  <art-grid>
    <!-- Section Labels -->
    <template #label-left>🧠 Model</template>
    <template #label-center>📝 Prompt</template>
    <template #label-right>🏛️ Gallery</template>

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
      <collection-gallery />
    </template>

    <template #extra>
      <div class="relative w-full h-full flex flex-col p-4 pb-24">
        <!-- Prompt Handler grows to fill available space -->
        <prompt-handler class="flex-grow overflow-y-auto" />

        <!-- Generate Button fixed to bottom of this container -->
        <div class="absolute bottom-4 left-4 right-4 z-20">
          <generate-button />
        </div>
      </div>
    </template>

    <!-- Overlay -->
    <template #overlay>
      <art-display />
    </template>
  </art-grid>
</template>
