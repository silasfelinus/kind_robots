// /stores/pageStore.ts
import { defineStore } from 'pinia'
import { useAsyncData, useRoute } from '#app'
import { ref, computed, watchEffect, watch } from 'vue'
import type { ContentType } from '~/content.config'

export type LayoutKey = 'default' | 'minimal' | 'vertical-scroll' | false

const STORAGE_KEY = 'kindrobots-pageCache'

export const usePageStore = defineStore('pageStore', () => {
  const page = ref<ContentType | null>(null)
  const pages = ref<ContentType[]>([])
  const pageCache = ref<Record<string, ContentType>>({})

  // Load page cache from localStorage on client startup
  if (process.client) {
    const cached = localStorage.getItem(STORAGE_KEY)
    if (cached) {
      try {
        pageCache.value = JSON.parse(cached)
      } catch (err) {
        console.warn('Failed to parse page cache:', err)
      }
    }
  }

  // Persist page cache on change
  if (process.client) {
    watch(
      pageCache,
      (val) => localStorage.setItem(STORAGE_KEY, JSON.stringify(val)),
      { deep: true },
    )
  }

  const loadPage = async (path?: string) => {
    const route = useRoute()
    const resolvedPath = path || route.path

    if (pageCache.value[resolvedPath]) {
      page.value = pageCache.value[resolvedPath]
      return
    }

    const { data } = await useAsyncData(`page-${resolvedPath}`, async () => {
      return (await queryCollection('content')
        .path(resolvedPath)
        .first()) as ContentType | null
    })

    if (data.value) {
      page.value = data.value
      pageCache.value[resolvedPath] = data.value
    } else {
      page.value = null
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
        pageCache.value[p.path] = p
      }
    }
  }

  const title = computed(() => page.value?.title ?? 'Kind Robots')
  const subtitle = computed(
    () => page.value?.subtitle ?? 'Welcome to Kind Robots',
  )
  const layout = computed<LayoutKey>(() => {
    const valid: LayoutKey[] = ['default', 'minimal', 'vertical-scroll']
    const val = page.value?.layout
    return valid.includes(val as LayoutKey) ? (val as LayoutKey) : 'default'
  })

  const description = computed(() => page.value?.description ?? '')
  const image = computed(() =>
    page.value?.image?.length ? page.value.image : '/images/botcafe.webp',
  )
  const tags = computed(() => page.value?.tags ?? [])
  const icon = computed(() => page.value?.icon ?? 'mdi:robot-happy')
  const tooltip = computed(() => page.value?.tooltip ?? '')
  const dottitip = computed(() => page.value?.dottitip ?? '')
  const amitip = computed(() => page.value?.amitip ?? '')
  const category = computed(() => page.value?.category ?? '')
  const sort = computed(() => page.value?.sort ?? '')
  const underConstruction = computed(
    () => page.value?.underConstruction ?? true,
  )

  return {
    page,
    pages,
    loadPage,
    loadAllPages,
    title,
    subtitle,
    layout,
    description,
    image,
    tags,
    icon,
    tooltip,
    dottitip,
    amitip,
    category,
    sort,
    underConstruction,
  }
})
