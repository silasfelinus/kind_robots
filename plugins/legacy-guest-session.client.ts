import { useUserStore } from '@/stores/userStore'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', () => {
    const userStore = useUserStore()

    void (async () => {
      await userStore.initialize()

      if (userStore.user?.id === 10) {
        userStore.logout()
      }
    })()
  })
})
