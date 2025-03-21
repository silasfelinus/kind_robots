// /stores/pageStore.ts
import { defineStore } from 'pinia'
import { useRoute } from 'vue-router'
import { useAsyncData } from '#app'
import { computed } from 'vue'
import type { ContentType } from '~/content.config'

export const usePageStore = defineStore('pageStore', () => {
  const route = useRoute()

  const page = computed(() => {
    const { data } = useAsyncData(route.path, async () => {
      return (await queryCollection('content')
        .path(route.path)
        .first()) as ContentType | null
    })
    return data.value
  })

  const pages = computed(() => {
    const { data } = useAsyncData('all-pages', async () => {
      const results = await queryCollection('content').all()
      return results.filter((item) => item.path !== '/') as ContentType[]
    })
    return data.value || []
  })

  const title = computed(() => page.value?.title ?? 'Kind Robots')
  const subtitle = computed(() => page.value?.subtitle ?? 'Welcome to Kind Robots')
  const layout = computed(() => page.value?.layout ?? 'default')
  const description = computed(() => page.value?.description ?? '')
  const image = computed(() => page.value?.image ?? '')
  const tags = computed(() => page.value?.tags ?? [])
  const icon = computed(() => page.value?.icon ?? 'mdi:robot-happy')
  const tooltip = computed(() => page.value?.tooltip ?? '')
  const dottitip = computed(() => page.value?.dottitip ?? '')
  const amitip = computed(() => page.value?.amitip ?? '')
  const category = computed(() => page.value?.category ?? '')
  const sort = computed(() => page.value?.sort ?? '')

  return {
    // current page data
    page,
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

    // all pages
    pages,
  }
})
