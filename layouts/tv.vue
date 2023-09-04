<template>
  <div class="relative h-screen bg-primary overflow-hidden">
    <!-- Header -->
    <new-header class="absolute top-0 left-0 right-0 p-2 m-4" />
    <!-- Main Content -->
    <main
      class="relative left-0 right-0 flex flex-row p-2 m-4 bg-base-400 rounded-2xl border-8 border-accent"
    >
      <!-- Splash Image -->
      <div
        class="w-1/2 flex justify-center items-center p-2 m-4 bg-base-400 rounded-2xl border-8 border-accent"
      >
        <img
          :src="`/images/${page.image}`"
          alt="Splash Image"
          class="object-cover h-full w-full rounded-lg"
        />
      </div>
      <!-- Slot and Tooltip -->
      <div class="w-1/2 flex flex-col">
        <!-- Slot -->
        <div
          class="flex-1 flex justify-center items-center p-2 m-4 bg-base-400 rounded-2xl border-8 border-accent"
        >
          <slot />
        </div>
        <!-- Tooltip -->
        <div
          class="flex-1 flex justify-center items-center p-2 m-4 bg-base-400 rounded-2xl border-8 border-accent"
        >
          <streaming-tooltip :tooltip="page.tooltip" />
        </div>
      </div>
    </main>
    <!-- Footer -->
    <footer
      class="absolute bottom-0 left-0 right-0 flex justify-between items-center p-2 m-4 bg-base-400 rounded-2xl border-8 border-accent"
    >
      <home-nav />
    </footer>
  </div>
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
