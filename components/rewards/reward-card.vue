<!-- /components/content/rewards/reward-card.vue -->
<template>
  <reactable-card
    :selected="activeSelected"
    :compact="compact"
    :show-reaction="showReaction"
    :target-id="reward.id"
    target-type="reward"
    reaction-category="REWARD"
    :target-title="rewardTitle"
    @select="selectReward"
  >
    <template #actions>
      <button
        v-if="showActions && (activeSelected || compact)"
        class="rounded-full bg-base-100 p-2 text-success shadow transition hover:bg-success hover:text-success-content"
        type="button"
        title="Start Reward Story"
        @click.stop="interactWithReward"
      >
        <Icon name="kind-icon:story" class="h-4 w-4" />
      </button>

      <button
        v-if="showActions && allowEdit && (activeSelected || compact)"
        class="rounded-full bg-base-100 p-2 text-primary shadow transition hover:bg-primary hover:text-primary-content"
        type="button"
        title="Edit Reward"
        @click.stop="emit('edit', reward.id)"
      >
        <Icon name="kind-icon:pencil" class="h-4 w-4" />
      </button>

      <button
        v-if="showActions && allowDelete && (activeSelected || compact)"
        class="rounded-full bg-base-100 p-2 text-error shadow transition hover:bg-error hover:text-error-content"
        type="button"
        title="Delete Reward"
        @click.stop="deleteReward"
      >
        <Icon name="kind-icon:trash" class="h-4 w-4" />
      </button>
    </template>

    <div
      v-if="showImage"
      :class="[
        'relative flex items-center justify-center overflow-hidden rounded-2xl border border-base-300 bg-base-300',
        compact ? 'h-32 w-full' : 'h-44 w-full',
      ]"
    >
      <img
        v-if="visibleRewardImageSrc"
        :src="visibleRewardImageSrc"
        :alt="rewardTitle"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
        @error="handleImageError"
      />

      <div
        v-else
        class="flex h-full w-full items-center justify-center bg-linear-to-br from-base-200 to-base-300"
      >
        <span
          v-if="isLoadingImage"
          class="loading loading-spinner loading-md text-primary"
        />

        <Icon
          v-else
          :name="reward.icon || fallbackIcon"
          :class="compact ? 'h-14 w-14' : 'h-20 w-20'"
          class="text-primary/70"
        />
      </div>

      <div
        v-if="visibleRewardImageSrc"
        class="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-base-300/80 to-transparent"
      />

      <div class="absolute left-2 top-2 flex flex-wrap gap-1">
        <span v-if="activeSelected" class="badge badge-primary badge-sm shadow">
          Selected
        </span>

        <span
          v-if="reward.collection"
          class="badge badge-secondary badge-sm shadow"
        >
          {{ reward.collection }}
        </span>

        <span class="badge badge-sm shadow" :class="rarityBadgeClass">
          {{ reward.rarity || 'COMMON' }}
        </span>
      </div>

      <div
        class="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full border border-base-300 bg-base-100/90 shadow"
      >
        <Icon
          :name="reward.icon || fallbackIcon"
          class="h-5 w-5 text-primary"
        />
      </div>

      <div
        v-if="activeSelected"
        class="absolute bottom-2 right-2 rounded-full bg-primary p-2 text-primary-content shadow"
      >
        <Icon name="kind-icon:check" class="h-4 w-4" />
      </div>
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-2">
      <h2
        :class="[
          'font-black leading-tight text-base-content',
          compact ? 'line-clamp-1 text-base' : 'text-lg',
        ]"
        :title="rewardTitle"
      >
        {{ rewardTitle }}
      </h2>

      <p
        v-if="showDescription"
        :class="[
          'text-base-content/70',
          compact ? 'line-clamp-2 text-sm' : 'text-sm',
        ]"
      >
        {{ reward.effect || reward.description || 'No effect described yet.' }}
      </p>

      <div v-if="showMeta" class="flex flex-wrap gap-2">
        <span v-if="reward.rewardType" class="badge badge-primary badge-sm">
          {{ reward.rewardType }}
        </span>

        <span class="badge badge-outline badge-sm">
          {{ reward.collection || 'general' }}
        </span>

        <span class="badge badge-sm" :class="rarityBadgeClass">
          {{ reward.rarity || 'COMMON' }}
        </span>
      </div>

      <div
        v-if="showStats"
        class="grid grid-cols-2 gap-2 rounded-2xl border border-base-300 bg-base-100 p-3 text-xs"
      >
        <div>
          <p class="font-bold uppercase text-base-content/45">ID</p>
          <p class="truncate text-base-content/75">#{{ reward.id }}</p>
        </div>

        <div>
          <p class="font-bold uppercase text-base-content/45">Rarity</p>
          <p class="truncate text-base-content/75">
            {{ reward.rarity || 'COMMON' }}
          </p>
        </div>

        <div>
          <p class="font-bold uppercase text-base-content/45">Collection</p>
          <p class="truncate text-base-content/75">
            {{ reward.collection || 'general' }}
          </p>
        </div>

        <div>
          <p class="font-bold uppercase text-base-content/45">Image</p>
          <p class="truncate text-base-content/75">
            {{ reward.artImageId ? `#${reward.artImageId}` : 'none' }}
          </p>
        </div>
      </div>

      <button
        v-if="showSelectButton"
        class="btn btn-sm mt-auto rounded-xl"
        :class="activeSelected ? 'btn-primary text-white' : 'btn-outline'"
        type="button"
        @click.stop="selectReward"
      >
        <Icon name="kind-icon:check" class="h-4 w-4" />
        {{ activeSelected ? 'Selected' : 'Select' }}
      </button>

      <details
        v-if="showDebug"
        class="rounded-2xl border border-base-300 bg-base-100 p-2"
        @click.stop
      >
        <summary class="cursor-pointer text-xs font-bold text-base-content/70">
          Debug
        </summary>

        <pre class="mt-2 max-h-48 overflow-auto text-xs text-base-content/70">{{
          JSON.stringify(reward, null, 2)
        }}</pre>
      </details>
    </div>
  </reactable-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Reward } from '~/prisma/generated/prisma/client'
import { useArtStore, type ArtImage } from '@/stores/artStore'
import { useRewardStore } from '@/stores/rewardStore'

type RewardWithArt = Reward & {
  ArtImage?: ArtImage | null
}

type RewardCardImage = ArtImage

type ArtStoreWithImageLoaders = ReturnType<typeof useArtStore> & {
  getArtImageById?: (id: number) => Promise<ArtImage | null | undefined>
  getArtImagesByIds?: (ids: number[]) => Promise<ArtImage[]>
}

const props = withDefaults(
  defineProps<{
    reward: RewardWithArt
    selected?: boolean
    showImage?: boolean
    compact?: boolean
    showActions?: boolean
    showDescription?: boolean
    showMeta?: boolean
    showStats?: boolean
    showSelectButton?: boolean
    showReaction?: boolean
    showDebug?: boolean
    allowEdit?: boolean
    allowDelete?: boolean
    fallbackIcon?: string
  }>(),
  {
    selected: false,
    showImage: true,
    compact: false,
    showActions: true,
    showDescription: true,
    showMeta: true,
    showStats: false,
    showSelectButton: false,
    showReaction: true,
    showDebug: false,
    allowEdit: true,
    allowDelete: true,
    fallbackIcon: 'kind-icon:gift',
  },
)

const emit = defineEmits<{
  select: [id: number]
  edit: [id: number]
  delete: [id: number]
}>()

const artStore = useArtStore() as ArtStoreWithImageLoaders
const rewardStore = useRewardStore()

const artImage = ref<RewardCardImage | null>(null)
const isLoadingImage = ref(false)
const imageCandidateIndex = ref(0)

const embeddedArtImage = computed<RewardCardImage | null>(() => {
  return props.reward.ArtImage ?? null
})

// Ordered fallback chain: ArtImage base64 -> thumbnail -> imagePath ->
// slug-derived /images/rewards/{type}/{slug}.webp. A failed <img> load
// advances to the next candidate instead of giving up entirely.
const imageCandidates = computed<string[]>(() => {
  const candidates: string[] = []
  const image = embeddedArtImage.value || artImage.value

  // Path-first: try the art image's own path, the reward's imagePath, and the
  // slug-derived path before any inline base64. The <img> onerror handler
  // advances through this list, so base64 stays a graceful fallback.
  const artPath =
    image?.imagePath?.trim() ||
    (image as { path?: string | null } | null | undefined)?.path?.trim() ||
    ''

  if (artPath) candidates.push(artPath)

  const path = props.reward.imagePath?.trim()

  if (path) {
    candidates.push(path)

    if (
      !path.startsWith('/') &&
      !path.startsWith('http') &&
      !path.startsWith('data:')
    ) {
      candidates.push(`/${path}`)
    }
  }

  const slug = props.reward.slug?.trim()
  const rewardType = props.reward.rewardType?.toLowerCase()

  if (slug && rewardType) {
    candidates.push(`/images/rewards/${rewardType}/${slug}.webp`)
  }

  if (image?.imageData) {
    candidates.push(
      `data:${normalizeImageMime(image.fileType)};base64,${image.imageData}`,
    )
  }

  if (image?.thumbnailData) {
    candidates.push(
      `data:${normalizeImageMime(image.fileType)};base64,${image.thumbnailData}`,
    )
  }

  return Array.from(new Set(candidates))
})

const visibleRewardImageSrc = computed(() => {
  if (!props.showImage) return ''

  return imageCandidates.value[imageCandidateIndex.value] ?? ''
})

const rarityBadgeClass = computed(() => {
  return getRarityBadgeClass(props.reward.rarity)
})

function getRarityBadgeClass(rarity?: string | null) {
  switch (rarity) {
    case 'UNCOMMON':
      return 'badge-success'
    case 'RARE':
      return 'badge-info'
    case 'EPIC':
      return 'badge-secondary'
    case 'LEGENDARY':
      return 'badge-warning'
    case 'MYTHIC':
      return 'badge-error'
    default:
      return 'badge-ghost'
  }
}

async function fetchArtImageById(id: number): Promise<RewardCardImage | null> {
  if (typeof artStore.getArtImageById === 'function') {
    const result = await artStore.getArtImageById(id)

    return result ?? null
  }

  if (typeof artStore.getArtImagesByIds === 'function') {
    const results = await artStore.getArtImagesByIds([id])

    return results[0] ?? null
  }

  return null
}

const activeSelected = computed(() => {
  return props.selected || rewardStore.selectedReward?.id === props.reward.id
})

const rewardTitle = computed(() => {
  return props.reward.name || `Reward #${props.reward.id}`
})

async function selectReward() {
  await rewardStore.selectReward(props.reward.id)
  emit('select', props.reward.id)
}

async function interactWithReward() {
  await rewardStore.startRewardInteraction(props.reward.id)
}

async function deleteReward() {
  const result = await rewardStore.deleteReward(props.reward.id)

  if (result.success) {
    emit('delete', props.reward.id)
  }
}

function normalizeImageMime(fileType?: string | null) {
  const fallback = 'image/webp'
  const cleaned = fileType?.trim().replace(/^\./, '')

  if (!cleaned) return fallback
  if (cleaned.startsWith('image/')) return cleaned

  return `image/${cleaned}`
}

async function loadRewardImage() {
  artImage.value = null
  imageCandidateIndex.value = 0

  if (!props.reward.artImageId || !props.showImage || embeddedArtImage.value) {
    return
  }

  isLoadingImage.value = true

  try {
    artImage.value = await fetchArtImageById(props.reward.artImageId)
  } catch (error) {
    console.error('Failed to load reward art image:', error)
  } finally {
    isLoadingImage.value = false
  }
}

function handleImageError() {
  imageCandidateIndex.value += 1
}

onMounted(async () => {
  await loadRewardImage()
})

watch(
  () => [
    props.reward.id,
    props.reward.artImageId,
    props.reward.imagePath,
    props.showImage,
    embeddedArtImage.value?.id,
  ],
  async () => {
    await loadRewardImage()
  },
)
</script>
