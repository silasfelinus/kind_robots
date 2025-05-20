<!-- /components/content/tooltips/chat-tips.vue -->
<template>
  <div
    v-if="tooltip || amitip"
    class="flex flex-col justify-center items-center md:flex-row gap-4"
  >
    <!-- Silas Tooltip -->
    <div
      v-if="tooltip"
      class="flex flex-col items-center bg-base-300 rounded-2xl p-4"
    >
      <img
        src="/images/silasfelinus.webp"
        alt="Silas"
        class="rounded-full w-16 h-16 mb-2"
      />
      <div class="text-sm rounded-2xl border mb-2">silasfelinus</div>
      <div class="flex flex-col overflow-auto">
        {{ tooltip }}
      </div>
    </div>

    <!-- AMI Tip -->
    <div
      v-if="amitip"
      class="flex flex-col items-center bg-base-300 rounded-2xl p-4"
    >
      <img
        src="/images/amibotsquare1.webp"
        alt="AMI"
        class="rounded-full w-16 h-16 mb-2"
      />
      <div class="text-sm rounded-2xl border mb-2">AMIbot</div>
      <div class="flex flex-col overflow-auto">
        {{ amitip }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()
const { tooltip, amitip } = storeToRefs(pageStore)
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
