<template>
  <div
    class="flex flex-col md:flex-row h-screen text-gray-800 p-4 space-y-4 md:space-y-0 md:space-x-4"
  >
    <!-- Sidebar for navigation, profile info, etc. -->
    <AppSidebar class="w-full md:w-1/5 overflow-y-auto" />

    <!-- Main content area. This is where you insert content specific to the route or view. -->
    <div class="flex-grow overflow-y-auto">
      <slot />
    </div>
  </div>
</template>

<style scoped>
/* Ensure sidebar and main content scroll when content is too long. */
.overflow-y-auto {
  overflow-y: auto;
}
</style>
