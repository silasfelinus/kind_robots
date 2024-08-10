<template>
  <div class="flex items-center space-x-2">
    <!-- Always Show Jellybean Icon -->
    <icon name="tdesign:bean" />

    <!-- Conditionally show the full text or just the count -->
    <div class="flex items-center">
      <span class="whitespace-nowrap mr-1"> {{ user?.mana || 0 }} /9 </span>
      <span class="hidden lg:inline">Jellybeans</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()
const user = computed(() => userStore.user)
</script>
