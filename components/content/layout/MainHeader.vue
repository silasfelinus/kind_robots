<template>
  <header
    class="w-full bg-base-200 items-center justify-between"
    :style="{ height: `${displayStore.headerVh}vh` }"
  >
    <!-- Sidebar Toggle -->
    <div class="p-1 z-40 text-white ml-2">
      <sidebar-toggle class="text-4xl" />
    </div>

    <!-- Navigation Links -->
    <nav-links class="flex-grow" />
    <!-- Added margin to avoid overlapping with the sidebar toggle -->

    <!-- Tutorial and Back Buttons -->
    <button
      v-if="displayStore.showTutorial"
      class="bg-info text-base-200 rounded-lg shadow-md hover:bg-info-focus transition duration-300 z-50 p-1 mr-2"
      @click="displayStore.toggleTutorial"
    >
      Launch
    </button>

    <button
      v-else
      class="bg-secondary text-base-200 rounded-lg shadow-md hover:bg-secondary-focus transition duration-300 z-50 p-1 mr-2"
      @click="displayStore.toggleTutorial"
    >
      Instructions
    </button>
  </header>
</template>
