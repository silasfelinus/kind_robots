<template>
  <div :class="isCompact ? 'h-12' : 'h-24'">
    <!-- Room meta and user details -->
    <div class="flex flex-wrap items-center justify-between">
      <room-meta :class="isCompact ? 'text-sm' : 'text-lg'" />

      <!-- Single Toggle Button -->
      <icon
        name="game-icons:expand"
        :class="isCompact ? 'text-sm hidden md:inline-block' : 'text-lg hidden md:inline-block'"
        @click="toggleMinimize"
      />

      <div class="flex items-center space-x-4">
        <!-- Username and Logout Button -->
        <user-avatar :size="isCompact ? 'small' : 'large'" />
        <span :class="isCompact ? 'text-sm' : 'text-lg'">
          {{ user?.username || 'Kind Guest' }}
        </span>

        <!-- Jellybeans -->
        <div class="md:flex items-center" :class="isCompact ? 'hidden' : 'space-x-2'">
          <span>{{ jellybeans }}/ 9 Jellybeans Discovered</span>
        </div>
        <button
          v-if="isLoggedIn"
          :class="isCompact ? 'text-xs text-gray-400' : 'text-sm text-gray-500'"
          @click.stop="handleButtonClick"
        >
          Logout
        </button>
      </div>

      <!-- Toggles and Links -->
      <div class="flex items-center space-x-4" :class="isCompact ? 'hidden md:flex' : ''">
        <theme-toggle />
        <butterfly-toggle />
        <smart-links />
      </div>
    </div>

    <!-- Smart Links (Compact Mode) -->
    <div v-if="isCompact" class="mt-4">
      <smart-links />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { errorHandler } from '@/server/api/utils/error'
import { useToggleStore, ToggleableScreens, ScreenState } from '@/stores/toggleStore'

const userStore = useUserStore()
const jellybeans = computed(() => userStore.mana)
const user = computed(() => userStore.user)
const isLoggedIn = computed(() => userStore.isLoggedIn)

const toggleStore = useToggleStore()
const isCompact = ref(
  toggleStore.getScreenState(ToggleableScreens.USER_DASHBOARD) === ScreenState.COMPACT
)

onMounted(() => {
  toggleStore.loadFromLocalStorage()
  isCompact.value =
    toggleStore.getScreenState(ToggleableScreens.USER_DASHBOARD) === ScreenState.COMPACT
})

const toggleMinimize = () => {
  isCompact.value = !isCompact.value
  const newState = isCompact.value ? ScreenState.COMPACT : ScreenState.FULL
  toggleStore.setScreenState(ToggleableScreens.USER_DASHBOARD, newState)
}

const handleButtonClick = async () => {
  if (isLoggedIn.value) {
    try {
      await userStore.logout()
    } catch (error: any) {
      const errorResponse = errorHandler({
        error,
        message: 'Failed to logout. Please try again.'
      })
    }
  } else {
    // Handle login popup or redirect
  }
}
</script>
