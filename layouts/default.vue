<!-- /layouts/default.vue -->
<template>
  <div class="relative w-full h-full overflow-hidden">
    <!-- Immersive Background Bleed (Right Side Stretch) -->
    <div class="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div class="absolute top-0 right-0 h-full">
        <image-background />
      </div>
    </div>

    <!-- Main App Slot Content (Header, Main, Splash, etc.) -->
    <main class="relative z-10">
      <slot />
    </main>
  </div>
</template>
