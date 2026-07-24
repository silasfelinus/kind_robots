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
  pageTitle?: string
  pageDescription?: string
  nearestHeading?: string
  nearbyText?: string
  imageClass?: string
}

const IMAGE_EXTENSIONS = ['.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg']
const VARIANT_SIZES: Record<string, string> = {
  icon: '256x256',
  card: '512x768',
  hero: '1280x720',
}

const GENERIC_LABEL_PATTERNS = [
  /^image\s*#?\s*\d+$/i,
  /^art\s*image\s*#?\s*\d+$/i,
  /^asset\s*#?\s*\d+$/i,
  /^image$/i,
  /^artwork$/i,
  /^generated art$/i,
  /^missing image$/i,
  /^untitled$/i,
]

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
}

function compact(value: unknown, maxLength = 700): string {
  const clean = cleanString(value)
  if (clean.length <= maxLength) return clean
  return `${clean.slice(0, maxLength - 1).trim()}…`
}

function isGenericLabel(value: unknown): boolean {
  const label = cleanString(value)
  if (!label) return true
  return GENERIC_LABEL_PATTERNS.some((pattern) => pattern.test(label))
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
  if (/\/api\/art\/image\//i.test(src)) return true
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
  const candidates = [
    img.alt,
    img.title,
    img.getAttribute('aria-label'),
    img.dataset.slug,
  ]

  for (const candidate of candidates) {
    const label = cleanString(candidate)
    if (label && !isGenericLabel(label)) return label
  }

  return undefined
}

function nearestHeading(img: HTMLImageElement): string | undefined {
  let current: HTMLElement | null = img.parentElement

  while (current) {
    const heading = current.querySelector<HTMLElement>('h1, h2, h3, h4, h5, h6')
    const text = cleanString(heading?.textContent)
    if (text) return compact(text, 180)
    if (current.matches('article, section, main')) break
    current = current.parentElement
  }

  const pageHeading = cleanString(document.querySelector('h1')?.textContent)
  return pageHeading ? compact(pageHeading, 180) : undefined
}

function nearbyText(img: HTMLImageElement): string | undefined {
  const container = img.closest<HTMLElement>('article, section, main, [role="main"], .card')
  const text = compact(container?.innerText || img.parentElement?.innerText, 700)
  return text || undefined
}

function pageDescription(): string | undefined {
  const description = cleanString(
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content,
  )
  return description || undefined
}

function shouldIgnoreImage(img: HTMLImageElement): boolean {
  if (img.dataset.missingImageReport === 'false') return true

  const label = cleanString(
    img.alt || img.title || img.getAttribute('aria-label') || img.dataset.slug,
  )

  return Boolean(label && isGenericLabel(label))
}

export default defineNuxtPlugin(() => {
  const route = useRoute()
  const userStore = useUserStore()
  const queued = new Map<string, MissingImageReport>()
  const submitted = new Set<string>()

  async function submit(report: MissingImageReport) {
    if (submitted.has(report.src)) return
    submitted.add(report.src)

    const result = await performFetch(
      '/api/conductor/art-request',
      {
        method: 'POST',
        body: JSON.stringify(report),
      },
      1,
      15000,
    )

    if (!result.success) submitted.delete(report.src)
  }

  function flushQueue() {
    if (!userStore.isAdmin) return

    for (const [src, report] of queued.entries()) {
      queued.delete(src)
      void submit(report)
    }
  }

  function queueReport(img: HTMLImageElement) {
    if (shouldIgnoreImage(img)) return

    const src = imageSource(img)
    if (shouldIgnoreSource(src)) return
    if (submitted.has(src) || queued.has(src)) return

    const variant = inferVariant(img, src)
    const label = labelForImage(img)
    const report: MissingImageReport = {
      src,
      pageUrl: window.location.href || route.fullPath,
      alt: label,
      label,
      variant,
      size: variant ? VARIANT_SIZES[variant] : undefined,
      pageTitle: cleanString(document.title) || undefined,
      pageDescription: pageDescription(),
      nearestHeading: nearestHeading(img),
      nearbyText: nearbyText(img),
      imageClass: cleanString(img.getAttribute('class')) || undefined,
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
