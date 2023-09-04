<template>
  <header
    class="flex justify-between items-center p-2 bg-base-400 rounded-2xl border-8 border-accent m-4 relative"
  >
    <home-link />
    <h1>Welcome to Kind Robots</h1>
    <!-- Title and Subtitle -->
    <div class="flex flex-col items-center justify-center bg-primary p-2 rounded">
      <h1 class="text-4xl text-white font-bold">Location: {{ page.title }}</h1>
      <h2 class="text-2xl text-white">{{ page.subtitle }}</h2>
    </div>
    <!-- Theme Selector -->
    <div class="flex items-center justify-center w-16">
      <theme-toggle />
    </div>
    <!-- Butterfly Toggle -->
    <div class="flex items-center justify-center w-16">
      <butterfly-toggle />
    </div>
    <!-- Screen FX -->
    <div class="flex items-center justify-center">
      <screen-fx />
    </div>
  </header>
</template>
<script setup lang="ts">
const { page } = useContent()
useContentHead(page)
</script>

<style scoped>
/* Flip card transition */
.flip-card-enter-active,
.flip-card-leave-active {
  transition: transform 1s;
}
.flip-card-enter,
.flip-card-leave-to {
  transform: rotateY(180deg);
}
</style>
