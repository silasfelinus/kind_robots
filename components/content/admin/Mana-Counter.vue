<!-- Mana Counter Component -->
<template>
  <div class="flex items-center space-x-2">
    <Icon name="kind-icon:mana-potion" class="text-lg" />
    <span>{{ userStore?.mana }}</span>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from './../../../stores/userStore'

const userStore = useUserStore()
</script>
