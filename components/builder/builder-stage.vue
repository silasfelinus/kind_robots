<!-- /components/builder/builder-stage.vue -->
<template>
  <div class="flex min-h-0 flex-col gap-3">
    <art-builder v-if="isArtStage" purpose="builder" />

    <!-- only run the guided flow when a real builder is active -->
    <template v-else-if="isBuilderActive">
      <builder-splash v-if="showSplash" />
      <builder-step-panel v-else-if="store.activeCard" />
      <builder-summary v-else-if="store.allComplete" />
      <builder-card-grid v-else />
    </template>

    <!-- not a builder surface: render whatever the manager slotted -->
    <slot v-else />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBuilderStore } from '@/stores/builderStore'

const store = useBuilderStore()

const isArtStage = computed(() => store.activeConfig.modelType === 'art')

// A real builder flow is active when the active config is a registered model
// builder (not the empty 'builder' default) and it has cards to work.
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
