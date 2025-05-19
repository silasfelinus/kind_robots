// /stores/pageStore.ts
import { defineStore } from 'pinia'
import { useRoute } from '#app'
import { ref, computed } from 'vue'
import type { ContentType } from '~/content.config'

export type LayoutKey = 'default' | 'minimal' | 'vertical-scroll' | false

export const usePageStore = defineStore('pageStore', () => {
  const page = ref<ContentType | null>(null)
  const routePath = ref('')
  const loading = ref(false)
  const error = ref<string | null>(null)

  const loadPage = async (path?: string) => {
    const route = useRoute()
    const resolvedPath = path || route.path
    routePath.value = resolvedPath

    if (page.value?.path === resolvedPath) return

    loading.value = true
    error.value = null

    try {
      const result = await queryCollection('content').path(resolvedPath).first()
      page.value = result as ContentType
    } catch (err) {
      console.error('Failed to load page:', err)
      error.value = 'Page failed to load'
      page.value = null
    } finally {
      loading.value = false
    }
  }

  const layout = computed<LayoutKey>(() => {
    const val = page.value?.layout
    return ['default', 'minimal', 'vertical-scroll'].includes(val as string)
      ? (val as LayoutKey)
      : 'default'
  })

  const meta = computed(() => ({
    title: page.value?.title ?? 'Robots',
    room: page.value?.room ?? 'Kind Robots',
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
    navComponent: page.value?.navComponent ?? '',
    model: page.value?.model ?? '',
  }))

  return {
    page,
    routePath,
    loading,
    error,
    layout,
    meta,

    // Meta convenience refs
    title: computed(() => meta.value.title),
    room: computed(() => meta.value.room),
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
    navComponent: computed(() => meta.value.navComponent),

    loadPage,
  }
})
