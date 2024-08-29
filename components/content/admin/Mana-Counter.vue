<!-- Mana Counter Component -->
<template>
  <div class="flex items-center space-x-2">
    <Icon name="game-icons:standing-potion" class="text-lg" />
    <span>{{ userStore?.mana }}</span>
  </div>
</template>

<script setup>
import { useUserStore } from '../stores/userStore'

const userStore = useUserStore()
</script>
