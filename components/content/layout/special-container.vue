<template>
  <div 
    class="special-container border-4 overflow-y-auto h-64 max-h-96 bg-gradient-to-b from-bg-primary to-bg-secondary rounded-lg p-4 
           transform transition-all duration-300 ease-in-out hover:scale-105 hover:rotate-1 hover:shadow-lg animate-pulse
           md:h-72 md:max-h-full lg:h-80 lg:max-h-screen"
  >
    <slot></slot>
  </div>
</template>

<script setup>
</script>

<style scoped>
</style>
