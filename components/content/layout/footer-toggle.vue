<!-- /components/layout/footer-toggle.vue -->
<template>
  <div
    v-if="showFooter"
    class="fixed z-50 left-1/2 -translate-x-1/2 p-1"
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

const showFooter = pageStore.showFooter

const iconName = computed(() =>
  displayStore.footerState === 'extended'
    ? 'kind-icon:chevron-double-down'
    : 'kind-icon:chevron-double-up'
)

const toggleStyle = computed(() => ({
  top: `calc(100vh - var(--vh) * (${displayStore.footerHeight}))`,
}))
</script>
