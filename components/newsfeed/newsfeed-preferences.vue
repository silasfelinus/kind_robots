<!-- /components/newsfeed/newsfeed-preferences.vue -->
<!--
  Manage-feeds panel for the recommended newsfeed (conductor projects/newsfeed
  t-007). Lets a user enable/disable recommended feeds and reorder the
  enabled ones. Reads and writes stores/feedPreferenceStore (t-004) directly
  -- no new schema, localStorage-backed like the rest of that store.
-->
<template>
  <div class="kr-panel-flat p-4">
    <div class="mb-3 flex items-center justify-between gap-3">
      <div>
        <h3 class="font-black">Manage feeds</h3>
        <p class="text-xs text-base-content/55">
          Choose which feeds appear and the order they're shown in.
        </p>
      </div>
      <button
        type="button"
        class="btn btn-ghost btn-xs rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        @click="feedPreferenceStore.resetToDefaults()"
      >
        Reset to defaults
      </button>
    </div>

    <ul class="flex flex-col divide-y divide-base-300">
      <li
        v-for="(feed, index) in enabledFeeds"
        :key="feed.slug"
        class="flex items-center justify-between gap-3 py-2.5"
      >
        <div class="flex min-w-0 items-center gap-2">
          <Icon :name="feed.icon" class="size-4 shrink-0 text-primary" />
          <div class="min-w-0">
            <span class="block truncate font-semibold">{{ feed.title }}</span>
            <span class="block truncate text-xs text-base-content/55">
              {{ feed.description }}
            </span>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-1">
          <button
            type="button"
            class="btn btn-ghost btn-xs px-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            :disabled="index === 0"
            :aria-label="`Move ${feed.title} up`"
            @click="moveFeed(feed.slug, -1)"
          >
            <Icon name="kind-icon:chevron-up" class="size-4" />
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-xs px-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            :disabled="index === enabledFeeds.length - 1"
            :aria-label="`Move ${feed.title} down`"
            @click="moveFeed(feed.slug, 1)"
          >
            <Icon name="kind-icon:chevron-down" class="size-4" />
          </button>
          <input
            type="checkbox"
            class="toggle toggle-primary toggle-sm ml-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            checked
            :aria-label="`Disable ${feed.title}`"
            @change="feedPreferenceStore.disableFeed(feed.slug)"
          />
        </div>
      </li>

      <li
        v-for="feed in availableFeeds"
        :key="feed.slug"
        class="flex items-center justify-between gap-3 py-2.5 opacity-70"
      >
        <div class="flex min-w-0 items-center gap-2">
          <Icon :name="feed.icon" class="size-4 shrink-0" />
          <div class="min-w-0">
            <span class="block truncate font-semibold">{{ feed.title }}</span>
            <span class="block truncate text-xs text-base-content/55">
              {{ feed.description }}
            </span>
          </div>
        </div>

        <input
          type="checkbox"
          class="toggle toggle-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :aria-label="`Enable ${feed.title}`"
          @change="feedPreferenceStore.enableFeed(feed.slug)"
        />
      </li>
    </ul>

    <p
      v-if="!enabledFeeds.length"
      class="pt-2 text-center text-xs text-base-content/55"
    >
      No feeds enabled — turn one on above to see it here.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFeedPreferenceStore } from '@/stores/feedPreferenceStore'

const feedPreferenceStore = useFeedPreferenceStore()

const enabledFeeds = computed(() => feedPreferenceStore.enabledFeeds)
const availableFeeds = computed(() => feedPreferenceStore.availableFeeds)

function moveFeed(slug: string, direction: -1 | 1): void {
  const order = [...feedPreferenceStore.enabledFeedSlugs]
  const index = order.indexOf(slug)
  const swapIndex = index + direction
  if (index < 0 || swapIndex < 0 || swapIndex >= order.length) return
  const current = order[index]
  const swapped = order[swapIndex]
  if (current === undefined || swapped === undefined) return
  order[index] = swapped
  order[swapIndex] = current
  feedPreferenceStore.reorderFeeds(order)
}
</script>
