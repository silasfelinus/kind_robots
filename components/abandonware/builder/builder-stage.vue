<template>
  <div class="flex h-full min-h-0 flex-1 flex-col gap-3 overflow-hidden">
    <art-builder v-if="isArtStage" purpose="builder" />

    <template v-else-if="isBuilderActive">
      <builder-splash v-if="showSplash" />
      <builder-step-panel v-else-if="store.activeCard" />
      <builder-summary v-else-if="store.allComplete" />
      <builder-card-grid v-else />
    </template>

    <slot v-else />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBuilderStore } from '@/stores/builderStore'

const store = useBuilderStore()

const isArtStage = computed(() => store.activeConfig.modelType === 'art')

const isBuilderActive = computed(() => {
  const t = store.activeConfig.modelType
  return t !== 'builder' && store.cards.length > 0
})

const showSplash = computed(() => {
  return (
    !store.activeCard &&
    !store.completedCardList.length &&
    !store.visibleCards.length
  )
})
</script>
