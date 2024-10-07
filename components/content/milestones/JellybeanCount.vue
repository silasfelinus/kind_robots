<template>
  <router-link
    to="/milestones"
    class="flex items-center space-x-2 no-underline text-current"
  >
    <!-- Always Show Jellybean Icon -->
    <Icon name="tdesign:bean" />

    <!-- Conditionally show the full text or just the count -->
    <div class="flex items-center text-primary">
      <span class="whitespace-nowrap mr-1"> {{ user?.mana || 0 }} /9 </span>
      <span class="hidden lg:inline">Jellybeans</span>
    </div>
  </router-link>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const userStore = useUserStore()
const user = computed(() => userStore.user)
</script>
<style scoped>
.router-link {
  text-decoration: none; /* Removes underline */
  color: inherit; /* Ensures it inherits the text color from its parent */
}
</style>
