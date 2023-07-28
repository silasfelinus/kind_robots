<template>
  <div class="h-screen text-gray-800 bg-gray-200">
    <div class="w-full h-full overflow-y-auto shadow-lg bg-white p-4 rounded-r-xl">
      <div
        class="text-center bg-base-100 p-4 rounded-xl shadow-lg transform transition-transform hover:scale-105"
      >
        <slot />
      </div>
      <div
        class="absolute bottom-0 left-0 mb-4 ml-4 p-4 shadow-lg overflow-auto max-h-32 bg-white rounded-t-xl"
      >
        <div>
          <avatar-image />
        </div>
      </div>
    </div>
  </div>
</template>
