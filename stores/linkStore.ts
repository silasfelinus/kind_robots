// /stores/linkStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface LinkItem {
  title: string
  path?: string
  icon: string
  description?: string
  tooltip?: string
  isDynamic?: boolean
  isUtility?: boolean
}

export const useLinkStore = defineStore('linkStore', () => {
  const staticLinks = ref<LinkItem[]>([
    // Navigation Icons
    { title: 'Brainstorm!', path: '/brainstorm', icon: 'kind-icon:brain' },
    { title: 'Memory', path: '/memory', icon: 'kind-icon:question' },
    { title: 'Wonderlab', path: '/wonderlab', icon: 'kind-icon:gearhammer' },
    { title: 'Story Maker', path: '/story', icon: 'kind-icon:book' },

    // Utility Icons (no path; will be handled with components)
    { title: 'Login', icon: 'login-path', isUtility: true },
    { title: 'Jellybeans', icon: 'jellybean-icon', isUtility: true },
    { title: 'Theme', icon: 'theme-icon', isUtility: true },
    { title: 'Swarm', icon: 'swarm-icon', isUtility: true },
  ])

  const allLinks = computed<LinkItem[]>(() => [...staticLinks.value])

  const navLinks = computed(() =>
    allLinks.value.filter((link) => !link.isUtility),
  )
  const utilityLinks = computed(() =>
    allLinks.value.filter((link) => link.isUtility),
  )

  return {
    staticLinks,
    allLinks,
    navLinks,
    utilityLinks,
  }
})
