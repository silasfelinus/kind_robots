// /stores/linkStore.ts
import { defineStore } from 'pinia'
import { computed } from 'vue'
import { usePageStore } from './pageStore'

interface LinkItem {
  title: string
  path: string
  icon: string
  tooltip?: string
  isDynamic?: boolean
}

export const useLinkStore = defineStore('linkStore', () => {
  const pageStore = usePageStore()

  const staticLinks: LinkItem[] = [
    { title: 'Home', path: '/', icon: 'kind-icon:home' },
    { title: 'Bot Cafe', path: '/botcafe', icon: 'kind-icon:addbot' },
    { title: 'Brainstorm!', path: '/brainstorm', icon: 'kind-icon:brain' },
    { title: 'Art Lab', path: '/artmaker', icon: 'kind-icon:easel' },
    { title: 'Memory', path: '/memory', icon: 'kind-icon:question' },
    { title: 'Wonderlab', path: '/wonderlab', icon: 'kind-icon:gearhammer' },
    { title: 'WeirdLand', path: '/weirdlandia', icon: 'kind-icon:alien' },
    { title: 'Story Maker', path: '/story', icon: 'kind-icon:book' },
  ]

  const dynamicLinks = computed(() =>
    pageStore.pages
      .filter((p) => p.tags?.includes('home') || p.tags?.includes('nav'))
      .map((p) => ({
        title: p.title ?? 'Untitled',
        path: p.path,
        icon: p.icon ?? 'kind-icon:robot',
        tooltip: p.tooltip,
        isDynamic: true,
      })),
  )

  const allLinks = computed<LinkItem[]>(() => [
    ...staticLinks,
    ...dynamicLinks.value,
  ])

  return {
    staticLinks,
    dynamicLinks,
    allLinks,
  }
})
