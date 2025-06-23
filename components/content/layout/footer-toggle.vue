<!-- /components/layout/footer-toggle.vue -->
<template>
  <div
    v-if="showFooter"
    class="fixed z-50 top-0 left-1/2 -translate-x-1/2 p-1"
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

const showFooter = computed(() => pageStore.page?.showFooter)

const iconName = computed(() =>
  displayStore.footerState === 'extended'
    ? 'kind-icon:chevron-double-down'
    : 'kind-icon:chevron-double-up'
)


</script>

