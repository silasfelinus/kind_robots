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
      The loading, empty and error states are the shell's. An empty gallery
      renders them, so this file never draws a spinner or an empty state of its
      own.
    -->
    <kr-gallery
      v-if="loading || error || !items.length"
      :items="[]"
      :modes="[]"
      density="xs"
      :loading="loading"
      :error="error"
      :skeleton-count="4"
      empty-label="images for this resource yet"
    />

    <div v-else class="space-y-3">
      <!--
        ONE GRID, NOT A STACK OF HEADINGS. Silas, 2026-09-18: "when i look at
        the resource, I shouldn't just see a single image on one row, we
        shouldn't just see the rest when scrolling."

        Origins were section headings, so a resource with one generated preview
        and ten Civitai samples spent a whole row on the single image and
        pushed the other ten below the fold -- the grid could fit all eleven in
        the space the first heading was using. Origin moves onto the tile as a
        badge: the same information, none of the vertical cost. Reading order
        is unchanged (generated first, then Civitai, then the body of work), it
        just flows instead of breaking.
      -->
      <p
        v-if="originSummary"
        class="text-[0.65rem] uppercase tracking-wide opacity-50"
      >
        {{ originSummary }}
      </p>

      <kr-gallery
        :items="items"
        :modes="[]"
        density="xs"
        empty-label="images"
        :reload-key="reloadKey"
        @open="openItem"
      />

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
          :disabled="sourceBusy || !canUseAsSource"
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
          v-if="canDeleteSelected"
          type="button"
          class="btn btn-ghost btn-xs rounded-2xl text-error"
          :class="{ 'btn-error text-error-content': deleteArmed }"
          :disabled="deleteBusy"
          :aria-label="`Delete image #${selectedArtImageId}`"
          @click="deleteSelected"
        >
          <span v-if="deleteBusy" class="kr-loading-primary-xs" />
          <Icon v-else name="kind-icon:trash" class="kr-icon-3-5" />
          {{ deleteArmed ? 'Confirm delete' : 'Delete' }}
        </button>

        <button
          type="button"
          class="btn btn-ghost btn-xs rounded-2xl"
          @click="clearSelection"
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
import { useUserStore } from '@/stores/userStore'
import {
  useResourceGalleryStore,
  type ResourceArtImage,
  type ResourceUpstreamPreview,
} from '@/stores/resourceGalleryStore'

const props = defineProps<{ resourceId: number }>()
const emit = defineEmits<{ (event: 'select', artImageId: number): void }>()

const resourceGalleryStore = useResourceGalleryStore()
const artStore = useArtStore()
const userStore = useUserStore()

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

/** Short, per-tile origin marks -- the headings these replace. */
const ORIGIN_BADGES: Record<string, string> = {
  preview: 'Generated',
  civitai: 'Civitai',
  lora: 'This LoRA',
  checkpoint: 'Checkpoint',
  entity: 'History',
}

/** A prompt is not a caption. Enough to recognise the image, no more. */
const TITLE_LIMIT = 48

function shortTitle(value: string, fallback: string): string {
  const text = String(value || '').trim()
  if (!text) return fallback
  return text.length > TITLE_LIMIT ? `${text.slice(0, TITLE_LIMIT)}…` : text
}

const items = computed<GalleryItem[]>(() => {
  const data = payload.value
  if (!data) return []

  const out: GalleryItem[] = []

  for (const origin of ORIGIN_ORDER) {
    if (origin === 'civitai') {
      /*
       * The whole upstream set, not just the one url on the Resource row.
       * previewImageUrl is the card's single face and is normally the first of
       * these, so it is only added when the list does not already carry it --
       * showing the cover twice made the count look inflated.
       */
      const upstream: ResourceUpstreamPreview[] = data.upstreamPreviews ?? []
      const cover = data.civitaiPreviewUrl

      const asItem = (
        id: string,
        url: string,
        isMature: boolean,
        video = false,
      ): GalleryItem => ({
        id,
        title: video ? 'Civitai video' : 'Civitai sample',
        // A bare URL, not an ArtImage: `card` takes the resolved path directly,
        // where `source` would resolve a row this has none of.
        card: url,
        badges: [
          { label: ORIGIN_BADGES.civitai as string, class: 'badge-ghost' },
          ...(isMature ? [{ label: '18+', class: 'badge-error' }] : []),
        ],
      })

      if (cover && !upstream.some((preview) => preview.url === cover)) {
        out.push(asItem('civitai', cover, false))
      }

      for (const preview of upstream) {
        out.push(
          asItem(
            `upstream-${preview.id}`,
            preview.url,
            preview.isMature,
            preview.mediaType === 'video',
          ),
        )
      }
      continue
    }

    for (const image of data.images) {
      if (primaryOrigin(image) !== origin) continue
      out.push({
        id: image.id,
        // The prompt used to be the title, which is how one generated image
        // grew a caption tall enough to own a row by itself.
        title: shortTitle(image.fileName || '', `Image ${image.id}`),
        meta: shortTitle(image.promptString || '', ''),
        // Let the shell resolve the variant. A hand-rolled path order is how
        // the object card ended up drawing empty frames.
        source: image,
        badges: [
          { label: ORIGIN_BADGES[origin] as string, class: 'badge-ghost' },
          ...(image.isMature ? [{ label: '18+', class: 'badge-error' }] : []),
        ],
      })
    }
  }

  return out
})

/** "1 generated · 10 from Civitai" -- what the headings used to say. */
const originSummary = computed<string>(() => {
  const data = payload.value
  if (!data) return ''

  const parts: string[] = []
  const generated = data.images.length
  const upstream = data.upstreamPreviews?.length ?? 0

  if (generated) parts.push(`${generated} generated`)
  if (upstream) parts.push(`${upstream} from Civitai`)

  return parts.join(' · ')
})

const totalCount = computed(() => items.value.length)

const reloadKey = ref(0)

function refresh(): void {
  // Also forgives images that failed to load: refetching alone produced the
  // same urls, which kr-gallery had already blacklisted, so Refresh could not
  // bring back a picture that blipped on its first attempt.
  reloadKey.value += 1
  void resourceGalleryStore.loadResourceArt(props.resourceId, { force: true })
}

/*
 * A CLICK NOW SELECTS RATHER THAN LEAVING.
 *
 * Clicking an upstream preview used to open Civitai in a new tab, which is the
 * one thing you cannot then do anything with. It selects instead, and "Open
 * original" is still there in the action bar for when leaving IS the intent.
 */
const selected = ref<GalleryItem | null>(null)
const sourceMessage = ref('')
const sourceFailed = ref(false)

const sourceMessageClass = computed(() =>
  sourceFailed.value ? 'text-error' : 'text-success',
)

/*
 * An id says which kind of image it is: a generated ArtImage keeps its numeric
 * row id, an upstream preview is `upstream-<ResourcePreview id>`, and the
 * Resource's own cover url is the bare string `civitai`. That distinction used
 * to ride on which section the tile was in; with one grid it has to come from
 * the item itself.
 */
const selectedUrl = computed<string>(() => {
  const card = selected.value?.card
  return typeof card === 'string' ? card : ''
})

const selectedPreviewId = computed<number | null>(() => {
  const id = String(selected.value?.id ?? '')
  if (!id.startsWith('upstream-')) return null
  const parsed = Number(id.slice('upstream-'.length))
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
})

const selectedArtImageId = computed<number | null>(() =>
  typeof selected.value?.id === 'number' ? selected.value.id : null,
)

const selectedLabel = computed<string>(() => {
  if (!selected.value) return ''
  if (selectedPreviewId.value) {
    return `Civitai sample #${selectedPreviewId.value}`
  }
  if (selectedArtImageId.value) {
    return `Generated image #${selectedArtImageId.value}`
  }
  // The Resource's own cover url, which is a url and nothing else: it can be
  // opened, but there is no row behind it to load bytes from.
  return 'Civitai cover'
})

const selectedArtImage = computed<ResourceArtImage | null>(() => {
  const id = selectedArtImageId.value
  if (!id) return null
  return payload.value?.images.find((image) => image.id === id) ?? null
})

/*
 * The shared ArtImage DELETE route is the authority: owners may delete their
 * own generated images and admins may delete any row (archive-backed images
 * are quarantined there rather than unlinked destructively). Civitai samples
 * never get this button because they are upstream URLs, not our ArtImages.
 */
const canDeleteSelected = computed<boolean>(() => {
  const image = selectedArtImage.value
  if (!image) return false
  return userStore.isAdmin || image.userId === userStore.userId
})

const deleteArmed = ref(false)
const deleteBusy = ref(false)

function clearSelection(): void {
  selected.value = null
  deleteArmed.value = false
}

async function deleteSelected(): Promise<void> {
  const id = selectedArtImageId.value
  if (!id || !canDeleteSelected.value || deleteBusy.value) return

  if (!deleteArmed.value) {
    deleteArmed.value = true
    sourceFailed.value = false
    sourceMessage.value = 'Press delete again to confirm.'
    return
  }

  deleteBusy.value = true
  sourceMessage.value = ''

  try {
    const deleted = await artStore.deleteArtImage(id)
    if (!deleted) throw new Error(`Failed to delete image #${id}.`)

    selected.value = null
    deleteArmed.value = false
    sourceFailed.value = false
    sourceMessage.value = `Deleted image #${id}.`

    // If this image was the Resource preview, ON DELETE SET NULL changes the
    // parent row too. Refresh both the detail row and its gallery immediately.
    await Promise.all([
      resourceGalleryStore.getResource(props.resourceId),
      resourceGalleryStore.loadResourceArt(props.resourceId, { force: true }),
    ])
  } catch (cause) {
    sourceFailed.value = true
    sourceMessage.value =
      cause instanceof Error ? cause.message : 'That image could not be deleted.'
  } finally {
    deleteBusy.value = false
  }
}

/** Only a row-backed image can be turned into bytes. */
const canUseAsSource = computed<boolean>(
  () => selectedPreviewId.value !== null || selectedArtImageId.value !== null,
)

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

function openItem(item: GalleryItem): void {
  selected.value = item
  deleteArmed.value = false
  sourceMessage.value = ''
  sourceFailed.value = false

  // The generated rows still tell the page which ArtImage is in hand, which is
  // what the resource card uses to swap its own face.
  if (typeof item.id === 'number') emit('select', item.id)
}

async function useSelectedAsSource(): Promise<void> {
  if (!selected.value || !canUseAsSource.value) return
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
    deleteArmed.value = false
    sourceMessage.value = ''
    void resourceGalleryStore.loadResourceArt(id)
  },
  { immediate: true },
)
</script>
