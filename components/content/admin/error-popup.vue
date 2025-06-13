<!-- /components/content/global/error-popup.vue -->
<template>
  <transition name="fade">
    <div
      v-if="errorStore.message"
      class="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-error text-error-content border border-error-content rounded-xl shadow-lg px-4 py-3 w-full max-w-sm"
    >
      <div class="flex justify-between items-center gap-2">
        <span class="font-semibold break-words flex-1">
          {{ errorStore.message }}
        </span>
        <button
          class="btn btn-xs btn-circle btn-outline text-error-content"
          @click="errorStore.clearError"
        >
          ✕
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
// /components/content/global/error-popup.vue
import { useErrorStore } from '@/stores/errorStore'
const errorStore = useErrorStore()
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
