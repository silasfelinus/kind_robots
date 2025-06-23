<!-- /components/layout/footer-toggle.vue -->
<template>
  <div class="fixed z-50 top-0 left-1/2 -translate-x-1/2 p-1" :style="toggleStyle">
    <button class="btn btn-xs btn-circle" @click="displayStore.toggleFooter()">
      <Icon
        :name="iconName"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const iconName = computed(() =>
  displayStore.footerState === 'extended'
    ? 'kind-icon:chevron-double-down'
    : 'kind-icon:chevron-double-up'
)

const toggleStyle = computed(() => ({
  top: `calc(var(--vh) * (${displayStore.footerStyle?.top?.replace('calc(var(--vh) * ', '').replace(')', '') ?? '90'} - 1))`,
}))
</script>
