// /stores/linkStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { usePageStore } from './pageStore'

interface LinkItem {
  title: string
  path?: string
  icon: string
  tooltip?: string
  isDynamic?: boolean
  isUtility?: boolean
}

export const useLinkStore = defineStore('linkStore', () => {
  const pageStore = usePageStore()

  const staticLinks = ref<LinkItem[]>([
    // Navigation Icons
    { title: 'Bot Cafe', path: '/botcafe', icon: 'kind-icon:addbot' },
    { title: 'Brainstorm!', path: '/brainstorm', icon: 'kind-icon:brain' },
    { title: 'Art Lab', path: '/artmaker', icon: 'kind-icon:easel' },
    { title: 'Memory', path: '/memory', icon: 'kind-icon:question' },
    { title: 'Wonderlab', path: '/wonderlab', icon: 'kind-icon:gearhammer' },
    { title: 'Story Maker', path: '/story', icon: 'kind-icon:book' },

    // Utility Icons (no path; will be handled with components)
    { title: 'Login', icon: 'login-path', isUtility: true },
    { title: 'Jellybeans', icon: 'jellybean-count', isUtility: true },
    { title: 'Theme', icon: 'theme-icon', isUtility: true },
    { title: 'Swarm', icon: 'swarm-icon', isUtility: true },
  ])

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
    ...staticLinks.value,
    ...dynamicLinks.value,
  ])

  const navLinks = computed(() =>
    allLinks.value.filter((link) => !link.isUtility),
  )
  const utilityLinks = computed(() =>
    allLinks.value.filter((link) => link.isUtility),
  )

  return {
    staticLinks,
    dynamicLinks,
    allLinks,
    navLinks,
    utilityLinks,
  }
})
