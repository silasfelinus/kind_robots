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
        @click="load(true)"
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
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { GalleryItem } from '@/components/gallery/kr-gallery.vue'
import { performFetch } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'

type GalleryImage = {
  id: number
  createdAt?: string | null
  fileName?: string | null
  imagePath?: string | null
  path?: string | null
  thumbnailPath?: string | null
  cardPath?: string | null
  promptString?: string | null
  isMature?: boolean | null
  origins: string[]
}

type GalleryPayload = {
  resourceId: number
  civitaiPreviewUrl: string | null
  images: GalleryImage[]
}

const props = defineProps<{ resourceId: number }>()
const emit = defineEmits<{ (event: 'select', artImageId: number): void }>()

const userStore = useUserStore()

const loading = ref(false)
const loaded = ref(false)
const error = ref('')
const payload = ref<GalleryPayload | null>(null)

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
function primaryOrigin(image: GalleryImage): string {
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
        if (!data.civitaiPreviewUrl) continue
        out.push({
          key: 'civitai',
          label: ORIGIN_LABELS.civitai as string,
          items: [
            {
              id: 'civitai',
              title: 'Civitai preview',
              // A bare URL, not an ArtImage: `card` takes the resolved path
              // directly, where `source` would resolve a row this has none of.
              card: data.civitaiPreviewUrl,
              meta: 'Opens on civitai.com',
            },
          ],
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

function openItem(groupKey: string, item: GalleryItem): void {
  if (groupKey === 'civitai') {
    const url = payload.value?.civitaiPreviewUrl
    if (url) window.open(url, '_blank', 'noopener')
    return
  }

  if (typeof item.id === 'number') emit('select', item.id)
}

async function load(force = false): Promise<void> {
  if (loading.value) return
  if (
    loaded.value &&
    !force &&
    payload.value?.resourceId === props.resourceId
  ) {
    return
  }

  loading.value = true
  error.value = ''

  try {
    /*
     * The viewer's own maturity preference travels with the request, the same
     * way the art listings send it. The server still refuses a
     * maturity-restricted account whatever this says -- isMaturityRestricted
     * reads the ROLE, so `?showMature=true` cannot lift it.
     */
    const query = userStore.showMature ? '?showMature=true' : ''
    const response = await performFetch<GalleryPayload>(
      `/api/resources/${props.resourceId}/gallery${query}`,
    )

    if (!response?.success || !response.data) {
      throw new Error(response?.message || 'Failed to load images.')
    }

    payload.value = response.data
    loaded.value = true
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load images.'
  } finally {
    loading.value = false
  }
}

watch(
  () => props.resourceId,
  (id) => {
    if (!Number.isInteger(id) || id <= 0) return
    loaded.value = false
    payload.value = null
    void load()
  },
  { immediate: true },
)
</script>
