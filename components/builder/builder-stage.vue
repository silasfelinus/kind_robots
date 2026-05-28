<!-- /components/builder/builder-stage.vue -->
<template>
  <div class="flex min-h-full flex-col gap-3">
    <builder-splash v-if="showSplash" />
    <builder-step-panel v-else-if="store.activeCard" />
    <builder-summary v-else-if="store.allComplete" />
    <builder-card-grid v-else />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBuilderStore } from '@/stores/builderStore'

const store = useBuilderStore()

const showSplash = computed(() => {
  return !store.activeCard && !store.completedCardList.length && !store.visibleCards.length
})
</script>
