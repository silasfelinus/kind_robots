<template>
  <header :class="headerClass">
    <user-avatar :size="avatarSize" class="avatar" @click="toggleMinimize" />
    <div class="flex flex-col w-full">
      <div class="info-section">
        <span class="username">{{ username }}</span>
        <span v-if="!isCompact" class="jellybeans">{{ jellybeansInfo }}</span>
        <button
          v-if="isLoggedIn"
          class="logout-button"
          @click.stop="handleLogout"
        >
          Logout
        </button>
      </div>
      <div class="toggle-section">
        <theme-toggle />
        <butterfly-toggle />
      </div>
    </div>
  </header>
  <room-meta />
  <smart-links />
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from './../../../stores/userStore'
import { useErrorStore } from './../../../stores/errorStore'
import {
  useToggleStore,
  ToggleableScreens,
  ScreenState,
} from './../../../stores/toggleStore'

// User Store
const userStore = useUserStore()
const jellybeans = computed(() => userStore.mana)
const user = computed(() => userStore.user)
const isLoggedIn = computed(() => userStore.isLoggedIn)

// Error Store
const errorStore = useErrorStore()

// Toggle Store
const toggleStore = useToggleStore()
const isCompact = ref(
  toggleStore.getScreenState(ToggleableScreens.USER_DASHBOARD) ===
    ScreenState.COMPACT,
)

// On Mounted
onMounted(() => {
  toggleStore.loadFromLocalStorage()
  isCompact.value =
    toggleStore.getScreenState(ToggleableScreens.USER_DASHBOARD) ===
    ScreenState.COMPACT
})

// Computed
const headerClass = computed(() =>
  isCompact.value
    ? 'flex flex-row items-center bg-base-200 m-1'
    : 'flex flex-col bg-base-200 m-1',
)
const avatarSize = computed(() => (isCompact.value ? 'small' : 'large'))
const username = computed(() => user.value?.username || 'Kind Guest')
const jellybeansInfo = computed(
  () => `${jellybeans.value}/ 9 Jellybeans Discovered`,
)

// Methods
const toggleMinimize = () => {
  isCompact.value = !isCompact.value
  const newState = isCompact.value ? ScreenState.COMPACT : ScreenState.FULL
  toggleStore.setScreenState(ToggleableScreens.USER_DASHBOARD, newState)
}

const handleLogout = async (): Promise<void> => {
  if (isLoggedIn.value) {
    try {
      await errorStore.handleError(
        async () => {
          await userStore.logout() // Ensure this returns a Promise
        },
        'GENERAL_ERROR' as ErrorType,
        'Failed to logout. Please try again.',
      )
    } catch (error: unknown) {
      console.error('An unexpected error occurred:', error)
    }
  } else {
    // Handle login popup or redirect
  }
}
</script>

<style scoped>
.avatar {
  width: var(--avatar-size);
}

.info-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.username {
  font-size: var(--username-font-size);
}

.jellybeans {
  display: none;
  font-size: var(--jellybeans-font-size);
}

.logout-button {
  font-size: var(--logout-button-font-size);
  color: var(--logout-button-color);
}

.toggle-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Responsive design */
@media (min-width: 768px) {
  .jellybeans {
    display: inline;
  }
}
</style>
