import { useSiteStatsStore } from '@/stores/siteStatsStore'

export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  const siteStats = useSiteStatsStore()
  let lastPath = ''

  function recordView(path: string) {
    if (path === lastPath) return
    lastPath = path
    siteStats.trackView(path)
  }

  nuxtApp.hook('app:mounted', () => {
    siteStats.trackVisit(document.referrer)
    recordView(router.currentRoute.value.path)
    router.afterEach((to, _from, failure) => {
      if (!failure) recordView(to.path)
    })
  })
})
