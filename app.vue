<template>
  <!-- Store Debug Overlay in its own parent container -->
  <div
    class="debug-overlay-container absolute inset-0 pointer-events-none z-50"
  >
    <store-debug class="h-full w-full" />
  </div>
</template>
<style>
/* Debug Overlay Container */
.debug-overlay-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none; /* Ensures this overlay doesn’t block interactions */
  z-index: 50; /* Stays above the main content but doesn’t interfere */
}
</style>
