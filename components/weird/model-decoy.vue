<!-- /components/content/weird/model-decoy.vue -->
<template>
  <div class="flex flex-col h-full bg-base-100 relative">
    <!-- Fixed Row Component -->
    <div class="fixed top-0 left-0 right-0 z-10 bg-base-100 shadow-md">
      <ModeRow />
    </div>

    <!-- Scrollable Selected View Component -->
    <div class="flex-grow mt-16 overflow-y-auto">
      <SelectedView />
    </div>
  </div>
</template>
