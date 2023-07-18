<template>
  <header
    class="w-full flex items-center justify-between bg-base-100 py-1 px-2 md:px-4 h-16 md:h-20"
  >
    <!-- Left Section -->
    <div class="flex justify-start items-center space-x-2">
      <avatar-image class="w-20 h-20 p-2 rounded-full" />
    </div>

    <!-- Center Section -->
    <h2 class="text-2xl font-semibold mb-4">Kind Robots</h2>

    <!-- Right Section -->
    <div class="flex justify-end items-center space-x-2 flex-shrink-0">
      <icon-nav />
    </div>
  </header>
</template>
