<!-- Karma Tracker Component -->
<template>
  <div class="flex items-center space-x-2">
    <Icon name="game-icons:health-potion" class="text-lg" />
    <span>{{ karma }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '../stores/userStore'

const userStore = useUserStore()
const karma = ref(userStore.karma)

onMounted(() => {
  karma.value = userStore.karma
})
</script>
