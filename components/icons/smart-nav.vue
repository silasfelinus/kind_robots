<!-- /components/content/icons/smart-nav.vue -->
<template>
  <div class="w-full flex flex-wrap justify-center gap-3 px-2">
    <button
      v-for="comp in componentList"
      :key="comp"
      class="px-4 py-2 bg-secondary text-black font-bold rounded-2xl border border-black hover:bg-accent transition"
      @click="() => displayStore.setMainComponent(comp)"
    >
      {{ formatLabel(comp) }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useDisplayStore } from '@/stores/displayStore'

defineProps<{ componentList: string[] }>()

const displayStore = useDisplayStore()

const formatLabel = (comp: string) =>
  comp.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
</script>
