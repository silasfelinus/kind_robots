<template>
  <div v-if="shouldDisplayTooltip" class="m-4 p-2 text-xl rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4">
    <!-- Tips Area -->
    <div v-if="page.tooltip || page.amitip" class="flex flex-col justify-center items-center md:flex-row gap-4">
      <!-- Silas Section -->
      <div v-if="page.tooltip" class="flex flex-col items-center bg-base-200 rounded-2xl p-4">
        <img src="/images/silasfelinus.webp" alt="Silas" class="rounded-full w-16 h-16 mb-2" />
        <div class="text-sm rounded-2xl border mb-2">silasfelinus</div>
        <div class="flex flex-col overflow-auto">
          {{ page.tooltip }}
        </div>
      </div>

      <!-- AMI Section -->
      <div v-if="page.amitip" class="flex flex-col items-center bg-base-200 rounded-2xl p-4">
        <img src="/images/amibotsquare1.webp" alt="AMI" class="rounded-full w-16 h-16 mb-2" />
        <div class="text-sm rounded-2xl border mb-2">AMIbot</div>
        <div class="flex flex-col overflow-auto">
          {{ page.amitip }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { usePageStore } from '@/stores/pageStore';

const { page } = useContent();
const pageStore = usePageStore();

const shouldDisplayTooltip = computed(() => {
  if (pageStore.showInfo) {
    return pageStore.showInfo;
  }
  return pageStore.showTooltip && (page.tooltip || page.amitip);
});
</script>

<style>
.pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
</style>
