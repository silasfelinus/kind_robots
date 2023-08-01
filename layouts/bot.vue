<template>
  <div class="h-screen text-gray-800 bg-gray-200 flex">
    <new-nav class="w-1/4 h-full" />
    <div class="w-3/4 h-full flex flex-col p-4">
      <div class="flex-grow overflow-y-auto shadow-lg bg-white p-4 rounded-r-xl">
        <div
          class="text-center bg-base-100 p-4 rounded-xl shadow-lg transform transition-transform hover:scale-105"
        ></div>
        <div class="flex justify-between items-start mt-4">
          <!-- Bot Display -->
          <div class="w-3/5">
            <!-- Your Bot Content Here -->
          </div>
          <!-- Title Image and Notification -->
          <div class="w-2/5">
            <title-image />
            <status-notifier />
          </div>
        </div>
      </div>
      <!-- Avatar Image Badge at the Bottom Left -->
      <div
        class="absolute bottom-0 left-0 mb-4 ml-4 p-4 shadow-lg overflow-auto max-h-32 bg-white rounded-t-xl"
      >
        <avatar-image />
      </div>
    </div>
  </div>
</template>
