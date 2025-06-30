<!-- /components/content/icons/jellybean-icon.vue -->
<template>
  <router-link
    to="/milestones"
    class="w-full h-full flex items-center justify-center transition-transform hover:scale-110"
  >
    <Icon
      name="kind-icon:jellybean"
      class="w-full h-full"
    />
  </router-link>
</template>

<script setup lang="ts">
// /components/content/icons/jellybean-icon.vue
import { computed } from 'vue'
import { useMilestoneStore } from '@/stores/milestoneStore'

const milestoneStore = useMilestoneStore()

const navLabel = computed(() => {
  const count = milestoneStore.milestoneCountForUser || 0
  return `${count} /11`
})

defineExpose({ navLabel })
</script>
