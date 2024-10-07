<template>
  <div
    class="absolute inset-0 z-0 bg-gradient-to-br from-primary via-secondary to-base-100"
  ></div>
</template>

<script setup lang="ts">
// No additional logic needed, this is a pure background component
</script>

<style>
/* Ensuring the div takes full viewport size */
div {
  position: absolute;
  height: 100vh;
  width: 100vw;
}
</style>
