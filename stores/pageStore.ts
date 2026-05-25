// /stores/pageStore.ts

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ContentType } from '~/content.config'

export type PageLayoutKey = 'default' | 'minimal' | 'vertical-scroll' | false

export const usePageStore = defineStore('pageStore', () => {
  const page = ref<ContentType | null>(null)
  const ready = ref(false)
  const initialized = ref(false)

  const layout = computed<PageLayoutKey>(() => 'default')

  const meta = computed(() => ({
    title: page.value?.title ?? 'Robots',
    room: page.value?.room ?? 'Kind Robots',
    subtitle: page.value?.subtitle ?? 'Welcome to Kind Robots',
    description: page.value?.description ?? '',
    icon: page.value?.icon ?? 'mdi:robot-happy',
    image: page.value?.image ?? '/images/botcafe.webp',
    tooltip: page.value?.tooltip ?? '',
    dottitip: page.value?.dottitip ?? '',
    amitip: page.value?.amitip ?? '',
    artPrompt: page.value?.artPrompt ?? '',
    sort: page.value?.sort ?? '',
  }))

  function initialize(): void {
    if (initialized.value) return

    initialized.value = true
    ready.value = true
  }

  function setPage(newPage: ContentType): void {
    page.value = newPage
    ready.value = true
  }

  return {
    page,
    layout,
    meta,
    ready,
    initialized,
    setPage,
    initialize,

    title: computed(() => meta.value.title),
    room: computed(() => meta.value.room),
    subtitle: computed(() => meta.value.subtitle),
    description: computed(() => meta.value.description),
    icon: computed(() => meta.value.icon),
    image: computed(() => meta.value.image),
    tooltip: computed(() => meta.value.tooltip),
    dottitip: computed(() => meta.value.dottitip),
    amitip: computed(() => meta.value.amitip),
    artPrompt: computed(() => meta.value.artPrompt),
    sort: computed(() => meta.value.sort),
  }
})
