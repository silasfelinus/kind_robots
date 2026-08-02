// /stores/introStore.ts
// On-screen show-state for the first-launch walkthrough (first-launch-intro.vue).
// Dismissal itself is persisted on the User record via
// accountStore.setIntroDismissed so it follows the account across devices;
// this store only tracks whether the dialog is currently open and makes sure
// it auto-opens at most once per session for a user who hasn't dismissed it.
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useUserStore } from './userStore'

export const useIntroStore = defineStore('introStore', () => {
  const isOpen = ref(false)
  const hasAutoOpened = ref(false)

  function open(): void {
    isOpen.value = true
  }

  function close(): void {
    isOpen.value = false
  }

  function maybeAutoOpen(): void {
    if (hasAutoOpened.value) return

    const userStore = useUserStore()
    if (userStore.isGuest || !userStore.user) return

    hasAutoOpened.value = true

    if (!userStore.user.introDismissedAt) {
      isOpen.value = true
    }
  }

  return {
    isOpen,
    hasAutoOpened,
    open,
    close,
    maybeAutoOpen,
  }
})
