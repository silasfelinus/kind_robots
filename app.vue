<template>
  <!-- ami-loader initially visible and fades out -->
  <ami-loader v-if="isLoading" />

  <!-- Main Layout -->
  <div
    v-else
    class="flex flex-col h-screen w-screen p-1 m-1 border rounded-2xl"
  >
    <!-- Header with controlled sizing and visibility -->
    <header-upgrade class="flex-shrink-0 border rounded-2xl p-1 m-1" />

    <div class="flex flex-grow overflow-hidden">
      <!-- Left Sidebar -->
      <kind-sidebar
        class="border rounded-2xl flex-shrink-0 p-1 m-1"
        :class="isLeftSidebarCollapsed ? 'w-16' : 'w-64'"
        @toggle="toggleLeftSidebar"
      />

      <!-- Main Content -->
      <nuxt-page class="flex-grow p-1 m-1 border rounded-2xl overflow-auto" />

      <!-- Right Sidebar -->
      <kind-sidebar
        class="border rounded-2xl flex-shrink-0 p-1 m-1"
        :class="isRightSidebarCollapsed ? 'w-16' : 'w-64'"
        @toggle="toggleRightSidebar"
      />
    </div>

    <!-- Lower Navigation -->
    <trimmed-nav class="flex-shrink-0 border rounded-2xl p-1 m-1" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import { useUserStore } from '@/stores/userStore'
import { useArtStore } from '@/stores/artStore'
import { useThemeStore } from '@/stores/themeStore'
import { useBotStore } from '@/stores/botStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useDisplayStore } from '@/stores/displayStore'
import KindSidebar from '@/components/content/layout/KindSidebar.vue'

const errorStore = useErrorStore()
const userStore = useUserStore()
const artStore = useArtStore()
const themeStore = useThemeStore()
const botStore = useBotStore()
const milestoneStore = useMilestoneStore()
const displayStore = useDisplayStore()

const isLoading = ref(true)
const isLeftSidebarCollapsed = ref(false)
const isRightSidebarCollapsed = ref(false)

// Toggle logic for sidebars
const toggleLeftSidebar = () => {
  isLeftSidebarCollapsed.value = !isLeftSidebarCollapsed.value
}
const toggleRightSidebar = () => {
  isRightSidebarCollapsed.value = !isRightSidebarCollapsed.value
}



onMounted(async () => {
  try {
    await botStore.loadStore()
    console.log('loading user')
    await userStore.initializeUser()
    console.log('user loaded')
    await artStore.init()
    await themeStore.initTheme()
    await milestoneStore.initializeMilestones()
    console.log('Initialization complete.')
  } catch (error) {
    errorStore.setError(
      ErrorType.UNKNOWN_ERROR,
      `Initialization failed: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
})
</script>
<style scoped>
/* Ensure no content exceeds screen boundaries */
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

h-screen {
  height: 100vh;
}
w-screen {
  width: 100vw;
}
</style>
