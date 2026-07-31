import { useUserStore } from '@/stores/userStore'

/*
 * Not async: a plugin's returned promise is awaited before the Vue app mounts,
 * so awaiting userStore.initialize() here blocked first paint of the entire
 * app on a network call. Retiring the legacy guest session is not urgent
 * enough to hold the app hostage.
 */
export default defineNuxtPlugin(() => {
  const userStore = useUserStore()

  void (async () => {
    await userStore.initialize()

    if (userStore.user?.id === 10) {
      userStore.logout()
    }
  })()
})
