<template>
  <div class="flex flex-col h-screen w-screen relative bg-gray-100">
    <!-- Toggle Navigation Button -->
    <button class="absolute top-[10vh] left-3 z-50" @click="toggleNav">
      <icon name="fluent:row-triple-20-filled" class="text-2xl text-primary" />
    </button>

    <!-- Header Dashboard -->
    <div class="flex w-full shadow-lg bg-white">
      <header-dashboard />
    </div>

    <!-- Messages Area (tutorial-cards) -->
    <div class="p-4">
      <dotti-cards />
    </div>
    <smart-links />

    <div class="flex-grow flex p-4">
      <!-- User Navigation -->
      <transition name="slide">
        <div
          v-if="isNavVisible"
          :class="{ 'w-[50%]': isLargeScreen, 'w-full': !isLargeScreen }"
          class="flex-none h-full overflow-y-auto transition-all duration-600 ease-in-out bg-base-200 rounded-lg shadow-lg"
          @click.stop
        >
          <navigation-trimmed class="rounded-2xl p-1 m-1" />
        </div>
      </transition>

      <!-- Main Slot -->
      <div
        class="flex-grow h-full overflow-y-auto bg-gray-100 rounded-lg shadow-lg"
      >
        <div class="h-full w-full border border-gray-300 rounded">
          <slot class="bg-grey-200 rounded-2xl p-4 m-4" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

const isNavVisible = ref(false);
const isLargeScreen = ref(false);

const toggleNav = () => {
  isNavVisible.value = !isNavVisible.value;
};

const handleResize = () => {
  isLargeScreen.value = window.innerWidth > 1024;
};

onMounted(() => {
  handleResize();
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<style>
.slide-enter-active,
.slide-leave-active {
  transition:
    opacity 0.5s,
    transform 0.5s;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}
</style>
