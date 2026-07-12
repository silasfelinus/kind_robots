<!-- /components/content/icons/jellybean-icon.vue -->
<template>
  <router-link
    to="/achievements"
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
import { useAchievementStore } from '@/stores/achievementStore'

const achievementStore = useAchievementStore()

const navLabel = computed(() => {
  const count = achievementStore.achievementCountForUser || 0
  return `${count} /11`
})

defineExpose({ navLabel })
</script>
