<!-- /components/newsfeed/feed-card.vue -->
<template>
  <component
    :is="allowNavigation ? 'a' : 'article'"
    :href="allowNavigation ? item.url : undefined"
    :target="allowNavigation ? '_blank' : undefined"
    :rel="allowNavigation ? 'noopener noreferrer' : undefined"
    class="group flex h-full flex-col overflow-hidden kr-panel-flat shadow-sm transition-shadow duration-300 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 motion-safe:hover:-translate-y-0.5 motion-safe:transition-transform"
    :class="compact ? 'gap-1 p-2' : 'gap-2 p-3'"
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
      <!--
        ONE THIN LINE OF PROVENANCE. Silas, 2026-08-29: "I need more of the
        title and description in the news feeds, way too much space is given to
        origin, date and a return icon, we need an image and info. These aren't
        that."

        What went: the wrapping two-column row (source left, time right, each
        free to claim a line of its own), the clock glyph, and the
        external-link glyph. The card is a whole <a> to an external site, so
        the arrow was decoration explaining what the entire card already is,
        and the clock explained a string that reads "6h ago".

        What stayed: the source, the time, and the perspective label -- the
        last because BIAS-CONTROLS.md requires the rating to be visible
        wherever a rated item is, not because it fits. All three now share one
        truncating line at the smallest legible size, which returns roughly two
        lines of card to the title and summary above.
      -->
      <div
        class="mt-auto flex min-w-0 items-center gap-1.5 pt-1 text-[0.65rem] text-base-content/45"
      >
        <span class="truncate font-bold" :title="item.source">
          {{ item.source }}
        </span>
        <span
          v-if="perspectiveLabel"
          class="shrink-0 rounded border border-base-300 px-1 font-bold"
          :title="`Perspective rating from ${item.perspective?.source} — political-lean labels are provenance, not fact.`"
        >
          {{ perspectiveLabel }}
        </span>
        <time
          class="ml-auto shrink-0 tabular-nums"
          :datetime="item.publishedAt"
          :title="absoluteTime(item.publishedAt)"
        >
          {{ relativeTime(item.publishedAt) }}
        </time>
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
import { defaultArtFor } from '@/utils/defaultArtPool'

const props = withDefaults(
  defineProps<{
    item: NewsFeedItem
    showImage?: boolean
    allowNavigation?: boolean
    /**
     * Tightens the card's own padding and gaps for the home page, where the
     * feed sits alongside eight other sections.
     *
     * IT NO LONGER DROPS THE SUMMARY. It used to, to buy height back for the
     * two-screen budget -- and that was the wrong thing to cut. Silas,
     * 2026-08-29: "I need more of the title and description in the news feeds,
     * way too much space is given to origin, date and a return icon." The
     * height came back out of the provenance row instead, which was spending
     * two lines on a source name and a timestamp.
     */
    compact?: boolean
  }>(),
  {
    showImage: true,
    allowNavigation: true,
    compact: false,
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
// boxes" (Silas, 2026-07-25) -- pick a default illustration per item instead,
// deterministic on item.id so a given item's card doesn't flicker between
// defaults across re-renders.
//
// The pool itself moved to utils/defaultArtPool.ts when the home page grew
// rails that need the same stand-ins (Silas, 2026-08-28: "I need more default
// art if we don't have an image to go with the article"). The hash lives there
// now; this is the same behaviour over a bigger, shared pool.
const fallbackImageSrc = computed(() => defaultArtFor(props.item.id))

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
