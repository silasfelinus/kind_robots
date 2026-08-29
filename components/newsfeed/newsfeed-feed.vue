<!-- /components/newsfeed/newsfeed-feed.vue -->
<!--
  The recommended newsfeed (conductor projects/newsfeed t-006). Aggregates the
  user's enabled feeds (stores/feedPreferenceStore, t-004) via the server
  pipeline (server/api/newsfeed, t-005) into a responsive card grid with
  per-feed category filtering and chronological ordering. Reused on both the
  homepage (content/index.md) and the Newsfeed Lab project page
  (components/conductor/newsfeed-page.vue).
-->
<template>
  <section class="flex flex-col gap-4">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap gap-1.5">
        <button
          type="button"
          class="btn btn-sm rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :class="
            activeSlug === ALL_FEEDS_SLUG
              ? 'btn-primary'
              : 'btn-ghost border border-base-300'
          "
          :aria-pressed="activeSlug === ALL_FEEDS_SLUG"
          @click="activeSlug = ALL_FEEDS_SLUG"
        >
          All
        </button>
        <button
          v-for="group in groups"
          :key="group.slug"
          type="button"
          class="btn btn-sm gap-1.5 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :class="
            activeSlug === group.slug
              ? 'btn-primary'
              : 'btn-ghost border border-base-300'
          "
          :aria-pressed="activeSlug === group.slug"
          @click="activeSlug = group.slug"
        >
          <Icon :name="group.icon" class="size-3.5" />
          {{ group.title }}
        </button>
      </div>

      <div class="flex items-center gap-2">
        <!--
          Pin the tab you want to land on. Silas, 2026-08-28: "We should be able
          to choose the starting feed, I only get all as the starting option and
          I'd personally like to choose AI Gaming as the initial launch. But
          others might want otherwise."

          Deliberately a one-click toggle on the tab you are already looking at
          rather than a select buried in Manage feeds: choosing a starting feed
          is something you do WHILE reading the feed you like, and a preference
          you can set without first learning where preferences live is one more
          person who actually sets it.
        -->
        <button
          type="button"
          class="btn btn-ghost btn-sm gap-1.5 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :class="startsHere ? 'text-primary' : ''"
          :aria-pressed="startsHere"
          :title="pinTitle"
          @click="toggleStartingFeed"
        >
          <Icon
            :name="startsHere ? 'kind-icon:star' : 'kind-icon:stars'"
            class="size-4"
          />
          <span class="hidden sm:inline">{{ pinLabel }}</span>
        </button>

        <button
          type="button"
          class="btn btn-ghost btn-sm gap-1.5 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :aria-expanded="showManageFeeds"
          aria-controls="newsfeed-manage-feeds-panel"
          @click="showManageFeeds = !showManageFeeds"
        >
          <Icon name="kind-icon:sliders" class="size-4" />
          Manage feeds
          <Icon
            :name="
              showManageFeeds
                ? 'kind-icon:chevron-up'
                : 'kind-icon:chevron-down'
            "
            class="size-3.5"
          />
        </button>

        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :disabled="isLoading"
          :aria-busy="isLoading"
          @click="loadFeed()"
        >
          <span v-if="isLoading" class="loading loading-spinner loading-xs" />
          <Icon v-else name="kind-icon:refresh" class="size-4" />
          Refresh
        </button>
      </div>
    </header>

    <div
      v-if="showManageFeeds"
      id="newsfeed-manage-feeds-panel"
      class="flex flex-col gap-3"
    >
      <NewsfeedPreferences />
      <NewsfeedFilters :items="rawItems" />
    </div>

    <div aria-live="polite" aria-atomic="true">
      <div v-if="errorMessage" class="kr-note kr-note-error">
        {{ errorMessage }}
      </div>

      <div
        v-else-if="isLoading && !allItems.length"
        class="flex min-h-40 items-center justify-center kr-panel-flat"
      >
        <span class="loading loading-spinner loading-md text-primary" />
        <span class="sr-only">Loading the newsfeed…</span>
      </div>

      <div
        v-else-if="!visibleItems.length"
        class="rounded-2xl border border-dashed border-base-300 bg-base-100 p-8 text-center"
      >
        <Icon
          name="kind-icon:news"
          class="mx-auto size-10 text-base-content/25"
        />
        <p class="mt-2 font-black">Nothing here yet</p>
        <p class="mt-1 text-sm text-base-content/55">
          The swarm hasn't published anything for this feed in a bit — check
          back soon.
        </p>
      </div>
    </div>

    <div
      v-if="!errorMessage && visibleItems.length"
      class="grid gap-3"
      :class="
        compact
          ? 'grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))]'
          : 'grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))]'
      "
    >
      <FeedCard
        v-for="item in displayedItems"
        :key="item.id"
        :item="item"
        :compact="compact"
      />
    </div>

    <button
      v-if="canShowMore"
      type="button"
      class="btn btn-ghost btn-sm mx-auto rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      @click="visibleLimit += pageSize"
    >
      Show more
    </button>

    <p v-if="sourceErrorCount" class="text-center text-xs text-base-content/40">
      {{ sourceErrorCount }} source{{ sourceErrorCount === 1 ? '' : 's' }}
      couldn't be reached this refresh — showing what did load.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  applyNewsfeedFilters,
  applyPerspectiveBalance,
  getFeedDefinition,
  type NewsFeedItem,
} from '@/stores/helpers/newsfeed'
import {
  ALL_FEEDS_SLUG,
  useFeedPreferenceStore,
} from '@/stores/feedPreferenceStore'

const props = withDefaults(
  defineProps<{
    /** Cap the initial number of visible cards (0 = show all). */
    initialLimit?: number
    /** Summary-less cards, for hosts where the feed is one section of many. */
    compact?: boolean
  }>(),
  {
    initialLimit: 0,
    compact: false,
  },
)

interface FeedGroup {
  slug: string
  title: string
  icon: string
  items: NewsFeedItem[]
}

interface AggregatedFeedResponse {
  slug: string
  items: NewsFeedItem[]
  sourceErrors: Array<{ sourceId: string; error: string }>
}

const feedPreferenceStore = useFeedPreferenceStore()

const isLoading = ref(false)
const errorMessage = ref('')
const groups = ref<FeedGroup[]>([])
const sourceErrorCount = ref(0)
const activeSlug = ref<string>(ALL_FEEDS_SLUG)
const showManageFeeds = ref(false)
const pageSize = 12
const visibleLimit = ref(props.initialLimit || pageSize)
let hasLoadedOnce = false

/*
 * The saved starting feed is applied exactly once, on the first load, and only
 * to a feed that actually came back. After that the tab is the reader's live
 * choice -- reapplying it on every refresh would yank someone out of the tab
 * they just clicked into.
 */
let hasAppliedStartingFeed = false

// Unfiltered union across every loaded feed -- also what NewsfeedFilters uses
// to derive its category chip list, so a category disappearing behind an
// active filter doesn't also remove the chip that would clear it.
const rawItems = computed<NewsFeedItem[]>(() => {
  const seen = new Set<string>()
  const merged: NewsFeedItem[] = []

  for (const group of groups.value) {
    for (const item of group.items) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      merged.push(item)
    }
  }

  return merged.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
})

function filterPrefs() {
  return {
    includeKeywords: feedPreferenceStore.includeKeywords,
    excludeKeywords: feedPreferenceStore.excludeKeywords,
    disabledSourceIds: feedPreferenceStore.disabledSourceIds,
    selectedCategories: feedPreferenceStore.selectedCategories,
    sortMode: feedPreferenceStore.sortMode,
  }
}

const allItems = computed<NewsFeedItem[]>(() =>
  applyPerspectiveBalance(
    applyNewsfeedFilters(rawItems.value, filterPrefs()),
    feedPreferenceStore.perspectiveWeights,
  ),
)

const visibleItems = computed<NewsFeedItem[]>(() => {
  if (activeSlug.value === ALL_FEEDS_SLUG) return allItems.value
  const groupItems =
    groups.value.find((group) => group.slug === activeSlug.value)?.items ?? []
  return applyPerspectiveBalance(
    applyNewsfeedFilters(groupItems, filterPrefs()),
    feedPreferenceStore.perspectiveWeights,
  )
})

const displayedItems = computed(() =>
  visibleItems.value.slice(0, visibleLimit.value),
)

const canShowMore = computed(
  () => visibleItems.value.length > displayedItems.value.length,
)

const startsHere = computed(
  () => feedPreferenceStore.startingFeedSlug === activeSlug.value,
)

const activeFeedTitle = computed(() =>
  activeSlug.value === ALL_FEEDS_SLUG
    ? 'All'
    : (groups.value.find((group) => group.slug === activeSlug.value)?.title ??
      activeSlug.value),
)

const pinLabel = computed(() =>
  startsHere.value ? 'Starts here' : 'Start here',
)

const pinTitle = computed(() =>
  startsHere.value
    ? `The newsfeed already opens on ${activeFeedTitle.value}. Click to go back to opening on All.`
    : `Open the newsfeed on ${activeFeedTitle.value} from now on.`,
)

function toggleStartingFeed(): void {
  feedPreferenceStore.setStartingFeed(
    startsHere.value ? ALL_FEEDS_SLUG : activeSlug.value,
  )
}

async function loadFeed(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''

  try {
    feedPreferenceStore.hydrate()
    const slugs = feedPreferenceStore.enabledFeedSlugs.length
      ? feedPreferenceStore.enabledFeedSlugs
      : feedPreferenceStore.availableFeeds.map((feed) => feed.slug)

    const res = await $fetch<
      {
        success: boolean
        message: string
        data: AggregatedFeedResponse[] | null
      },
      string
    >('/api/newsfeed', {
      query: slugs.length ? { feeds: slugs.join(',') } : undefined,
    })

    if (!res?.success || !res.data) {
      throw new Error(res?.message || 'Failed to load the newsfeed.')
    }

    groups.value = res.data.map((aggregated) => {
      const definition = getFeedDefinition(aggregated.slug)
      return {
        slug: aggregated.slug,
        title: definition?.title || aggregated.slug,
        icon: definition?.icon || 'kind-icon:news',
        // Stamped here (not by the server) so applyPerspectiveBalance can
        // gate on a merged, multi-feed list without needing feed context.
        items: aggregated.items.map((item) => ({
          ...item,
          topicPolitical: definition?.topicPolitical ?? false,
        })),
      }
    })
    sourceErrorCount.value = res.data.reduce(
      (sum, aggregated) => sum + aggregated.sourceErrors.length,
      0,
    )

    if (!hasAppliedStartingFeed) {
      hasAppliedStartingFeed = true
      const preferred = feedPreferenceStore.startingFeedSlug
      if (
        preferred !== ALL_FEEDS_SLUG &&
        groups.value.some((group) => group.slug === preferred)
      ) {
        activeSlug.value = preferred
      }
    }

    if (
      activeSlug.value !== ALL_FEEDS_SLUG &&
      !groups.value.some((g) => g.slug === activeSlug.value)
    ) {
      activeSlug.value = ALL_FEEDS_SLUG
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Failed to load the newsfeed.'
  } finally {
    isLoading.value = false
    hasLoadedOnce = true
  }
}

watch(activeSlug, () => {
  visibleLimit.value = props.initialLimit || pageSize
})

// Reordering only changes array position, but .join(',') still changes since
// it's order-sensitive -- catches both membership and reorder edits made via
// NewsfeedPreferences. Ignored until the first load resolves, so hydrate()'s
// own initial mutation (inside loadFeed) can't trigger a redundant refetch.
watch(
  () => feedPreferenceStore.enabledFeedSlugs.join(','),
  () => {
    if (!hasLoadedOnce) return
    void loadFeed()
  },
)

onMounted(() => {
  void loadFeed()
})
</script>
