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

const showToggle = computed(() => pageStore.page?.showFooter)

const iconName = computed(() =>
  displayStore.footerState === 'extended'
    ? 'kind-icon:chevron-double-down'
    : 'kind-icon:chevron-double-up',
)

const toggleStyle = computed(() => {
  const padding = displayStore.sectionPaddingSize
  const height = displayStore.footerHeight
  const isHidden = displayStore.footerState === 'hidden'

  const baseOffset = height + padding
  const adjustedOffset = isHidden ? baseOffset - 1 : baseOffset

  return {
    top: `calc(100dvh - var(--vh) * ${adjustedOffset})`,
  }
})
</script>
