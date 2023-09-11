<template>
  <header
    class="flex flex-col items-center p-2 bg-base-400 rounded-2xl border-8 border-accent m-2 relative"
  >
    <div class="flex justify-between items-center w-full">
      <home-link />
      <layout-selector class="relative" />
      <h1 class="text-4xl text-default font-bold">Welcome to Kind Robots</h1>
      <theme-toggle />
      <butterfly-toggle class="mr-2" />
    </div>

    <div
      class="flex flex-col items-center justify-center bg-secondary p-2 rounded-2xl border-8 border-accent m-2 relative w-full"
    >
      <h1 v-if="page.title" class="text-4xl text-default font-bold">Location: {{ page.title }}</h1>
      <h1 v-else class="text-4xl text-default font-bold">Location: 🌀 Loading...</h1>
      <h2 v-if="page.subtitle" class="text-2xl text-default">
        {{ page.subtitle }}
      </h2>
      <h2 v-else class="text-2xl text-accent">🌈 Fetching details...</h2>
    </div>

    <div class="flex justify-center items-center m-2 relative w-full">
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
