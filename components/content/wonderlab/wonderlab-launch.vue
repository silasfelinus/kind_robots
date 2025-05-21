<!-- /components/content/wonderlab/wonderlab-launch.vue -->
<template>
  <div
    class="w-full max-w-4xl mx-auto bg-base-200 border border-base-300 rounded-2xl px-6 py-5 text-center shadow-md flex flex-col items-center gap-4"
  >
    <div
      class="text-xl sm:text-2xl font-bold tracking-tight text-primary-content"
    >
      ✨ Welcome to the WonderLab
    </div>
    <div class="text-base-content text-sm sm:text-md">
      Where components come alive—and sometimes crash gloriously.
    </div>
    <div
      class="flex flex-col items-center bg-base-100 border border-dashed border-accent p-4 rounded-xl w-full max-w-md"
    >
      <p class="font-mono text-base sm:text-lg text-accent mb-1">
        🗃️ Total Components in Database:
      </p>
      <p class="text-4xl sm:text-5xl font-bold text-secondary font-mono">
        {{ componentCount }}
      </p>
      <component-sync v-if="isAdmin" class="mt-4" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useComponentStore } from '@/stores/componentStore'
import { useUserStore } from '@/stores/userStore'

const componentStore = useComponentStore()
const userStore = useUserStore()

const componentCount = computed(() => componentStore.allComponents.length)
const isAdmin = computed(() => userStore.isAdmin)
</script>
