<template>
  <div class="container mx-auto px-4">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Pitch Selector -->
      <div class="col-span-1 md:col-span-1 lg:col-span-1">
        <pitch-selector />
      </div>
      <!-- Add Pitch -->
      <div class="col-span-1 md:col-span-1 lg:col-span-1">
        <add-pitch />
      </div>
      <!-- Pitch Card -->
      <div class="col-span-1 md:col-span-1 lg:col-span-1">
        <pitch-card />
      </div>

      <!-- Pitch Gallery -->
      <div class="col-span-1 md:col-span-2 lg:col-span-2">
        <pitch-gallery />
      </div>

      <!-- Dream Generator -->
      <div class="col-span-1 md:col-span-1 lg:col-span-1">
        <dream-generator />
      </div>
    </div>
  </div>
</template>
