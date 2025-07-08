<!-- /components/content/sandbox/sandbox-grid.vue -->
<template>
  <div class="container mx-auto p-4 relative">
    <!-- Top menu with padding -->
    <sandbox-environment class="w-full flex justify-center pt-3 pb-2 z-10" />

    <div class="flex min-h-[calc(100dvh-6rem)]">
      <!-- Left sidebar -->
      <div
        class="w-20 flex-shrink-0 flex flex-col pt-6 overflow-y-auto max-h-[calc(100dvh-8rem)] z-10"
      >
        <sandbox-persists />
      </div>

      <!-- Canvas area -->
      <div class="flex-grow relative">
        <canvas
          ref="canvasRef"
          class="w-full h-full border rounded-xl bg-base-200"
        />

        <!-- Right sidebar (floating) -->
        <div
          class="absolute top-12 right-0 w-40 max-h-[calc(100dvh-10rem)] overflow-y-auto z-20"
        >
          <sandbox-context />
        </div>
      </div>
    </div>

    <!-- Bottom menu -->
    <div class="mt-4 w-full flex justify-center z-10">
      <sandbox-menu />
    </div>
  </div>
</template>
