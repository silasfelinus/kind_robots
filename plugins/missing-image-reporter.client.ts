import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { performFetch } from '@/stores/utils'

type MissingImageReport = {
  src: string
  pageUrl: string
  alt?: string
  label?: string
  variant?: string
  size?: string
}

const IMAGE_EXTENSIONS = ['.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg']
const VARIANT_SIZES: Record<string, string> = {
  icon: '256x256',
  card: '512x768',
  hero: '1280x720',
}

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function imageSource(img: HTMLImageElement): string {
  return (
    cleanString(img.getAttribute('src')) ||
    cleanString(img.currentSrc) ||
    cleanString(img.src)
  )
}

function hasImageExtension(src: string): boolean {
  const path = src.split('?')[0]!.split('#')[0]!.toLowerCase()
  return IMAGE_EXTENSIONS.some((ext) => path.endsWith(ext))
}

function shouldIgnoreSource(src: string): boolean {
  if (!src) return true
  if (/^(data|blob):/i.test(src)) return true
  if (src.includes('/_nuxt/') || src.includes('/node_modules/')) return true
  if (src.includes('coming-soon') || src.includes('placeholder')) return true
  if (!hasImageExtension(src)) return true

  try {
    const url = new URL(src, window.location.origin)
    const host = url.hostname.toLowerCase()
    const allowedHosts = new Set([
      window.location.hostname.toLowerCase(),
      'kindrobots.org',
      'www.kindrobots.org',
      'raw.githubusercontent.com',
    ])
    return !allowedHosts.has(host)
  } catch {
    return false
  }
}

function inferVariant(img: HTMLImageElement, src: string): string | undefined {
  const explicit = cleanString(img.dataset.variant).toLowerCase()
  if (['icon', 'card', 'hero'].includes(explicit)) return explicit

  const className = cleanString(img.getAttribute('class')).toLowerCase()
  if (className.includes('icon')) return 'icon'
  if (className.includes('card')) return 'card'
  if (className.includes('hero')) return 'hero'

  const basename = src.split('/').pop()?.toLowerCase() ?? ''
  if (/(^|-|_)icon\./.test(basename)) return 'icon'
  if (/(^|-|_)card\./.test(basename)) return 'card'
  if (/(^|-|_)hero\./.test(basename)) return 'hero'

  return undefined
}

function labelForImage(img: HTMLImageElement): string | undefined {
  return (
    cleanString(img.alt) ||
    cleanString(img.title) ||
    cleanString(img.getAttribute('aria-label')) ||
    cleanString(img.dataset.slug) ||
    undefined
  )
}

export default defineNuxtPlugin(() => {
  const route = useRoute()
  const userStore = useUserStore()
  const queued = new Map<string, MissingImageReport>()
  const submitted = new Set<string>()

  async function submit(report: MissingImageReport) {
    if (submitted.has(report.src)) return
    submitted.add(report.src)

    await performFetch(
      '/api/conductor/art-request',
      {
        method: 'POST',
        body: JSON.stringify(report),
      },
      1,
      15000,
    )
  }

  function flushQueue() {
    if (!userStore.isAdmin) return

    for (const [src, report] of queued.entries()) {
      queued.delete(src)
      void submit(report)
    }
  }

  function queueReport(img: HTMLImageElement) {
    const src = imageSource(img)
    if (shouldIgnoreSource(src)) return
    if (submitted.has(src) || queued.has(src)) return

    const variant = inferVariant(img, src)
    const report: MissingImageReport = {
      src,
      pageUrl: window.location.href || route.fullPath,
      alt: cleanString(img.alt) || undefined,
      label: labelForImage(img),
      variant,
      size: variant ? VARIANT_SIZES[variant] : undefined,
    }

    if (!userStore.isAdmin) {
      queued.set(src, report)
      return
    }

    void submit(report)
  }

  window.addEventListener(
    'error',
    (event) => {
      const target = event.target
      if (target instanceof HTMLImageElement) queueReport(target)
    },
    true,
  )

  watch(
    () => userStore.isAdmin,
    () => flushQueue(),
    { immediate: true },
  )
})
