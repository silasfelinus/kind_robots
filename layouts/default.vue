<template>
  <div class="flex flex-col h-screen bg-base-200 overflow-hidden">
    <!-- Header -->
    <new-header class="p-2 mx-4 my-2 rounded-2xl border-8 border-accent bg-primary" />
    <!-- Main Content -->
    <main class="flex flex-row h-[calc(100vh - 2rem - 32px)] overflow-hidden mx-4 my-2 bg-base-200">
      <!-- Added bg-primary, rounded and border -->
      <!-- Slot -->
      <div
        class="flex-grow flex h-[calc(100% - 16px)] max-h-[calc(100vh - 2rem - 32px - 16px)] overflow-y-auto p-2 m-4 bg-primary rounded-2xl border-8 border-accent"
      >
        <div class="w-full p-4">
          <slot />
        </div>
      </div>
      <!-- Image and Tooltip Wrapper -->
      <div class="flex-none w-1/3 flex flex-col h-full bg-base-200">
        <!-- Added bg-primary -->
        <!-- Splash Image -->
        <div
          class="h-2/3 flex items-center justify-center p-2 m-4 bg-primary rounded-2xl border-8 border-accent"
        >
          <img
            :src="`/images/${page.image}`"
            alt="Splash Image"
            class="object-contain h-full w-full rounded-lg"
          />
        </div>
        <!-- Tooltip -->
        <div
          class="h-1/3 flex items-center justify-center p-2 m-4 bg-primary rounded-2xl border-8 border-accent"
        >
          <streaming-tooltip :tooltip="page.tooltip" />
        </div>
      </div>
    </main>
    <!-- Footer -->
    <footer
      class="flex-none flex justify-between items-center p-2 mx-4 my-2 bg-base-400 rounded-2xl border-8 border-accent bg-primary"
    >
      <home-nav />
    </footer>
  </div>
</template>

<script setup lang="ts">
// Importing the content store
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
/* Hide scrollbar */
::-webkit-scrollbar {
  display: none;
}

/* Add this to your global styles */
.main-content {
  scroll-snap-type: y mandatory;
}

.section {
  scroll-snap-align: start;
}
</style>
