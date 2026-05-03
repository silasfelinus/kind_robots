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
        v-if="artImage"
        :src="`data:image/${artImage.fileType};base64,${artImage.imageData}`"
        :alt="rewardTitle"
        class="h-full w-full object-cover transition-transform group-hover:scale-105"
        loading="lazy"
      />

      <img
        v-else-if="reward.imagePath"
        :src="reward.imagePath"
        :alt="rewardTitle"
        class="h-full w-full object-cover transition-transform group-hover:scale-105"
        loading="lazy"
      />

      <div
        v-else
        class="flex h-full w-full items-center justify-center bg-base-200"
      >
        <Icon
          :name="reward.icon || fallbackIcon"
          :class="compact ? 'h-14 w-14' : 'h-20 w-20'"
          class="text-primary/70"
        />
      </div>

      <div class="absolute left-2 top-2 flex flex-wrap gap-1">
        <span v-if="activeSelected" class="badge badge-primary badge-sm">
          Selected
        </span>

        <span v-if="reward.collection" class="badge badge-secondary badge-sm">
          {{ reward.collection }}
        </span>

        <span class="badge badge-ghost badge-sm">
          Rarity {{ reward.rarity ?? 0 }}
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
        {{ reward.power || 'No power described yet.' }}
      </p>

      <div v-if="showMeta" class="flex flex-wrap gap-2">
        <span class="badge badge-outline badge-sm">
          {{ reward.collection || 'general' }}
        </span>

        <span class="badge badge-ghost badge-sm">
          Rarity {{ reward.rarity ?? 0 }}
        </span>

        <span v-if="reward.label" class="badge badge-primary badge-sm">
          {{ reward.label }}
        </span>

        <span v-if="reward.userId" class="badge badge-accent badge-sm">
          User #{{ reward.userId }}
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
            {{ reward.rarity ?? 0 }}
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

const props = withDefaults(
  defineProps<{
    reward: Reward
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
  edit: [id: number]
  delete: [id: number]
}>()

const artStore = useArtStore()
const rewardStore = useRewardStore()

const artImage = ref<ArtImage | null>(null)
const isLoadingImage = ref(false)

const activeSelected = computed(() => {
  return props.selected || rewardStore.selectedReward?.id === props.reward.id
})

const rewardTitle = computed(() => {
  return props.reward.text || props.reward.label || `Reward #${props.reward.id}`
})

async function selectReward() {
  rewardStore.selectReward(props.reward.id)
}

async function deleteReward() {
  const result = await rewardStore.deleteReward(props.reward.id)

  if (result.success) {
    emit('delete', props.reward.id)
  }
}

async function loadRewardImage() {
  artImage.value = null

  if (!props.reward.artImageId || !props.showImage) return

  isLoadingImage.value = true

  try {
    const results = await artStore.getArtImagesByIds([props.reward.artImageId])
    artImage.value = results[0] ?? null
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
  () => [props.reward.artImageId, props.showImage],
  async () => {
    await loadRewardImage()
  },
)
</script>
