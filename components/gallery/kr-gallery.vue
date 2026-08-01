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
  <div class="flex h-full min-h-0 w-full flex-col gap-3">
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

    <div class="min-h-0 flex-1 overflow-y-auto">
      <div v-if="loading && !items.length" class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div v-for="n in skeletonCount" :key="n" class="h-56 animate-pulse rounded-2xl bg-base-200" />
      </div>

      <div v-else-if="error" class="flex min-h-64 flex-col items-center justify-center gap-2 text-error">
        <Icon name="kind-icon:warning" class="size-10" />
        <b>{{ error }}</b>
      </div>

      <div v-else-if="!items.length" class="flex min-h-64 flex-col items-center justify-center text-center">
        <Icon name="kind-icon:cards" class="size-12 text-base-content/20" />
        <b>No {{ emptyLabel }}.</b>
      </div>

      <section v-else :class="gridClass">
        <button
          v-for="item in items"
          :key="item.id"
          type="button"
          class="group overflow-hidden rounded-2xl border border-base-300 bg-base-200 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
          :class="itemClass"
          @click="emit('open', item)"
        >
          <div class="relative overflow-hidden" :class="imageWrapClass">
            <img
              :src="displayImage(item)"
              :alt="item.title"
              class="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div class="absolute inset-0 bg-linear-to-t from-base-300/90 via-transparent to-transparent" />
            <div v-if="item.badges?.length" class="absolute left-2 top-2 flex gap-1">
              <span v-for="badge in item.badges" :key="badge.label" class="badge badge-xs" :class="badge.class">
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
            <div class="flex items-start gap-2" :class="mode === 'icons' ? 'justify-center' : ''">
              <div class="min-w-0 flex-1">
                <h2 class="truncate font-black">{{ item.title }}</h2>
                <p v-if="mode !== 'icons' && item.description" class="line-clamp-2 text-xs text-base-content/55">
                  {{ item.description }}
                </p>
              </div>
              <slot name="item-trailing" :item="item" />
            </div>
            <p v-if="mode !== 'icons' && item.meta" class="mt-2 text-xs text-base-content/45">{{ item.meta }}</p>
            <div
              v-if="mode !== 'icons' && item.progressPercent !== undefined"
              class="mt-1.5 h-1 overflow-hidden rounded-full bg-base-content/10"
            >
              <div class="h-full bg-primary" :style="{ width: `${item.progressPercent}%` }" />
            </div>
          </div>
        </button>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type GalleryMode = 'cards' | 'heroes' | 'icons' | 'list'

export interface GalleryModeOption {
  value: GalleryMode
  label: string
  abbr: string
}

export interface GalleryItem {
  id: string | number
  title: string
  description?: string
  icon?: string
  card?: string
  hero?: string
  meta?: string
  progressPercent?: number
  badges?: Array<{ label: string; class?: string }>
}

const DEFAULT_GALLERY_MODES: GalleryModeOption[] = [
  { value: 'cards', label: 'Cards', abbr: 'C' },
  { value: 'heroes', label: 'Heroes', abbr: 'H' },
  { value: 'icons', label: 'Icons', abbr: 'I' },
  { value: 'list', label: 'List', abbr: 'L' },
]

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
    modes: () => DEFAULT_GALLERY_MODES,
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

const gridClass = computed(() =>
  props.mode === 'list'
    ? 'flex flex-col gap-2'
    : props.mode === 'heroes'
      ? 'grid gap-4 lg:grid-cols-2'
      : props.mode === 'icons'
        ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5'
        : 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
)
const itemClass = computed(() => (props.mode === 'list' ? 'grid md:grid-cols-[12rem_1fr]' : ''))
const imageWrapClass = computed(() =>
  props.mode === 'heroes'
    ? 'min-h-64'
    : props.mode === 'icons'
      ? 'mx-auto mt-3 size-24 rounded-2xl'
      : props.mode === 'list'
        ? 'min-h-40'
        : 'aspect-[4/3]',
)
function displayImage(item: GalleryItem): string {
  const variant = props.mode === 'heroes' || props.mode === 'list' ? item.hero : props.mode === 'icons' ? item.icon : item.card
  return variant || item.card || item.icon || item.hero || ''
}
</script>
