<template>
  <router-link
    to="/milestones"
    class="flex items-center space-x-2 no-underline text-current h-8 w-8 md:w-10 md:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 transition-transform transform hover:scale-110 duration-300 ease-in-out"
  >
    <!-- Always Show Jellybean Icon -->
    <Icon name="kind-icon:jellybean" />

    <!-- Conditionally show the full text or just the count -->
    <div class="flex items-center">
      <span class="whitespace-nowrap mr-1"> {{ beanCount || 0 }} /9 </span>
    </div>
  </router-link>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const milestoneStore = useMilestoneStore()
const userStore = useUserStore()

const beanCount = computed(() =>
  milestoneStore.getMilestoneCountForUser(userStore.userId),
)
</script>
<style scoped>
.router-link {
  text-decoration: none; /* Removes underline */
  color: inherit; /* Ensures it inherits the text color from its parent */
}
</style>
