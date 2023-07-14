<template>
  <header
    class="w-full flex items-center justify-between bg-primary py-1 px-2 md:px-4 h-16 md:h-20"
  >
    <!-- Left Section -->
    <div class="flex justify-start items-center space-x-2">
      <avatar-image class="w-20 h-20 rounded-full" />
    </div>

    <!-- Center Section -->
    <div class="flex justify-center items-center flex-grow">
      <bot-selector />
    </div>

    <!-- Right Section -->
    <div class="flex justify-end items-center space-x-2 flex-shrink-0">
      <theme-manager />
    </div>
  </header>
</template>
