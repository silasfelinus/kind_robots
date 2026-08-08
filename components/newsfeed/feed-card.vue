<!-- /components/newsfeed/feed-card.vue -->
<template>
  <component
    :is="allowNavigation ? 'a' : 'article'"
    :href="allowNavigation ? item.url : undefined"
    :target="allowNavigation ? '_blank' : undefined"
    :rel="allowNavigation ? 'noopener noreferrer' : undefined"
    class="group flex h-full flex-col gap-2 overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3 shadow-sm transition-shadow duration-300 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 motion-safe:hover:-translate-y-0.5 motion-safe:transition-transform"
  >
    <kr-entity-card-body
      class="flex flex-1 flex-col"
      :title="item.title"
      :description="item.summary || undefined"
      :show-description="Boolean(item.summary)"
      :show-image="showImage"
      :source="imageSource"
      variant="hero"
      :fallback="fallbackImageSrc"
      hover-zoom
      :badges="badges"
    >
      <div
        class="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1"
      >
        <span class="flex min-w-0 items-center gap-1.5">
          <span
            class="truncate text-xs font-bold text-base-content/55"
            :title="item.source"
          >
            {{ item.source }}
          </span>
          <span
            v-if="perspectiveLabel"
            class="badge badge-ghost badge-xs shrink-0 gap-1 rounded-xl border-base-300"
            :title="`Perspective rating from ${item.perspective?.source} — political-lean labels are provenance, not fact.`"
          >
            {{ perspectiveLabel }}
          </span>
        </span>
        <span
          class="flex shrink-0 items-center gap-1 text-xs text-base-content/45"
        >
          <Icon name="kind-icon:clock" class="size-3" />
          <time
            :datetime="item.publishedAt"
            :title="absoluteTime(item.publishedAt)"
          >
            {{ relativeTime(item.publishedAt) }}
          </time>
          <Icon
            v-if="allowNavigation"
            name="kind-icon:external-link"
            class="size-3"
          />
        </span>
      </div>
    </kr-entity-card-body>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { NewsFeedItem } from '@/stores/helpers/newsfeed'
import { useFeedPreferenceStore } from '@/stores/feedPreferenceStore'
import type { EntityCardChip } from '@/components/gallery/kr-entity-card-body.vue'
import type { ArtImageSrcLike } from '@/utils/artImageSrc'

const props = withDefaults(
  defineProps<{
    item: NewsFeedItem
    showImage?: boolean
    allowNavigation?: boolean
  }>(),
  {
    showImage: true,
    allowNavigation: true,
  },
)

const feedPreferenceStore = useFeedPreferenceStore()

const primaryCategory = computed(() => props.item.category?.[0] || '')

// NewsFeedItem carries a plain `image` URL rather than the cardPath/heroPath/
// iconPath shape most art-bearing records use -- kr-art-plate's resolver
// chain falls through to `imagePath` for any variant that has no dedicated
// path of its own, so wrapping it here is enough to reuse the same plate/
// fallback/retry-on-error logic every other card gets instead of hand-rolling
// a second <img>-with-@error pair.
const imageSource = computed<ArtImageSrcLike>(() => ({
  imagePath: props.item.image || null,
}))

const badges = computed<EntityCardChip[]>(() =>
  primaryCategory.value ? [{ label: primaryCategory.value }] : [],
)

// A repeating flat icon on every image-less card reads as "a sea of empty
// boxes" (Silas, 2026-07-25) -- pick one of 8 default illustrations per item
// instead, deterministic on item.id so a given item's card doesn't flicker
// between defaults across re-renders.
const DEFAULT_IMAGE_COUNT = 8
const fallbackImageSrc = computed(() => {
  let hash = 0
  for (let i = 0; i < props.item.id.length; i++) {
    hash = (hash * 31 + props.item.id.charCodeAt(i)) | 0
  }
  const index = (Math.abs(hash) % DEFAULT_IMAGE_COUNT) + 1
  return `/images/newsfeed/defaults/default-${String(index).padStart(2, '0')}.webp`
})

// "show or hide perspective labels" (BIAS-CONTROLS.md) -- never shown when
// no source-level rating exists ("unrated sources remain usable and
// visibly unrated": no label here just means no label, not "neutral").
const perspectiveLabel = computed(() => {
  if (!feedPreferenceStore.labelsVisible) return ''
  const label = props.item.perspective?.label
  if (!label) return ''
  return label
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('-')
})

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(diffMs)) return ''

  const minutes = Math.round(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.round(days / 30)
  return `${months}mo ago`
}

function absoluteTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
</script>
