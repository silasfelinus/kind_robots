<template>
  <div class="container mx-auto p-4 relative h-full flex flex-col">
    <!-- Main Content -->
    <div class="flex flex-col md:flex-row flex-grow">
      <!-- Bot Selector and Carousel: 1/3 of the screen on desktop -->
      <div class="w-full md:w-1/3 flex flex-col">
        <!-- Bot Carousel -->
        <div class="flex-grow rounded-2xl m-2 p-2 border bg-base-200">
          <bot-selector />
          <bot-carousel />
        </div>
      </div>

      <!-- Main Content for Kind Robot: Takes the remaining space -->
      <div class="flex-grow p-2 rounded-2xl m-2 border">
        <kind-robot />
      </div>
    </div>
  </div>
</template>
