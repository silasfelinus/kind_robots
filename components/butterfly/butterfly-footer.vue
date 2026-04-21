<!-- /components/navigation/footer/butterfly-footer.vue -->
<template>
  <div class="flex items-center gap-4 px-4 py-2 bg-base-300 rounded-2xl">
    <button
      class="btn btn-sm btn-primary"
      @click="butterflyStore.addButterfly()"
    >
      ➕
    </button>

    <button
      class="btn btn-sm btn-secondary"
      @click="butterflyStore.removeLastButterfly()"
    >
      ➖
    </button>

    <input
      type="range"
      min="0"
      max="100"
      v-model="count"
      class="range range-xs w-32"
    />

    <span class="text-sm"> 🦋 {{ butterflyStore.getButterflyCount }} </span>

    <button class="btn btn-xs" @click="butterflyStore.clearButterflies()">
      clear
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useButterflyStore } from '@/stores/butterflyStore'

const butterflyStore = useButterflyStore()

const count = computed({
  get: () => butterflyStore.targetCount,
  set: (val: number) => (butterflyStore.targetCount = val),
})

watch(
  () => butterflyStore.targetCount,
  () => {
    butterflyStore.syncButterflyCount()
  },
)
</script>
