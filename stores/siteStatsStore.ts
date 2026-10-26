import { defineStore } from 'pinia'
import { ref } from 'vue'
import { performFetch } from './utils'
import { useUserStore } from './userStore'
import {
  SITE_STAT_DIRECT,
  isSiteStatAdminPath,
  normalizeReferrerHost,
  type SiteStatKind,
  type SiteStatsSummary,
} from '~/utils/siteStats'

const TRACK_URL = '/api/site-stats/track'
const VISIT_FLAG = 'kr-site-visit'

export const useSiteStatsStore = defineStore('siteStats', () => {
  const summary = ref<SiteStatsSummary | null>(null)
  const loading = ref(false)
  const error = ref('')
  const visitSent = ref(false)

  function trackingAllowed(): boolean {
    if (!import.meta.client) return false
    try {
      if (navigator.doNotTrack === '1') return false
    } catch {
      return false
    }
    return !useUserStore().isAdmin
  }

  function beacon(kind: SiteStatKind, key: string): void {
    const body = JSON.stringify({ kind, key })
    let sent: boolean
    try {
      sent =
        typeof navigator.sendBeacon === 'function' &&
        navigator.sendBeacon(
          TRACK_URL,
          new Blob([body], { type: 'application/json' }),
        )
    } catch {
      sent = false
    }
    if (sent) return
    $fetch(TRACK_URL, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => undefined)
  }

  function send(kind: SiteStatKind, key: string): void {
    if (!import.meta.client) return
    void useUserStore()
      .initialize()
      .catch(() => undefined)
      .then(() => {
        if (trackingAllowed()) beacon(kind, key)
      })
      .catch(() => undefined)
  }

  function trackView(path: string): void {
    if (typeof path !== 'string' || !path.startsWith('/')) return
    if (isSiteStatAdminPath(path.split(/[?#]/)[0]!.toLowerCase())) return
    send('view', path)
  }

  function readVisitFlag(): boolean {
    try {
      return window.sessionStorage.getItem(VISIT_FLAG) === '1'
    } catch {
      return false
    }
  }

  function writeVisitFlag(): void {
    try {
      window.sessionStorage.setItem(VISIT_FLAG, '1')
    } catch {
      return
    }
  }

  function trackVisit(referrer: string): void {
    if (!import.meta.client || visitSent.value || readVisitFlag()) return
    visitSent.value = true
    writeVisitFlag()
    send('visit', normalizeReferrerHost(referrer) || SITE_STAT_DIRECT)
  }

  function trackEvent(name: string): void {
    send('event', name)
  }

  async function fetchSummary(days = 30) {
    loading.value = true
    error.value = ''
    try {
      const res = await performFetch<SiteStatsSummary>(
        '/api/admin/site-stats?days=' + encodeURIComponent(String(days)),
      )
      if (!res.success || !res.data)
        throw new Error(res.message || 'Could not load site stats.')
      summary.value = res.data
      return true
    } catch (cause) {
      error.value =
        cause instanceof Error ? cause.message : 'Could not load site stats.'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    summary,
    loading,
    error,
    trackView,
    trackVisit,
    trackEvent,
    fetchSummary,
  }
})
