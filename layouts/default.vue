<template>
  <div class="flex flex-col md:flex-row h-screen text-gray-800 bg-gray-200">
    <!-- Left column: vertical nav -->
    <div
      class="md:w-1/5 h-full flex flex-col overflow-y-auto shadow-lg bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 rounded-r-xl"
    >
      <div class="flex-grow">
        <new-nav class="p-4" />
      </div>
    </div>
    <!-- Middle column: nuxt-page -->
    <main
      class="md:w-3/5 h-full flex flex-col bg-white shadow-inner rounded-l-xl transition-all duration-500 relative"
    >
      <slot />
    </main>
    <!-- Right column: title-image and status-notifier -->
    <div
      class="md:w-1/5 h-full flex flex-col bg-white shadow-inner rounded-l-xl transition-all duration-500 relative"
    >
      <div class="flex-grow p-4">
        <title-image
          class="block hover:text-white rounded-full shadow-lg hover:shadow-2xl transition-shadow duration-500"
        />
        <status-notifier
          class="bg-yellow-300 rounded-full shadow-lg hover:shadow-2xl transition-shadow duration-500"
        />
      </div>
    </div>
  </div>
</template>
