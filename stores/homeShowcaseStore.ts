// /stores/homeShowcaseStore.ts
//
// One fetch, one cache, for everything the home page shows.
//
// The home page is the first paint of the whole site, so this store is
// deliberately thin: no per-rail loading states, no per-rail refresh. The
// endpoint answers in one round trip, and a rail with nothing in it is simply
// not rendered -- the page composes itself out of whatever the swarm actually
// has today rather than reserving empty boxes for what it doesn't.

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { performFetch } from '@/stores/utils'
import {
  emptyShowcase,
  type HomeShowcase,
  type ShowcaseCard,
  type ShowcaseRailKey,
} from '@/utils/homeShowcase'

/**
 * A visitor bouncing between the home page and a gallery shouldn't re-pay for
 * the showcase each time. Matches the endpoint's own cache-control minute.
 */
const SHOWCASE_FRESH_MS = 60_000

export const useHomeShowcaseStore = defineStore('homeShowcase', () => {
  const showcase = ref<HomeShowcase>(emptyShowcase())
  const isLoading = ref(false)
  const errorMessage = ref('')
  const loadedAt = ref(0)

  const hero = computed(() => showcase.value.hero)
  const projects = computed(() => showcase.value.projects)

  /** True once a load has resolved, however empty -- gates the skeletons. */
  const hasLoaded = computed(() => loadedAt.value > 0)

  function rail(key: ShowcaseRailKey): ShowcaseCard[] {
    return showcase.value.rails[key] ?? []
  }

  /** Rails with nothing in them are dropped, not rendered empty. */
  const populatedRailKeys = computed<ShowcaseRailKey[]>(() =>
    (Object.keys(showcase.value.rails) as ShowcaseRailKey[]).filter(
      (key) => showcase.value.rails[key].length > 0,
    ),
  )

  const isFresh = computed(
    () => hasLoaded.value && Date.now() - loadedAt.value < SHOWCASE_FRESH_MS,
  )

  async function load(force = false): Promise<void> {
    if (isLoading.value) return
    if (!force && isFresh.value) return

    isLoading.value = true
    errorMessage.value = ''

    try {
      const response = await performFetch<HomeShowcase>('/api/showcase/home')

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load the home showcase.')
      }

      showcase.value = response.data
      loadedAt.value = Date.now()
    } catch (error) {
      errorMessage.value =
        error instanceof Error
          ? error.message
          : 'Failed to load the home showcase.'
      /*
       * Stamped even on failure: the page then shows its error note and its
       * (empty) rails rather than spinning forever on a skeleton, and the
       * Refresh control is the way back rather than an automatic retry loop
       * against an endpoint that just failed.
       */
      loadedAt.value = Date.now()
    } finally {
      isLoading.value = false
    }
  }

  return {
    showcase,
    hero,
    projects,
    isLoading,
    errorMessage,
    hasLoaded,
    isFresh,
    populatedRailKeys,
    rail,
    load,
  }
})
