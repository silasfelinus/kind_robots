<!-- /components/content/hybrid/hybrid-overlay.vue -->
<template>
  <Transition name="fade-overlay">
    <div
      v-if="show"
      class="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center"
      @click.self="close"
    >
      <div
        class="bg-base-100 rounded-2xl shadow-xl p-6 max-w-md w-full text-center space-y-4"
      >
        <h2 class="text-xl font-bold text-primary">🎉 Hybrid Milestone!</h2>
        <p class="text-sm text-base-content/70">
          You've created <strong>{{ store.history.length }}</strong> hybrids!
          Keep going and unlock even more strange creatures...
        </p>
        <div v-if="store.hybridName" class="italic text-accent">
          Current hybrid: {{ store.hybridName }}
        </div>
        <button class="btn btn-sm btn-primary mt-2" @click="close">
          ✅ Got it!
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useHybridStore } from '@/stores/hybridStore'

const store = useHybridStore()
const show = ref(false)

watch(
  () => store.history.length,
  (val) => {
    if (val === 10 || val === 25 || val === 50) show.value = true
  },
)

function close() {
  show.value = false
}
</script>

<style scoped>
.fade-overlay-enter-active,
.fade-overlay-leave-active {
  transition: opacity 0.3s ease;
}
.fade-overlay-enter-from,
.fade-overlay-leave-to {
  opacity: 0;
}
</style>
