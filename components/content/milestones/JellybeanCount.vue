<!-- /components/content/milestones/jellybean-count.vue -->
<template>
  <router-link
    to="/milestones"
    class="group flex flex-col items-center justify-center w-[80px] min-w-[72px] max-w-[90px] transition-all"
  >
    <Icon
      name="kind-icon:jellybean"
      class="h-8 w-8 md:w-10 md:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 transition-transform transform hover:scale-110 duration-300 ease-in-out"
    />
    <div
      v-if="!displayStore.bigMode"
      class="mt-2 text-center text-sm md:block hidden"
    >
      {{ beanCount || 0 }} /11
    </div>
  </router-link>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

// Stores
const displayStore = useDisplayStore()
const milestoneStore = useMilestoneStore()

// Computed properties
const beanCount = computed(() => milestoneStore.milestoneCountForUser)

// Check if viewport size is small
const isSmallDisplay = computed(() => displayStore.viewportSize === 'small')
</script>

<style scoped>
.router-link {
  text-decoration: none; /* Removes underline */
  color: inherit; /* Ensures it inherits the text color from its parent */
}
</style>
