// /stores/pageStore.ts
import { defineStore } from 'pinia'
import { useAsyncData, useRoute } from '#app'
import { ref, computed, watch, onMounted } from 'vue'
import type { ContentType } from '~/content.config'

export type LayoutKey = 'default' | 'minimal' | 'vertical-scroll' | false

const STORAGE_KEY = 'kindrobots-pageCache'

export const usePageStore = defineStore('pageStore', () => {
  const page = ref<ContentType | null>(null)
  const pages = ref<ContentType[]>([])
  const pageCache = ref<Record<string, ContentType>>({})
  const routePath = ref('')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const hydrated = ref(false)

  onMounted(() => {
    hydrated.value = true
  })

  // Load from localStorage
  if (import.meta.client) {
    const cached = localStorage.getItem(STORAGE_KEY)
    if (cached) {
      try {
        pageCache.value = JSON.parse(cached)
      } catch (err) {
        console.warn('Failed to parse page cache:', err)
      }
    }

    // Watch and persist cache
    watch(
      pageCache,
      (val) => localStorage.setItem(STORAGE_KEY, JSON.stringify(val)),
      { deep: true },
    )
  }

  const normalizePage = (data: Partial<ContentType>): ContentType => {
    return {
      ...data,
      seo: data.seo ?? {},
      image: data.image ?? '/images/botcafe.webp',
      tags: data.tags ?? [],
      icon: data.icon ?? 'mdi:robot-happy',
      tooltip: data.tooltip ?? '',
      dottitip: data.dottitip ?? '',
      amitip: data.amitip ?? '',
      layout: ['default', 'minimal', 'vertical-scroll'].includes(
        data.layout as string,
      )
        ? (data.layout as LayoutKey)
        : 'default',
      sort: data.sort ?? '',
      category: data.category ?? '',
      underConstruction: data.underConstruction ?? true,
    } as ContentType
  }

  const loadPage = async (path?: string) => {
    const route = useRoute()
    const resolvedPath = path || route.path
    routePath.value = resolvedPath

    if (page.value?.path === resolvedPath) return

    loading.value = true
    error.value = null

    try {
      if (pageCache.value[resolvedPath]) {
        page.value = pageCache.value[resolvedPath]
        return
      }

      const { data } = await useAsyncData(`page-${resolvedPath}`, () =>
        queryCollection('content').path(resolvedPath).first(),
      )

      if (data.value) {
        const normalized = normalizePage(data.value)
        page.value = normalized
        pageCache.value[resolvedPath] = normalized
      } else {
        page.value = null
      }
    } catch (err) {
      console.error('Failed to load page:', err)
      error.value = 'Page failed to load'
      page.value = null
    } finally {
      loading.value = false
    }
  }

  const loadAllPages = async () => {
    const { data } = await useAsyncData('all-pages', async () => {
      const results = await queryCollection('content').all()
      return results.filter((item) => item.path !== '/') as ContentType[]
    })

    pages.value = data.value || []

    for (const p of pages.value) {
      if (p.path && !pageCache.value[p.path]) {
        pageCache.value[p.path] = normalizePage(p)
      }
    }
  }

  const getPageByPath = (path: string): ContentType | undefined => {
    return pageCache.value[path] || pages.value.find((p) => p.path === path)
  }

  const meta = computed(() => ({
    title: page.value?.title ?? 'Kind Robots',
    subtitle: page.value?.subtitle ?? 'Welcome to Kind Robots',
    description: page.value?.description ?? '',
    image: page.value?.image ?? '/images/botcafe.webp',
    tags: page.value?.tags ?? [],
    icon: page.value?.icon ?? 'mdi:robot-happy',
    tooltip: page.value?.tooltip ?? '',
    dottitip: page.value?.dottitip ?? '',
    amitip: page.value?.amitip ?? '',
    category: page.value?.category ?? '',
    sort: page.value?.sort ?? '',
    underConstruction: page.value?.underConstruction ?? true,
  }))

  const layout = computed<LayoutKey>(() => {
    const val = page.value?.layout
    return ['default', 'minimal', 'vertical-scroll'].includes(val as string)
      ? (val as LayoutKey)
      : 'default'
  })

  return {
    page,
    pages,
    routePath,
    pageCache,
    loading,
    error,
    hydrated,
    layout,
    meta,

    // Expose these directly for convenience
    title: computed(() => meta.value.title),
    subtitle: computed(() => meta.value.subtitle),
    description: computed(() => meta.value.description),
    image: computed(() => meta.value.image),
    icon: computed(() => meta.value.icon),
    tooltip: computed(() => meta.value.tooltip),
    dottitip: computed(() => meta.value.dottitip),
    amitip: computed(() => meta.value.amitip),
    category: computed(() => meta.value.category),
    sort: computed(() => meta.value.sort),
    underConstruction: computed(() => meta.value.underConstruction),

    loadPage,
    loadAllPages,
    getPageByPath,
  }
})
