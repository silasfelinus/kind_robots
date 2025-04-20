<!-- /layouts/default.vue -->
<template>
  <div class="relative w-full h-full overflow-hidden">
    <image-background />

    <!-- Main App Slot Content (Header, Main, Splash, etc.) -->
    <main class="relative z-10">
      <slot />
    </main>
  </div>
</template>
