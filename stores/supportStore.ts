import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  FUNDRAISER_URL,
  PLAY_PROMPT_DELAY_MS,
  parseSupportProgress,
  playSlugFromPath,
  promptIsDue,
  type SupportProgress,
} from '~/utils/supportShare'
import { useSiteStatsStore } from './siteStatsStore'

export type SupportPromptReason = 'plays' | 'runs'

export type SupportPrompt = {
  reason: SupportPromptReason
  path: string
}

const storageKey = 'kr-support-progress-v1'
const isClient = typeof window !== 'undefined'

function readProgress(): SupportProgress {
  if (!isClient) return parseSupportProgress(null)
  try {
    return parseSupportProgress(localStorage.getItem(storageKey))
  } catch {
    return parseSupportProgress(null)
  }
}

export const useSupportStore = defineStore('support', () => {
  const progress = ref<SupportProgress>(parseSupportProgress(null))
  const activePrompt = ref<SupportPrompt | null>(null)
  const copiedUrl = ref('')
  const lastPlaySlug = ref<string | null>(null)
  let playTimer: ReturnType<typeof setTimeout> | null = null
  let copiedTimer: ReturnType<typeof setTimeout> | null = null
  let loaded = false

  function ensureLoaded() {
    if (loaded || !isClient) return
    progress.value = readProgress()
    loaded = true
  }

  function persist() {
    if (!isClient) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(progress.value))
    } catch {
      return
    }
  }

  function clearPlayTimer() {
    if (playTimer) clearTimeout(playTimer)
    playTimer = null
  }

  function track(name: string) {
    if (!isClient) return
    useSiteStatsStore().trackEvent('support:' + name)
  }

  function open(reason: SupportPromptReason, path: string) {
    track('shown-' + reason)
    progress.value = { ...progress.value, lastPromptAt: Date.now() }
    persist()
    activePrompt.value = { reason, path }
  }

  function recordRoute(path: string) {
    ensureLoaded()
    const slug = playSlugFromPath(path)
    if (!slug) {
      clearPlayTimer()
      lastPlaySlug.value = null
      return
    }
    if (slug === lastPlaySlug.value) return
    lastPlaySlug.value = slug
    clearPlayTimer()
    const plays = progress.value.plays + 1
    progress.value = { ...progress.value, plays }
    persist()
    if (!promptIsDue(plays, progress.value, Date.now())) return
    playTimer = setTimeout(() => {
      playTimer = null
      if (lastPlaySlug.value === slug && !activePrompt.value)
        open('plays', path)
    }, PLAY_PROMPT_DELAY_MS)
  }

  function currentPath() {
    return isClient ? window.location.pathname + window.location.search : '/'
  }

  function recordRunFinished(path: string = currentPath()) {
    ensureLoaded()
    const runs = progress.value.runs + 1
    progress.value = { ...progress.value, runs }
    persist()
    if (activePrompt.value) return
    if (promptIsDue(runs, progress.value, Date.now())) {
      clearPlayTimer()
      open('runs', path)
    }
  }

  function dismiss() {
    activePrompt.value = null
  }

  function markGave() {
    ensureLoaded()
    track('give')
    progress.value = { ...progress.value, gaveAt: Date.now() }
    persist()
  }

  function openExternal(href: string) {
    if (!isClient) return
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  function give() {
    markGave()
    openExternal(FUNDRAISER_URL)
  }

  const canNativeShare = () =>
    isClient && typeof navigator !== 'undefined' && 'share' in navigator

  async function nativeShare(data: {
    url: string
    title: string
    text: string
  }) {
    if (!canNativeShare()) return false
    try {
      await navigator.share(data)
      return true
    } catch {
      return false
    }
  }

  async function copyLink(url: string) {
    if (!isClient) return false
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      return false
    }
    copiedUrl.value = url
    if (copiedTimer) clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => {
      copiedUrl.value = ''
      copiedTimer = null
    }, 2500)
    return true
  }

  return {
    progress,
    activePrompt,
    copiedUrl,
    recordRoute,
    recordRunFinished,
    dismiss,
    markGave,
    track,
    give,
    openExternal,
    canNativeShare,
    nativeShare,
    copyLink,
  }
})
