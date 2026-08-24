<!-- /components/gallery/kr-gallery.vue -->
<template>
  <div class="flex w-full flex-col gap-3" data-kr-gallery>
    <div
      v-if="modes.length || $slots.toolbar"
      class="sticky top-0 z-20 -mx-1 flex shrink-0 flex-wrap items-center gap-1 bg-(--kr-surface-sunken) px-1 py-1 backdrop-blur"
    >
      <div v-if="$slots.toolbar" class="min-w-0 flex-auto">
        <slot name="toolbar" />
      </div>

      <button
        v-for="entry in modes"
        :key="entry.value"
        type="button"
        class="btn btn-xs px-2"
        :class="mode === entry.value ? 'btn-primary' : 'btn-ghost'"
        :title="entry.label"
        :aria-label="entry.label"
        :aria-pressed="mode === entry.value"
        @click="emit('update:mode', entry.value)"
      >
        <Icon :name="entry.icon" class="h-3.5 w-3.5 shrink-0" />
        <span class="hidden lg:inline">{{ entry.label }}</span>
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
      <slot name="empty">
        <Icon name="kind-icon:cards" class="size-12 text-base-content/20" />
        <b>No {{ emptyLabel }}.</b>
      </slot>
    </div>

    <section v-else :class="gridClass" data-kr-gallery-grid>
      <template v-if="$slots.item">
        <div
          v-for="item in items"
          :key="`slot-${item.id}`"
          class="min-w-0"
          :style="itemVisibilityStyle"
          data-kr-gallery-item
        >
          <!--
            A custom card can have setup hooks, watchers, store reads, and API
            fallbacks that CSS `content-visibility` cannot suppress. Keep the
            full lightweight text index in the DOM immediately, but do not
            instantiate the custom component until the pooled viewport observer
            says this item is near enough to matter. The 1800px overscan lives
            in viewportHydration.ts and is shared with deferred images.
          -->
          <kr-viewport-gate @hydrate="hydrateSlotItem(item.id)">
            <slot
              v-if="hydratedSlotItems.has(item.id)"
              name="item"
              :item="item"
              :mode="mode"
              :art-src="artSrc(item)"
              :open="() => emit('open', item)"
            />

            <div
              v-else
              class="overflow-hidden rounded-2xl border border-(--kr-surface-border) bg-(--kr-surface)"
              :class="slotPlaceholderClass"
              data-kr-gallery-placeholder
            >
              <div
                v-if="mode !== 'icons'"
                class="bg-(--kr-surface-sunken)"
                :class="mode === 'heroes' ? 'aspect-video' : 'aspect-2/3'"
                aria-hidden="true"
              />

              <div
                class="min-w-0"
                :class="mode === 'icons' ? 'p-3' : 'p-3'"
              >
                <div
                  v-if="item.badges?.length"
                  class="mb-1 flex flex-wrap gap-1"
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
                <h2 class="break-words font-black leading-tight">
                  {{ item.title }}
                </h2>
                <p
                  v-if="item.description"
                  class="mt-0.5 line-clamp-2 text-xs text-base-content/55"
                >
                  {{ item.description }}
                </p>
                <p
                  v-if="item.meta"
                  class="mt-1.5 text-xs text-base-content/45"
                >
                  {{ item.meta }}
                </p>
              </div>
            </div>
          </kr-viewport-gate>
        </div>
      </template>

      <template v-else>
        <template v-for="item in items" :key="item.id">
          <button
            v-if="mode === 'icons'"
            type="button"
            :data-theme="themed ? itemTheme(item) : undefined"
            class="group flex min-w-0 items-center gap-3 rounded-2xl border border-(--kr-surface-border) bg-(--kr-surface) p-3 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
            :style="itemVisibilityStyle"
            data-kr-gallery-item
            @click="emit('open', item)"
          >
            <div
              class="relative size-16 shrink-0 overflow-hidden rounded-xl bg-(--kr-surface-sunken)"
            >
              <kr-deferred-image
                v-if="artSrc(item)"
                :src="artSrc(item)"
                :alt="item.title"
                class="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                @error="onArtError(artSrc(item))"
              />
              <div
                v-else
                class="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-linear-to-br from-base-200 to-base-300 text-base-content/40"
              >
                <Icon
                  :name="item.placeholderIcon || 'kind-icon:image'"
                  class="size-7"
                />
                <span
                  v-if="item.placeholderLabel"
                  class="text-[9px] uppercase tracking-wide"
                >
                  {{ item.placeholderLabel }}
                </span>
              </div>
            </div>

            <div class="min-w-0 flex-1">
              <div
                v-if="item.badges?.length"
                class="mb-1 flex flex-wrap gap-1"
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

              <div class="flex items-start gap-2">
                <div class="min-w-0 flex-1">
                  <h2 class="break-words font-black leading-tight">
                    {{ item.title }}
                  </h2>
                  <p
                    v-if="item.description"
                    class="mt-0.5 line-clamp-2 text-xs text-base-content/55"
                  >
                    {{ item.description }}
                  </p>
                </div>
                <slot name="item-trailing" :item="item" />
              </div>

              <p
                v-if="item.meta"
                class="mt-1.5 text-xs text-base-content/45"
              >
                {{ item.meta }}
              </p>
              <div
                v-if="item.progressPercent !== undefined"
                class="mt-1.5 h-1 overflow-hidden rounded-full bg-base-content/10"
              >
                <div
                  class="h-full bg-primary"
                  :style="{ width: `${item.progressPercent}%` }"
                />
              </div>
            </div>
          </button>

          <button
            v-else
            type="button"
            :data-theme="themed ? itemTheme(item) : undefined"
            class="group overflow-hidden rounded-2xl border border-(--kr-surface-border) bg-(--kr-surface) text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
            :style="itemVisibilityStyle"
            data-kr-gallery-item
            @click="emit('open', item)"
          >
            <div
              class="relative overflow-hidden bg-(--kr-surface-sunken)"
              :class="mode === 'cards' ? 'aspect-2/3' : 'aspect-video'"
            >
              <kr-deferred-image
                v-if="artSrc(item)"
                :src="artSrc(item)"
                :alt="item.title"
                class="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                @error="onArtError(artSrc(item))"
              />
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
                class="absolute left-2 top-2 flex flex-wrap gap-1"
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
              <kr-deferred-image
                v-if="item.icon && !failedArt.has(item.icon)"
                :src="item.icon"
                alt=""
                class="absolute bottom-2 left-2 size-11 rounded-xl border border-white/25 object-cover shadow"
                @error="onArtError(item.icon)"
              />
            </div>

            <div class="p-3">
              <div class="flex items-start gap-2">
                <div class="min-w-0 flex-1">
                  <h2 class="break-words font-black leading-tight">
                    {{ item.title }}
                  </h2>
                  <p
                    v-if="item.description"
                    class="line-clamp-2 text-xs text-base-content/55"
                  >
                    {{ item.description }}
                  </p>
                </div>
                <slot name="item-trailing" :item="item" />
              </div>
              <p v-if="item.meta" class="mt-2 text-xs text-base-content/45">
                {{ item.meta }}
              </p>
              <div
                v-if="item.progressPercent !== undefined"
                class="mt-1.5 h-1 overflow-hidden rounded-full bg-base-content/10"
              >
                <div
                  class="h-full bg-primary"
                  :style="{ width: `${item.progressPercent}%` }"
                />
              </div>
            </div>
          </button>
        </template>
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type CSSProperties } from 'vue'
import { resolveEntityTheme } from '@/utils/entityTheme'
import {
  resolveArtVariantSrc,
  type ArtImageSrcLike,
  type ArtVariant,
} from '@/utils/artImageSrc'
import {
  DENSITY_GRID_CLASS,
  GALLERY_MODES,
  MODE_GRID_CLASS,
  MODE_VARIANT,
  type GalleryDensity,
  type GalleryMode,
  type GalleryModeOption,
} from '@/utils/galleryVocabulary'

export type { GalleryDensity, GalleryMode, GalleryModeOption }

export interface GalleryItem {
  id: string | number
  title: string
  description?: string
  icon?: string
  card?: string
  hero?: string
  source?: ArtImageSrcLike
  meta?: string
  progressPercent?: number
  badges?: Array<{ label: string; class?: string }>
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
    themed?: boolean
    density?: GalleryDensity
  }>(),
  {
    mode: 'cards',
    modes: () => [...GALLERY_MODES],
    loading: false,
    error: '',
    emptyLabel: 'items',
    skeletonCount: 8,
    themed: false,
    density: undefined,
  },
)

const emit = defineEmits<{
  open: [item: GalleryItem]
  'update:mode': [mode: GalleryMode]
}>()

const gridClass = computed(() =>
  props.density
    ? DENSITY_GRID_CLASS[props.density]
    : MODE_GRID_CLASS[props.mode],
)

const itemVisibilityStyle = computed<CSSProperties>(() => ({
  contentVisibility: 'auto',
  containIntrinsicSize:
    props.mode === 'icons'
      ? 'auto 5rem'
      : props.mode === 'heroes'
        ? 'auto 14rem'
        : 'auto 24rem',
}))

const slotPlaceholderClass = computed(() =>
  props.mode === 'icons'
    ? 'min-h-20'
    : props.mode === 'heroes'
      ? 'min-h-56'
      : 'min-h-96',
)

const modeVariant = computed<ArtVariant>(() => MODE_VARIANT[props.mode])
const failedArt = ref(new Set<string>())
const hydratedSlotItems = ref(new Set<string | number>())

function hydrateSlotItem(id: string | number): void {
  if (hydratedSlotItems.value.has(id)) return
  hydratedSlotItems.value = new Set(hydratedSlotItems.value).add(id)
}

function artSrc(item: GalleryItem): string {
  const src = displayImage(item)
  return src && !failedArt.value.has(src) ? src : ''
}

function onArtError(src: string): void {
  if (!src || failedArt.value.has(src)) return
  failedArt.value = new Set(failedArt.value).add(src)
}

function displayImage(item: GalleryItem): string {
  const preResolved =
    modeVariant.value === 'hero'
      ? item.hero
      : modeVariant.value === 'icon'
        ? item.icon
        : item.card

  if (preResolved) return preResolved
  if (item.source) return resolveArtVariantSrc(item.source, modeVariant.value)
  return item.card || item.icon || item.hero || ''
}

function itemTheme(item: GalleryItem): string {
  return resolveEntityTheme({
    id: item.id,
    theme: (item.source as { theme?: string | null } | undefined)?.theme,
  })
}
</script>
