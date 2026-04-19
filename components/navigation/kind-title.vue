<!-- /components/navigation/kind-title.vue -->
<template>
  <div
    class="inline-flex items-center gap-2 min-w-0 border-black shadow-[0_3px_0_rgba(0,0,0,0.6)]"
  >
    <span
      class="flex shrink-0 items-center justify-center rounded-full bg-black px-2.5 py-px text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-base-100 sm:text-[0.7rem]"
    >
      Kind
    </span>

    <span
      class="truncate text-[clamp(1rem,2.1vw,1.5rem)] font-semibold leading-tight tracking-tight"
    >
      {{ title }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePageStore } from '@/stores/pageStore'
import { useRoute } from 'vue-router'

const route = useRoute()
const pageStore = usePageStore()

const title = computed(() => {
  return (
    pageStore.page?.title ||
    (typeof route.meta?.title === 'string' ? route.meta.title : '') ||
    'Robots'
  )
})
</script>
