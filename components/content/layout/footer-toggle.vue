<!-- /components/layout/footer-toggle.vue -->
<template>
  <div
v-if="showToggle"
    
    class="fixed z-50 left-1/2 -translate-x-1/2"
    :style="toggleStyle"
  >
    <button class="btn btn-xs btn-circle" @click="displayStore.toggleFooter()">
      <Icon :name="iconName" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'

const displayStore = useDisplayStore()
const pageStore = usePageStore()

// Show toggle if the page supports a footer OR the footer is currently active or hidden but toggleable
const showToggle = computed(() => pageStore.page?.showFooter)

const iconName = computed(() =>
  displayStore.footerState === 'extended'
    ? 'kind-icon:chevron-double-down'
    : 'kind-icon:chevron-double-up'
)

const toggleStyle = computed(() => {
  const padding = displayStore.sectionPaddingSize
  const height = displayStore.footerHeight
  const isHidden = displayStore.footerState === 'hidden'

  // Add extra upward offset when hidden so it's not under the bottom chrome bar
  const offset = isHidden ? padding + 6 : height + padding

  return {
    top: `calc(100dvh - var(--vh) * ${offset})`,
  }
})

</script>
