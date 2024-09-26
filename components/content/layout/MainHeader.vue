<template>
  <header
    class="sticky top-0 z-30 w-full bg-base-200 flex items-center justify-between"
    :style="{ height: `${displayStore.headerVh}vh` }"
  >
    <!-- Sidebar Toggle -->
    <div class="absolute top-2 left-4 p-1 z-40 text-white">
      <sidebar-toggle class="text-4xl" />
    </div>

    <!-- Navigation Links -->
    <nav-links class="flex-grow ml-16" />
    <!-- Added margin to avoid overlapping with the sidebar toggle -->

    <!-- Tutorial and Back Buttons -->
    <button
      v-if="displayStore.showTutorial"
      class="bg-info text-base-200 rounded-lg shadow-md hover:bg-info-focus transition duration-300 z-50 p-2 mr-4"
      @click="displayStore.toggleTutorial"
    >
      Launch
    </button>

    <button
      v-else
      class="bg-secondary text-base-200 rounded-lg shadow-md hover:bg-secondary-focus transition duration-300 z-50 p-2 mr-4"
      @click="displayStore.toggleTutorial"
    >
      Instructions
    </button>
  </header>
</template>
