<!-- /components/layout/footer-toggle.vue -->
<template>
  <div
    v-if="showFooter"
    class="fixed z-50 top-0 left-1/2 -translate-x-1/2 p-1"
    :style="toggleStyle"
  >
    <button class="btn btn-xs btn-circle" @click="displayStore.toggleFooter()">
      <Icon :name="iconName" />
    </button>
  </div>
</template>

<script setup lang="ts">
// /components/layout/footer-toggle.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'

const displayStore = useDisplayStore()
const pageStore = usePageStore()

const showFooter = computed(() => pageStore.page?.showFooter === true)

const iconName = computed(() =>
  displayStore.footerState === 'extended'
    ? 'kind-icon:chevron-double-down'
    : 'kind-icon:chevron-double-up'
)

const toggleTop = computed(() => {
  const topRaw = displayStore.footerStyle?.top
  if (!topRaw?.includes('calc')) return '90'
  const match = topRaw.match(/var\(--vh\)\s*\*\s*(\d+(\.\d+)?)/)
  return match?.[1] ?? '90'
})

const toggleStyle = computed(() => ({
  top: `calc(var(--vh) * (${toggleTop.value} - 1))`,
}))
</script>

