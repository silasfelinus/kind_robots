<template>
  <router-link
    to="/milestones"
    class="flex flex-col items-center justify-center no-underline text-info w-full h-full"
  >
    <!-- Centered Jellybean Icon -->
    <Icon
      name="kind-icon:jellybean"
      class="h-8 w-8 md:w-10 md:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 transition-transform transform hover:scale-110 duration-300 ease-in-out"
    />

    <!-- Conditionally Show Jellybean Count -->
    <div v-if="!isSmallDisplay" class="mt-2 text-center">
      <span class="whitespace-nowrap"> {{ beanCount || 0 }} /11 </span>
    </div>
  </router-link>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

// Stores
const displayStore = useDisplayStore()
const milestoneStore = useMilestoneStore()
const userStore = useUserStore()

// Computed properties
const beanCount = computed(() =>
  milestoneStore.getMilestoneCountForUser(userStore.userId),
)

// Check if viewport size is small
const isSmallDisplay = computed(() => displayStore.viewportSize === 'small')
</script>

<style scoped>
.router-link {
  text-decoration: none; /* Removes underline */
  color: inherit; /* Ensures it inherits the text color from its parent */
}
</style>
