import { useDreamStore } from '@/stores/dreamStore'
import {
  useFacetCatalogStore,
  type FacetCatalogEntry,
} from '@/stores/facetCatalogStore'
import type { DreamWithRelations } from '@/stores/dreamStore'

function clean(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
}

function normalizedSubject(value: unknown): string {
  return clean(value)
    .replace(/\s+(preview|artwork|image)$/i, '')
    .trim()
    .toLowerCase()
}

function pathFor(value: unknown): string {
  const source = clean(value)
  if (!source) return ''

  try {
    return new URL(source, window.location.origin).pathname.toLowerCase()
  } catch {
    return source.split('?')[0]!.split('#')[0]!.toLowerCase()
  }
}

function sameSource(source: string, candidate: unknown): boolean {
  const candidatePath = pathFor(candidate)
  return Boolean(candidatePath && (source === candidatePath || source.endsWith(candidatePath)))
}

function dreamImageField(dream: DreamWithRelations, source: string): string {
  if (sameSource(source, dream.cardPath)) return 'cardPath'
  if (sameSource(source, dream.heroPath)) return 'heroPath'
  if (sameSource(source, dream.highlightImage)) return 'highlightImage'
  if (sameSource(source, dream.imagePath)) return 'imagePath'
  return 'galleryArtwork'
}

function facetImageField(facet: FacetCatalogEntry, source: string): string {
  if (sameSource(source, facet.cardPath)) return 'cardPath'
  if (sameSource(source, facet.heroPath)) return 'heroPath'
  if (sameSource(source, facet.imagePath)) return 'imagePath'
  return 'galleryArtwork'
}

export default defineNuxtPlugin({
  name: 'gallery-art-model-context',
  setup(nuxtApp) {
    const dreamStore = useDreamStore()
    const facetStore = useFacetCatalogStore()
    let observer: MutationObserver | null = null

    function decorate(img: HTMLImageElement): void {
      if (img.dataset.artModel || img.closest('[data-art-model]')) return

      const source = pathFor(img.getAttribute('src') || img.currentSrc || img.src)
      const subject = normalizedSubject(
        img.dataset.artSubject || img.alt || img.title || img.getAttribute('aria-label'),
      )
      if (!subject) return

      const routePath = window.location.pathname.toLowerCase()
      const preferFacet = routePath.includes('facet')
      const preferDream = routePath.includes('dream')

      const facet = facetStore.entries.find(
        (entry) => normalizedSubject(entry.title) === subject,
      )
      const dream = dreamStore.dreams.find(
        (entry) => normalizedSubject(entry.title) === subject,
      )

      const selectedFacet = preferFacet ? facet : !preferDream && !dream ? facet : null
      if (selectedFacet) {
        img.dataset.artModel = 'facet'
        img.dataset.artModelId = String(selectedFacet.id)
        if (selectedFacet.slug) img.dataset.artModelSlug = selectedFacet.slug
        img.dataset.artModelField = facetImageField(selectedFacet, source)
        img.dataset.artSubject = selectedFacet.title
        return
      }

      if (dream) {
        img.dataset.artModel = 'dream'
        img.dataset.artModelId = String(dream.id)
        if (dream.slug) img.dataset.artModelSlug = dream.slug
        img.dataset.artModelField = dreamImageField(dream, source)
        img.dataset.artSubject = dream.title
        return
      }

      if (facet) {
        img.dataset.artModel = 'facet'
        img.dataset.artModelId = String(facet.id)
        if (facet.slug) img.dataset.artModelSlug = facet.slug
        img.dataset.artModelField = facetImageField(facet, source)
        img.dataset.artSubject = facet.title
      }
    }

    function decorateTree(node: Node): void {
      if (node instanceof HTMLImageElement) decorate(node)
      if (!(node instanceof HTMLElement)) return
      for (const img of node.querySelectorAll<HTMLImageElement>('img')) decorate(img)
    }

    function handleImageError(event: Event): void {
      if (event.target instanceof HTMLImageElement) decorate(event.target)
    }

    function start(): void {
      const root = document.documentElement
      if (!root) return

      window.addEventListener('error', handleImageError, true)
      observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) decorateTree(node)
        }
      })
      observer.observe(root, { childList: true, subtree: true })
      decorateTree(root)
    }

    nuxtApp.hook('app:mounted', start)
    // Nuxt has no app-unmount hook (the root app lives for the whole session);
    // tear the observer + error listener down on real page teardown instead.
    window.addEventListener('pagehide', () => {
      observer?.disconnect()
      window.removeEventListener('error', handleImageError, true)
    })
  },
})
