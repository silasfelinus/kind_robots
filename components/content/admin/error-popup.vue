<!-- /components/content/global/error-popup.vue -->
<template>
  <transition name="fade">
    <div
      v-if="visible"
      class="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md shadow-lg border rounded-xl overflow-hidden bg-base-100"
    >
      <!-- Header with type -->
      <div
        class="flex items-center justify-between px-4 py-2 font-bold text-white"
        :class="typeClass"
      >
        <span>{{ errorStore.type }}</span>
        <button
          class="btn btn-xs btn-circle btn-ghost text-white"
          @click="dismiss"
        >
          ✕
        </button>
      </div>

      <!-- Message -->
      <div class="px-4 py-3 text-sm text-base-content bg-base-100">
        {{ errorStore.message }}
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { watch, ref, onMounted } from 'vue'
import { useErrorStore } from '@/stores/errorStore'

const errorStore = useErrorStore()
const visible = ref(false)
let timeout: ReturnType<typeof setTimeout> | null = null

function dismiss() {
  visible.value = false
  errorStore.clearError()
  if (timeout) clearTimeout(timeout)
}

const typeClass = computed(() => {
  switch (errorStore.type) {
    case 'Network Error':
      return 'bg-red-600'
    case 'Validation Error':
      return 'bg-yellow-500'
    case 'Authentication Error':
      return 'bg-orange-600'
    case 'Parse Error':
    case 'Store Error':
      return 'bg-purple-600'
    case 'Interaction Error':
      return 'bg-pink-600'
    default:
      return 'bg-gray-800'
  }
})

watch(
  () => errorStore.message,
  (msg) => {
    if (msg) {
      visible.value = true
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(dismiss, 6000)
    }
  },
)

onMounted(() => {
  if (errorStore.message) {
    visible.value = true
    timeout = setTimeout(dismiss, 6000)
  }
})
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
