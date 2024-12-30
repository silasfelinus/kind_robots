<template>
  <div class="base-card-container">
    <div class="base-card">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
// No props or state for now, but you can add them later if needed
</script>

<style scoped>
.base-card-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.base-card {
  background-color: var(
    --bg-primary,
    rgba(255, 255, 255, 0.8)
  ); /* Using DaisyUI bg-primary */
  border: 2px solid var(--bg-accent, rgba(255, 255, 255, 0.2)); /* Using DaisyUI bg-accent for the border */
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 1rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  color: var(--text-color, black);
  max-width: 800px; /* Maximum width */
  text-align: center; /* Center the content */
  overflow: hidden;
}
</style>
