<!-- /components/resources/resource-art-gallery.vue -->
<!--
  Every image that belongs to a Resource, not just the one on its card.

  Silas, 2026-09-17: "we are only seeing a single resource image when we should
  see any that are made with that resource, including civitai image(s)."

  The relation was always there -- ArtImage.LoraResources records which LoRAs
  an image was rendered with -- and nothing ever read it back from the Resource
  side, so a LoRA with two hundred renders showed exactly one picture. The
  Civitai preview is a URL rather than an ArtImage row, so it is shown beside
  them and never offered as something to act on.

  ON kr-gallery, ONE PER ORIGIN. Origins are groups, not filters: an image is
  routinely both the generated preview and a LoRA use, and each is a browse
  grid of the same object, so each is a <kr-gallery>. The route gallery
  contract is the reason -- a first version hand-rolled its own grid and
  verifyRouteGalleryContract.ts caught it, correctly: a second grid of art with
  its own tile markup is exactly the drift kr-gallery exists to prevent, and
  taking the shared shell also takes `source` resolution, progressive
  hydration, and the empty and error states for free.

  No mode switcher: this lives inside a card back, where four extra buttons per
  group would be louder than the pictures. Density is fixed compact.

  PRESENTATION ONLY. The fetch, the cache and the error live in
  resourceGalleryStore, which already owns deleteResource. AGENTS.md:
  "Components never call APIs or localStorage directly. Stores own API calls,
  localStorage, and state. This is the rule most often broken by well-meaning
  edits" -- and a first version broke it here, reaching for performFetch
  directly while its sibling delete path was correctly in the store.
-->
<template>
  <section class="mt-4">
    <header class="mb-2 flex items-center justify-between gap-2">
      <h4 class="kr-text-eyebrow opacity-55">
        Gallery
        <span v-if="totalCount" class="opacity-70">({{ totalCount }})</span>
      </h4>

      <button
        v-if="!loading && loaded"
        type="button"
        class="btn btn-ghost btn-xs rounded-lg"
        @click="refresh"
      >
        <Icon name="kind-icon:refresh" class="kr-icon-3-5" />
        Refresh
      </button>
    </header>

    <!--
      The loading, empty and error states are the shell's. A single group
      renders them when there is nothing yet, so this file never draws a
      spinner or an empty state of its own.
    -->
    <kr-gallery
      v-if="loading || error || !groups.length"
      :items="[]"
      :modes="[]"
      density="xs"
      :loading="loading"
      :error="error"
      :skeleton-count="4"
      empty-label="images for this resource yet"
    />

    <div v-else class="space-y-3">
      <div v-for="group in groups" :key="group.key">
        <p class="mb-1 text-[0.65rem] uppercase tracking-wide opacity-50">
          {{ group.label }}
          <span class="opacity-70">({{ group.items.length }})</span>
        </p>

        <kr-gallery
          :items="group.items"
          :modes="[]"
          density="xs"
          empty-label="images"
          @open="openItem(group.key, $event)"
        />
      </div>

      <!--
        THE PICKED IMAGE, AND WHAT CAN BE DONE WITH IT. Silas, 2026-09-18: "we
        should be able to select them and modify them, even if they come from a
        civitai sample."

        A bar rather than per-tile buttons: the tiles are xs-density thumbnails
        and a button on each would be bigger than the picture. One selection,
        one row of actions, and it only exists once something is picked.
      -->
      <div
        v-if="selected"
        class="flex flex-wrap items-center gap-2 rounded-2xl border border-primary/40 bg-primary/5 p-2"
      >
        <p class="kr-text-dim-sm min-w-0 flex-1 truncate">
          {{ selectedLabel }}
        </p>

        <button
          type="button"
          class="btn btn-primary btn-xs rounded-2xl"
          :disabled="sourceBusy"
          @click="useSelectedAsSource"
        >
          <span v-if="sourceBusy" class="kr-loading-primary-xs" />
          Use as source
        </button>

        <a
          v-if="selectedUrl"
          :href="selectedUrl"
          target="_blank"
          rel="noopener"
          class="btn btn-ghost btn-xs rounded-2xl"
        >
          Open original
        </a>

        <button
          type="button"
          class="btn btn-ghost btn-xs rounded-2xl"
          @click="selected = null"
        >
          Clear
        </button>
      </div>

      <p
        v-if="sourceMessage"
        class="kr-text-dim-sm"
        :class="sourceMessageClass"
      >
        {{ sourceMessage }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { GalleryItem } from '@/components/gallery/kr-gallery.vue'
import { useArtStore } from '@/stores/artStore'
import {
  useResourceGalleryStore,
  type ResourceArtImage,
  type ResourceUpstreamPreview,
} from '@/stores/resourceGalleryStore'

const props = defineProps<{ resourceId: number }>()
const emit = defineEmits<{ (event: 'select', artImageId: number): void }>()

const resourceGalleryStore = useResourceGalleryStore()
const artStore = useArtStore()

const payload = computed(
  () => resourceGalleryStore.resourceArt[props.resourceId] ?? null,
)
const loading = computed(
  () => resourceGalleryStore.resourceArtLoading[props.resourceId] === true,
)
const error = computed(
  () => resourceGalleryStore.resourceArtError[props.resourceId] ?? '',
)
const loaded = computed(() => payload.value !== null)

/*
 * ORIGIN ORDER IS THE READING ORDER. The generated preview is the card's own
 * image and the obvious anchor; Civitai's preview is what the LoRA shipped
 * with; then the actual body of work. "Used with this LoRA" last would bury
 * the answer to the question that prompted this.
 */
const ORIGIN_LABELS: Record<string, string> = {
  preview: 'Generated preview',
  civitai: 'From Civitai',
  lora: 'Made with this LoRA',
  checkpoint: 'Made with this checkpoint',
  entity: 'Art history',
}

const ORIGIN_ORDER = ['preview', 'civitai', 'lora', 'checkpoint', 'entity']

/** An image belongs to exactly one heading: its highest-priority origin. */
function primaryOrigin(image: ResourceArtImage): string {
  let best = ORIGIN_ORDER.length
  for (const origin of image.origins) {
    const rank = ORIGIN_ORDER.indexOf(origin)
    if (rank !== -1 && rank < best) best = rank
  }
  return ORIGIN_ORDER[best] ?? 'entity'
}

const groups = computed<{ key: string; label: string; items: GalleryItem[] }[]>(
  () => {
    const data = payload.value
    if (!data) return []

    const out: { key: string; label: string; items: GalleryItem[] }[] = []

    for (const origin of ORIGIN_ORDER) {
      if (origin === 'civitai') {
        /*
         * The whole upstream set, not just the one url on the Resource row.
         * previewImageUrl is the card's single face and is normally the first
         * of these, so it is only added when the list does not already carry
         * it -- showing the cover twice made the count look inflated.
         */
        const upstream: ResourceUpstreamPreview[] = data.upstreamPreviews ?? []
        const items: GalleryItem[] = upstream.map((preview) => ({
          id: `upstream-${preview.id}`,
          title:
            preview.mediaType === 'video' ? 'Civitai video' : 'Civitai preview',
          // A bare URL, not an ArtImage: `card` takes the resolved path
          // directly, where `source` would resolve a row this has none of.
          card: preview.url,
          meta: 'Opens on civitai.com',
          badges: preview.isMature
            ? [{ label: '18+', class: 'badge-error' }]
            : undefined,
        }))

        const cover = data.civitaiPreviewUrl
        if (cover && !upstream.some((preview) => preview.url === cover)) {
          items.unshift({
            id: 'civitai',
            title: 'Civitai preview',
            card: cover,
            meta: 'Opens on civitai.com',
          })
        }

        if (!items.length) continue
        out.push({
          key: 'civitai',
          label: ORIGIN_LABELS.civitai as string,
          items,
        })
        continue
      }

      const items = data.images
        .filter((image) => primaryOrigin(image) === origin)
        .map<GalleryItem>((image) => ({
          id: image.id,
          title: image.promptString || image.fileName || `Image ${image.id}`,
          // Let the shell resolve the variant. A hand-rolled path order is how
          // the object card ended up drawing empty frames.
          source: image,
          badges: image.isMature
            ? [{ label: '18+', class: 'badge-error' }]
            : undefined,
        }))

      if (items.length) {
        out.push({ key: origin, label: ORIGIN_LABELS[origin] as string, items })
      }
    }

    return out
  },
)

const totalCount = computed(() =>
  groups.value.reduce((sum, group) => sum + group.items.length, 0),
)

function refresh(): void {
  void resourceGalleryStore.loadResourceArt(props.resourceId, { force: true })
}

/*
 * A CLICK NOW SELECTS RATHER THAN LEAVING.
 *
 * Clicking an upstream preview used to open Civitai in a new tab, which is the
 * one thing you cannot then do anything with. It selects instead, and "Open
 * original" is still there in the action bar for when leaving IS the intent.
 */
const selected = ref<{ groupKey: string; item: GalleryItem } | null>(null)
const sourceMessage = ref('')
const sourceFailed = ref(false)

const sourceMessageClass = computed(() =>
  sourceFailed.value ? 'text-error' : 'text-success',
)

/** Upstream previews carry their url in `card`; generated rows do not. */
const selectedUrl = computed<string>(() => {
  const item = selected.value?.item
  if (selected.value?.groupKey !== 'civitai') return ''
  return typeof item?.card === 'string' ? item.card : ''
})

const selectedPreviewId = computed<number | null>(() => {
  if (selected.value?.groupKey !== 'civitai') return null
  const id = String(selected.value.item.id ?? '')
  const parsed = Number(id.replace(/^upstream-/, ''))
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
})

const selectedArtImageId = computed<number | null>(() =>
  typeof selected.value?.item.id === 'number' ? selected.value.item.id : null,
)

const selectedLabel = computed<string>(() => {
  if (!selected.value) return ''
  if (selectedPreviewId.value)
    return `Civitai sample #${selectedPreviewId.value}`
  return `Generated image #${selectedArtImageId.value}`
})

const sourceBusy = computed<boolean>(() => {
  if (selectedPreviewId.value) {
    return resourceGalleryStore.isSourceLoading(
      `preview:${selectedPreviewId.value}`,
    )
  }
  if (selectedArtImageId.value) {
    return resourceGalleryStore.isSourceLoading(
      `art:${selectedArtImageId.value}`,
    )
  }
  return false
})

function openItem(groupKey: string, item: GalleryItem): void {
  selected.value = { groupKey, item }
  sourceMessage.value = ''
  sourceFailed.value = false

  // The generated rows still tell the page which ArtImage is in hand, which is
  // what the resource card uses to swap its own face.
  if (groupKey !== 'civitai' && typeof item.id === 'number') {
    emit('select', item.id)
  }
}

async function useSelectedAsSource(): Promise<void> {
  if (!selected.value) return
  sourceMessage.value = ''
  sourceFailed.value = false

  try {
    const previewId = selectedPreviewId.value
    const dataUri = previewId
      ? await resourceGalleryStore.loadPreviewSource(previewId)
      : await resourceGalleryStore.loadArtImageSource(
          selectedArtImageId.value as number,
        )

    artStore.setSourceImage(dataUri, selectedLabel.value)
    sourceMessage.value = `${selectedLabel.value} is loaded as the source image for your next generation.`
  } catch (cause) {
    sourceFailed.value = true
    sourceMessage.value =
      cause instanceof Error
        ? cause.message
        : 'That image could not be loaded as a source.'
  }
}

watch(
  () => props.resourceId,
  (id) => {
    selected.value = null
    sourceMessage.value = ''
    void resourceGalleryStore.loadResourceArt(id)
  },
  { immediate: true },
)
</script>
