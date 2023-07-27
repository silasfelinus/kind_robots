<template>
  <div class="flex flex-col md:flex-row h-screen text-gray-800 bg-gray-200">
    <div class="w-full md:w-64 bg-white shadow-md p-4">
      <vertical-nav />
    </div>
    <div class="w-full md:flex-grow p-4 overflow-auto">
      <div class="mx-auto mb-8">
        <nuxt-link to="/welcome">
          <img src="/images/kindtitle.webp" class="mx-auto rounded" alt="Title" />
        </nuxt-link>
      </div>
      <div class="text-center center bg-base-100">
        <slot />
      </div>
    </div>
    <div class="fixed bottom-0 left-0 right-0 p-4 shadow-lg overflow-auto max-h-32">
      <!-- Any other common elements to all pages -->
    </div>
  </div>
</template>
