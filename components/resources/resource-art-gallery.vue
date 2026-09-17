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

  Origins are groups, not filters: one image is routinely both the generated
  preview and a LoRA use, and /api/resources/:id/gallery returns every origin
  that claimed it rather than making the client ask four times.
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

    <div v-if="loading" class="flex items-center gap-2 text-xs opacity-60">
      <span class="kr-spinner-xs" />
      Loading images…
    </div>

    <p v-else-if="error" class="text-xs text-error">{{ error }}</p>

    <p v-else-if="!totalCount" class="text-xs opacity-60">
      No images yet. Generate art for this resource, or use it in a build.
    </p>

    <div v-else class="space-y-3">
      <div v-for="group in groups" :key="group.key">
        <p class="mb-1 text-[0.65rem] uppercase tracking-wide opacity-50">
          {{ group.label }}
          <span class="opacity-70">({{ group.items.length }})</span>
        </p>

        <div class="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
          <component
            :is="group.key === 'civitai' ? 'a' : 'button'"
            v-for="item in group.items"
            :key="item.key"
            v-bind="
              group.key === 'civitai'
                ? { href: item.src, target: '_blank', rel: 'noopener' }
                : { type: 'button' }
            "
            class="relative aspect-square overflow-hidden rounded-lg bg-base-200 ring-1 ring-base-300 transition hover:ring-primary"
            :title="item.title"
            @click="
              group.key === 'civitai'
                ? undefined
                : emit('select', item.id as number)
            "
          >
            <kr-deferred-image
              :src="item.src"
              :alt="item.title"
              class="h-full w-full object-cover"
            />
            <span
              v-if="item.isMature"
              class="absolute right-1 top-1 kr-badge-sm badge-error"
            >
              18+
            </span>
          </component>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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

/**
 * The static paths, in resource-card.vue's order. `/api/art/images/:id/file`
 * 403s for a browser `<img>` (no Authorization header on an image request), so
 * a card that reached for it drew an empty frame.
 */
function imageSrc(image: GalleryImage): string {
  return (
    image.thumbnailPath || image.cardPath || image.imagePath || image.path || ''
  )
}

/** An image belongs to exactly one heading: its highest-priority origin. */
function primaryOrigin(image: GalleryImage): string {
  let best = ORIGIN_ORDER.length
  for (const origin of image.origins) {
    const rank = ORIGIN_ORDER.indexOf(origin)
    if (rank !== -1 && rank < best) best = rank
  }
  return ORIGIN_ORDER[best] ?? 'entity'
}

type GalleryTile = {
  key: string
  id?: number
  src: string
  title: string
  isMature: boolean
}

const groups = computed<{ key: string; label: string; items: GalleryTile[] }[]>(
  () => {
    const data = payload.value
    if (!data) return []

    const out: { key: string; label: string; items: GalleryTile[] }[] = []

    for (const origin of ORIGIN_ORDER) {
      if (origin === 'civitai') {
        if (!data.civitaiPreviewUrl) continue
        out.push({
          key: 'civitai',
          label: ORIGIN_LABELS.civitai as string,
          items: [
            {
              key: 'civitai',
              src: data.civitaiPreviewUrl,
              title: 'Civitai preview (opens on civitai.com)',
              isMature: false,
            },
          ],
        })
        continue
      }

      const items = data.images
        .filter((image) => primaryOrigin(image) === origin)
        .map((image) => ({
          key: `img-${image.id}`,
          id: image.id,
          src: imageSrc(image),
          title: image.promptString || image.fileName || `Image ${image.id}`,
          isMature: Boolean(image.isMature),
        }))
        .filter((item) => Boolean(item.src))

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
