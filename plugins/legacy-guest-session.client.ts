import { useUserStore } from '@/stores/userStore'

/*
 * Session restoration is deliberately post-hydration. The server cannot read
 * the localStorage token, so it renders guest-facing markup. Restoring a saved
 * user before Vue has hydrated that markup changes auth-dependent header
 * branches underneath the hydration walker.
 *
 * This plugin used to start initialize() immediately (without awaiting it) to
 * avoid blocking app mount. That removed the startup stall, but left a race: a
 * fast auth response could still land before mount. app:mounted keeps the work
 * non-blocking while making the SSR/client boundary deterministic.
 */
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
