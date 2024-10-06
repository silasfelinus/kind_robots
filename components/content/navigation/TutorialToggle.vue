<template>
  <div class="relative h-full w-full">
    <!-- Other Main Content -->

    <!-- Tutorial Toggle: Centered at the bottom of the main content -->
    <div
      class="flex justify-center items-center w-full"
      :style="{ paddingBottom: footerHeight }"
    >
      <div
        class="bg-primary hover:bg-accent transition duration-300 cursor-pointer rounded-lg shadow-md p-2 flex items-center justify-center"
        @click="toggleTutorial"
      >
        <Icon
          v-if="showTutorial"
          name="mdi-information-outline"
          class="text-base-200 w-6 h-6"
        />
        <Icon
          v-else
          :name="pageIcon"
          class="text-base-200 w-6 h-6"
        />
      </div>
    </div>
  </div>
</template>



<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'


// Access the display store
const displayStore = useDisplayStore()

// Access the content, including page.icon
const { page } = useContent()

// Footer height from displayStore
const footerHeight = computed(() => displayStore.footerHeight)

// Compute the tutorial and icon state
const showTutorial = computed(() => displayStore.showTutorial)

// Toggle the tutorial state
const toggleTutorial = () => {
  displayStore.toggleTutorial()
}

// Use a computed value to get the page icon from useContent
const pageIcon = computed(() => page.icon || 'mdi-page-layout-sidebar-right')
</script>

<style scoped>
div {
  display: inline-block;
  position: absolute;
}
</style>
