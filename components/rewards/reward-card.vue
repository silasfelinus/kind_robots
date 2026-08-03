<!-- /components/content/rewards/reward-card.vue -->
<template>
  <reactable-card
    :selected="activeSelected"
    :compact="compact"
    :show-reaction="showReaction"
    :allow-reviews="reward.allowReviews"
    :target-id="reward.id"
    target-type="reward"
    reaction-category="REWARD"
    :target-title="rewardTitle"
    :earned-karma="earnedKarma"
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

    <kr-entity-card-body
      :title="rewardTitle"
      :subtitle="reward.rewardType || ''"
      :description="reward.effect || reward.description || ''"
      description-fallback="No effect described yet."
      :source="reward"
      variant="card"
      :fallback="artFallbackSrc"
      :show-image="showImage"
      :show-description="showDescription"
      :compact="compact"
      :selected="activeSelected"
      :badges="badges"
      :meta="showMeta ? metaChips : []"
      :placeholder-icon="reward.icon || fallbackIcon"
    >
      <div
        v-if="showStats"
        class="mx-0.5 mt-2.5 grid grid-cols-2 gap-2 rounded-2xl border border-base-300 bg-base-100 p-3 text-xs"
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
        class="btn btn-sm mx-0.5 mt-2.5 rounded-xl"
        :class="activeSelected ? 'btn-primary text-white' : 'btn-outline'"
        type="button"
        @click.stop="selectReward"
      >
        <Icon name="kind-icon:check" class="h-4 w-4" />
        {{ activeSelected ? 'Selected' : 'Select' }}
      </button>

      <details
        v-if="showDebug"
        class="mx-0.5 mt-2.5 rounded-2xl border border-base-300 bg-base-100 p-2"
        @click.stop
      >
        <summary class="cursor-pointer text-xs font-bold text-base-content/70">
          Debug
        </summary>

        <pre class="mt-2 max-h-48 overflow-auto text-xs text-base-content/70">{{
          JSON.stringify(reward, null, 2)
        }}</pre>
      </details>
    </kr-entity-card-body>
  </reactable-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Reward } from '~/prisma/generated/prisma/client'
import { useArtStore, type ArtImage } from '@/stores/artStore'
import type { EntityCardChip } from '@/components/gallery/kr-entity-card-body.vue'
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
    /** Total karma this reward has earned from reactions to it. Omit/undefined
     *  renders no badge — see components/wonderlab/reactable-card.vue. */
    earnedKarma?: number | null
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
    earnedKarma: undefined,
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

const embeddedArtImage = computed<RewardCardImage | null>(() => {
  return props.reward.ArtImage ?? null
})

const rarityBadgeClass = computed(() => {
  return getRarityBadgeClass(props.reward.rarity)
})

/*
 * kr-art-plate resolves cardPath -> cardData -> imagePath -> imageData itself,
 * which covers most of what this card used to chain by hand. What it cannot
 * know about is the separately-fetched ArtImage row and the slug-derived
 * guess, so those become its single `fallback` step.
 *
 * This IS a reduction: the old <img> @error handler walked the whole candidate
 * list one entry at a time, whereas kr-art-plate falls back exactly once. The
 * ordering that mattered -- purpose-built card art first, slug guess last --
 * survives; what goes is retrying every intermediate URL after a 404.
 */
const artFallbackSrc = computed(() => {
  const image = embeddedArtImage.value || artImage.value
  const artPath =
    image?.imagePath?.trim() ||
    (image as { path?: string | null } | null | undefined)?.path?.trim() ||
    ''

  if (artPath) return artPath

  const slug = props.reward.slug?.trim()
  const rewardType = props.reward.rewardType?.toLowerCase()

  return slug && rewardType ? `/images/rewards/${rewardType}/${slug}.webp` : ''
})

/*
 * Badges sit top-LEFT over the art (kr-entity-card-body owns that corner;
 * top-right belongs to reactable-card's actions row). Rarity is the one
 * attribute worth reading at a glance, so it takes the corner and collection
 * drops to the meta row -- previously both appeared in BOTH places.
 *
 * The old "Selected" badge and the bottom-right check are both gone: the
 * shared body renders one check from `selected`, so the card no longer says
 * the same thing three times.
 */
const badges = computed<EntityCardChip[]>(() => [
  { label: props.reward.rarity || 'COMMON', class: rarityBadgeClass.value },
])

const metaChips = computed<EntityCardChip[]>(() => [
  { label: props.reward.collection || 'general', class: 'badge-outline' },
])

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

async function loadRewardImage() {
  artImage.value = null

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
