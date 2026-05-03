<!-- /components/content/rewards/reward-card.vue -->
<template>
  <article
    :class="[
      'relative flex cursor-pointer flex-col rounded-2xl border bg-base-200 transition-all hover:shadow-lg',
      compact ? 'gap-2 p-3' : 'gap-4 p-4',
      selected ? 'border-primary bg-primary/10' : 'border-base-300',
    ]"
    @click="selectReward"
  >
    <div
      v-if="showActions && selected"
      class="absolute right-2 top-2 z-20 flex items-center gap-2"
    >
      <button
        v-if="allowEdit"
        class="rounded-full bg-base-100 p-2 text-primary shadow hover:bg-primary hover:text-primary-content"
        type="button"
        title="Edit Reward"
        @click.stop="emit('edit', reward.id)"
      >
        <Icon name="kind-icon:pencil" class="h-4 w-4" />
      </button>

      <button
        v-if="allowDelete"
        class="rounded-full bg-base-100 p-2 text-error shadow hover:bg-error hover:text-error-content"
        type="button"
        title="Delete Reward"
        @click.stop="deleteReward"
      >
        <Icon name="kind-icon:trash" class="h-4 w-4" />
      </button>
    </div>

    <div
      v-if="showImage"
      :class="[
        'relative flex items-center justify-center overflow-hidden rounded-2xl bg-base-300',
        compact ? 'h-32 w-full' : 'h-44 w-full',
      ]"
    >
      <img
        v-if="artImage"
        :src="`data:image/${artImage.fileType};base64,${artImage.imageData}`"
        alt="Reward Art"
        class="h-full w-full object-cover transition-transform hover:scale-105"
        loading="lazy"
      />

      <img
        v-else-if="reward.imagePath"
        :src="reward.imagePath"
        alt="Reward Art"
        class="h-full w-full object-cover transition-transform hover:scale-105"
        loading="lazy"
      />

      <Icon
        v-else
        :name="reward.icon || fallbackIcon"
        :class="compact ? 'h-14 w-14' : 'h-20 w-20'"
        class="text-primary/70"
      />

      <div
        class="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full border border-base-300 bg-base-100/90 shadow"
      >
        <Icon
          :name="reward.icon || fallbackIcon"
          class="h-5 w-5 text-primary"
        />
      </div>
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-2">
      <h2
        :class="[
          'font-bold leading-tight text-base-content',
          compact ? 'line-clamp-1 text-base' : 'text-lg',
        ]"
      >
        {{ reward.text || 'Untitled Reward' }}
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
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
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

const artStore = useArtStore()
const rewardStore = useRewardStore()
const artImage = ref<ArtImage | null>(null)

function selectReward() {
  rewardStore.selectReward(props.reward.id)
  emit('select', props.reward.id)
}

async function deleteReward() {
  const result = await rewardStore.deleteReward(props.reward.id)

  if (result.success) {
    emit('delete', props.reward.id)
  }
}

onMounted(async () => {
  if (!props.reward.artImageId || !props.showImage) return

  try {
    const results = await artStore.getArtImagesByIds([props.reward.artImageId])
    artImage.value = results[0] ?? null
  } catch (error) {
    console.error('Failed to load reward art image:', error)
  }
})
</script>
