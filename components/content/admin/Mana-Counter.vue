<!-- Mana Counter Component -->
<template>
  <div class="flex items-center space-x-2">
    <icon name="game-icons:standing-potion" class="text-lg" />
    <span>{{ user?.mana }}</span>
  </div>
</template>

<script setup>
import { useUserStore } from '../stores/userStore'

const userStore = useUserStore()
</script>
