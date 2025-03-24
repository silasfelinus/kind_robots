// /stores/pageStore.ts
import { defineStore } from 'pinia'
import { useRoute } from 'vue-router'
import { useAsyncData } from '#app'
import { ref, computed, watchEffect } from 'vue'
import type { ContentType } from '~/content.config'

export type LayoutKey = 'default' | 'minimal' | 'vertical-scroll' | false

export const usePageStore = defineStore('pageStore', () => {
  const route = useRoute()
  const page = ref<ContentType | null>(null)
  const pages = ref<ContentType[]>([])

  // Load current page based on route
  const loadPage = async () => {
    const { data } = await useAsyncData(`page-${route.path}`, async () => {
      return (await queryCollection('content')
        .path(route.path)
        .first()) as ContentType | null
    })
    page.value = data.value || null
  }

  // Load all pages once
  const loadAllPages = async () => {
    const { data } = await useAsyncData('all-pages', async () => {
      const results = await queryCollection('content').all()
      return results.filter((item) => item.path !== '/') as ContentType[]
    })
    pages.value = data.value || []
  }

  // Automatically watch for route change and load correct page
  watchEffect(() => {
    loadPage()
  })

  const title = computed(() => page.value?.title ?? 'Kind Robots')
  const subtitle = computed(
    () => page.value?.subtitle ?? 'Welcome to Kind Robots',
  )
  const layout = computed<LayoutKey>(() => {
    const validLayouts: LayoutKey[] = ['default', 'minimal', 'vertical-scroll']
    const value = page.value?.layout
    return validLayouts.includes(value as LayoutKey)
      ? (value as LayoutKey)
      : 'default'
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
    // state
    page,
    pages,

    // loaders
    loadPage,
    loadAllPages,

    // derived values
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
