import { defineStore } from 'pinia'
import { useRoute } from 'vue-router'
import { useAsyncData } from '#app'
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

  const title = computed(() => page.value?.title ?? 'Kind Robots')
  const subtitle = computed(() => page.value?.subtitle ?? 'Welcome to Kind Robots')
  const description = computed(() => page.value?.description ?? '')
  const image = computed(() => page.value?.image ?? '')
  const gallery = computed(() => page.value?.gallery ?? '')
  const layout = computed(() => page.value?.layout ?? 'default')
  const tags = computed(() => page.value?.tags ?? [])
  const icon = computed(() => page.value?.icon ?? 'mdi:robot-happy')
  const tooltip = computed(() => page.value?.tooltip ?? '')
  const amiold = computed(() => page.value?.amiold ?? '')
  const category = computed(() => page.value?.category ?? '')
  const sort = computed(() => page.value?.sort ?? '')
  const dottitip = computed(() => page.value?.dottitip ?? '')
  const amitip = computed(() => page.value?.amitip ?? '')

  return {
    page,
    title,
    subtitle,
    description,
    image,
    gallery,
    layout,
    tags,
    icon,
    tooltip,
    amiold,
    category,
    sort,
    dottitip,
    amitip,
  }
})
