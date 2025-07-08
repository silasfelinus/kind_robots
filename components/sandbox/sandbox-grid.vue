<!-- /components/content/sandbox/sandbox-grid.vue -->
<template>
  <div class="container mx-auto p-4 relative">
    <sandbox-environment class="absolute top-0 left-0 w-full flex justify-center z-10" />
    
    <div class="flex">
      <sandbox-persists class="w-24 flex-shrink-0 flex flex-col items-center z-10" />
      
      <div class="flex-grow relative">
        <canvas ref="canvasRef" class="w-full h-full border rounded-xl bg-base-200"></canvas>
        <sandbox-context class="absolute top-0 right-0 w-40 z-20" />
      </div>

      <!-- Optional filler or future tools -->
    </div>

    <sandbox-menu class="mt-4 w-full flex justify-center z-10" />
  </div>
</template>

<script setup lang="ts">
import SandboxEnvironment from './sandbox-environment.vue'
import SandboxMenu from './sandbox-menu.vue'
import SandboxPersists from './sandbox-persists.vue'
import SandboxContext from './sandbox-context.vue'
</script>