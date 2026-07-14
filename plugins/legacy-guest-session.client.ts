import { useUserStore } from '@/stores/userStore'

export default defineNuxtPlugin(async () => {
  const userStore = useUserStore()

  await userStore.initialize()

  if (userStore.user?.id === 10) {
    userStore.logout()
  }
})
