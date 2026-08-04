<!-- /components/gallery/kr-gallery.vue -->
<!--
  Shared browse/filter gallery shell, extracted from the proven recipe in
  conductor-project-gallery-page.vue (interface-vision/t-008): one scroll
  owner, four view modes driven off three computed class strings, aspect-
  locked art with a hover-scale scrim, and skeleton/error/empty states.
  Purely presentational and controlled -- the parent owns data fetching,
  filtering, and mode persistence (see stores/galleryPreferenceStore.ts).
-->
<template>
  <div class="flex w-full flex-col gap-3">
    <div v-if="modes.length" class="flex shrink-0 gap-0.5">
      <button
        v-for="entry in modes"
        :key="entry.value"
        type="button"
        class="btn btn-xs px-2"
        :class="mode === entry.value ? 'btn-primary' : 'btn-ghost'"
        :title="entry.label"
        @click="emit('update:mode', entry.value)"
      >
        {{ entry.abbr }}
      </button>
    </div>

    <div
      v-if="loading && !items.length"
      class="grid grid-cols-2 gap-3 lg:grid-cols-4"
    >
      <div
        v-for="n in skeletonCount"
        :key="n"
        class="h-56 animate-pulse rounded-2xl bg-base-200"
      />
    </div>

    <div
      v-else-if="error"
      class="flex min-h-64 flex-col items-center justify-center gap-2 text-error"
    >
      <Icon name="kind-icon:warning" class="size-10" />
      <b>{{ error }}</b>
    </div>

    <div
      v-else-if="!items.length"
      class="flex min-h-64 flex-col items-center justify-center text-center"
    >
      <Icon name="kind-icon:cards" class="size-12 text-base-content/20" />
      <b>No {{ emptyLabel }}.</b>
    </div>

    <section v-else :class="gridClass">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        class="group overflow-hidden rounded-2xl border border-base-300 bg-base-200 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
        @click="emit('open', item)"
      >
        <div class="relative overflow-hidden" :class="imageWrapClass">
          <img
            v-if="artSrc(item)"
            :src="artSrc(item)"
            :alt="item.title"
            class="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
            @error="onArtError(artSrc(item))"
          />
          <!-- Art-absent placeholder. Without this an unillustrated row renders
               <img src="">, which browsers treat as "reload the current page"
               and paint as a broken image. Galleries whose rows are routinely
               unillustrated (facets, where art is queued rather than required)
               could not adopt this shell at all until it degraded properly.

               It now also covers art that is PRESENT but fails to load, which
               is a different failure with the same remedy: a broken <img>
               paints its alt text inside the layout box where the art should
               be, so a card whose art 404s renders its title sprawling across
               the artwork area. That is interface-vision t-069 -- reported as
               "description text renders over the card art", reproduced against
               production 2026-08-03, and invisible to source review because
               nothing in the markup is wrong. It only exists while art is
               missing, which right now is common: art is still generating. -->
          <div
            v-else
            class="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-linear-to-br from-base-200 to-base-300 text-base-content/40"
          >
            <Icon
              :name="item.placeholderIcon || 'kind-icon:image'"
              class="size-8"
            />
            <span
              v-if="item.placeholderLabel"
              class="text-[10px] uppercase tracking-wide"
            >
              {{ item.placeholderLabel }}
            </span>
          </div>
          <div
            class="absolute inset-0 bg-linear-to-t from-base-300/90 via-transparent to-transparent"
          />
          <div
            v-if="item.badges?.length"
            class="absolute left-2 top-2 flex gap-1"
          >
            <span
              v-for="badge in item.badges"
              :key="badge.label"
              class="badge badge-xs"
              :class="badge.class"
            >
              {{ badge.label }}
            </span>
          </div>
          <img
            v-if="mode !== 'icons' && item.icon"
            :src="item.icon"
            alt=""
            class="absolute bottom-2 left-2 size-11 rounded-xl border border-white/25 object-cover shadow"
          />
        </div>
        <div class="p-3" :class="mode === 'icons' ? 'text-center' : ''">
          <div
            class="flex items-start gap-2"
            :class="mode === 'icons' ? 'justify-center' : ''"
          >
            <div class="min-w-0 flex-1">
              <h2 class="truncate font-black">{{ item.title }}</h2>
              <p
                v-if="mode !== 'icons' && item.description"
                class="line-clamp-2 text-xs text-base-content/55"
              >
                {{ item.description }}
              </p>
            </div>
            <slot name="item-trailing" :item="item" />
          </div>
          <p
            v-if="mode !== 'icons' && item.meta"
            class="mt-2 text-xs text-base-content/45"
          >
            {{ item.meta }}
          </p>
          <div
            v-if="mode !== 'icons' && item.progressPercent !== undefined"
            class="mt-1.5 h-1 overflow-hidden rounded-full bg-base-content/10"
          >
            <div
              class="h-full bg-primary"
              :style="{ width: `${item.progressPercent}%` }"
            />
          </div>
        </div>
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  resolveArtVariantSrc,
  type ArtImageSrcLike,
  type ArtVariant,
} from '@/utils/artImageSrc'

// The vocabulary lives in utils/galleryVocabulary.ts — a plain module, because
// <script setup> cannot carry value exports and because four other components
// need these without importing a component. Re-exported here so existing
// `import type { GalleryMode } from '.../kr-gallery.vue'` call sites keep
// working; new code should import from the util directly.
import {
  GALLERY_MODES,
  MODE_GRID_CLASS,
  MODE_VARIANT,
  type GalleryMode,
  type GalleryModeOption,
} from '@/utils/galleryVocabulary'

export type { GalleryMode, GalleryModeOption }

export interface GalleryItem {
  id: string | number
  title: string
  description?: string
  /*
   * Pre-resolved variant URLs. Use these when the caller's resolution is
   * genuinely domain-specific -- conductor-project-gallery-page.vue, for one,
   * merges a remote conductor record, detects canonical paths and appends a
   * cache-busting revision, none of which a generic resolver can do.
   */
  icon?: string
  card?: string
  hero?: string
  /*
   * The raw record instead, for the ordinary case. kr-gallery resolves it
   * through resolveArtVariantSrc, so a consumer stops hand-rolling the
   * cardPath || imagePath || heroPath || iconPath chain -- six components were
   * each carrying their own copy of exactly that when this was added.
   */
  source?: ArtImageSrcLike
  meta?: string
  progressPercent?: number
  badges?: Array<{ label: string; class?: string }>
  /** Shown when nothing resolves. Defaults to a generic image glyph. */
  placeholderIcon?: string
  placeholderLabel?: string
}

const props = withDefaults(
  defineProps<{
    items: GalleryItem[]
    mode?: GalleryMode
    modes?: GalleryModeOption[]
    loading?: boolean
    error?: string
    emptyLabel?: string
    skeletonCount?: number
  }>(),
  {
    mode: 'cards',
    modes: () => [...GALLERY_MODES],
    loading: false,
    error: '',
    emptyLabel: 'items',
    skeletonCount: 8,
  },
)

const emit = defineEmits<{
  open: [item: GalleryItem]
  'update:mode': [mode: GalleryMode]
}>()

const gridClass = computed(() => MODE_GRID_CLASS[props.mode])
const imageWrapClass = computed(() =>
  props.mode === 'heroes'
    ? 'min-h-64'
    : props.mode === 'icons'
      ? 'mx-auto mt-3 size-24 rounded-2xl'
      : 'aspect-[4/3]',
)
const modeVariant = computed<ArtVariant>(() => MODE_VARIANT[props.mode])

/**
 * Sources that 404'd or otherwise failed. Keyed by URL rather than item id, so
 * one missing file is remembered across a mode switch that re-resolves the same
 * path, and two items sharing a placeholder path fail once between them.
 */
const failedArt = ref(new Set<string>())

/** The art to show, or '' when there is none — including "there was, and it broke". */
function artSrc(item: GalleryItem): string {
  const src = displayImage(item)
  return src && !failedArt.value.has(src) ? src : ''
}

function onArtError(src: string): void {
  if (!src || failedArt.value.has(src)) return
  // A fresh Set: mutating in place would not trip reactivity, and the card
  // would keep rendering its broken <img> with the alt text showing.
  failedArt.value = new Set(failedArt.value).add(src)
}

function displayImage(item: GalleryItem): string {
  const preResolved =
    modeVariant.value === 'hero'
      ? item.hero
      : modeVariant.value === 'icon'
        ? item.icon
        : item.card

  // A caller that pre-resolved wins outright; only fall back across variants
  // for callers that pre-resolved SOME of them.
  if (preResolved) return preResolved
  if (item.source) return resolveArtVariantSrc(item.source, modeVariant.value)
  return item.card || item.icon || item.hero || ''
}
</script>
