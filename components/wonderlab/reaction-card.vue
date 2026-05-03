<!-- /components/content/reactions/reaction-card.vue -->
<template>
  <section class="rounded-2xl border border-base-300 bg-base-200 p-4 shadow-sm">
    <div
      class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
    >
      <div class="min-w-0">
        <p
          class="text-xs font-bold uppercase tracking-wide text-base-content/45"
        >
          Reaction
        </p>

        <h2 class="truncate text-xl font-black text-primary">
          {{ targetTitle || formattedTargetType }}
        </h2>

        <p class="mt-1 text-sm text-base-content/60">
          {{ formattedTargetType }} #{{ targetId }}
        </p>
      </div>

      <span class="badge badge-outline">
        {{ reactionCategory }}
      </span>
    </div>

    <div class="grid gap-4">
      <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
        <label class="mb-2 block text-sm font-bold text-base-content/70">
          Rating
        </label>

        <div class="flex flex-wrap items-center gap-1">
          <button
            v-for="star in 5"
            :key="star"
            type="button"
            class="text-4xl leading-none transition active:scale-95"
            :class="
              hoverRating >= star || (!hoverRating && rating >= star)
                ? 'text-warning scale-110'
                : 'text-base-content/25 hover:text-warning/70'
            "
            @mouseenter="hoverRating = star"
            @mouseleave="hoverRating = 0"
            @click="setRating(star)"
          >
            ★
          </button>

          <button
            class="btn btn-xs btn-ghost ml-2 rounded-xl"
            type="button"
            @click="rating = 0"
          >
            Clear stars
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,260px)_1fr]">
        <label class="form-control">
          <span class="label">
            <span class="label-text font-bold">Reaction Type</span>
          </span>

          <select
            v-model="selectedReactionType"
            class="select select-bordered bg-base-100"
          >
            <option v-for="type in reactionTypes" :key="type" :value="type">
              {{ type }}
            </option>
          </select>
        </label>

        <label class="form-control">
          <span class="label">
            <span class="label-text font-bold">Comment</span>
          </span>

          <input
            v-model="comment"
            class="input input-bordered bg-base-100"
            placeholder="Optional comment..."
          />
        </label>
      </div>

      <div class="flex flex-wrap justify-end gap-2">
        <button
          class="btn btn-ghost rounded-xl"
          type="button"
          @click="clearReaction"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
          Clear
        </button>

        <button
          class="btn btn-primary rounded-xl text-white"
          type="button"
          :disabled="isSubmitting"
          @click="submitReaction"
        >
          <span
            v-if="isSubmitting"
            class="loading loading-spinner loading-sm"
          />

          <Icon v-else name="kind-icon:check" class="h-4 w-4" />
          Submit
        </button>
      </div>

      <div
        v-if="reactionMessage"
        class="rounded-2xl border p-3 text-sm"
        :class="
          reactionStatus === 'error'
            ? 'border-error/40 bg-error/10 text-error'
            : 'border-success/40 bg-success/10 text-success'
        "
      >
        {{ reactionMessage }}
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// /components/content/reactions/reaction-card.vue
import { computed, ref } from 'vue'
import { useUserStore } from '@/stores/userStore'
import {
  reactionTypes,
  type ReactionCategoryEnum,
  type ReactionTargetType,
  type ReactionTypeEnum,
  useReactionStore,
} from '@/stores/reactionStore'

type ReactionCategory =
  | 'ART'
  | 'ART_IMAGE'
  | 'BOT'
  | 'CHAT_EXCHANGE'
  | 'COMPONENT'
  | 'DREAM'
  | 'GALLERY'
  | 'PITCH'
  | 'PROMPT'
  | 'RESOURCE'
  | 'REWARD'
  | 'TAG'

const props = withDefaults(
  defineProps<{
    targetId: number
    targetType: ReactionTargetType
    reactionCategory: ReactionCategoryEnum
    targetTitle?: string
  }>(),
  {
    targetTitle: '',
  },
)

const reactionStore = useReactionStore()
const userStore = useUserStore()

const rating = ref(0)
const hoverRating = ref(0)
const selectedReactionType = ref<ReactionTypeEnum>('NEUTRAL')
const comment = ref('')
const isSubmitting = ref(false)
const reactionMessage = ref('')
const reactionStatus = ref<'success' | 'error' | ''>('')

const formattedTargetType = computed(() => {
  return props.targetType
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (letter) => letter.toUpperCase())
})

function setRating(value: number) {
  rating.value = value
}

function clearReaction() {
  rating.value = 0
  hoverRating.value = 0
  selectedReactionType.value = 'NEUTRAL'
  comment.value = ''
  reactionMessage.value = ''
  reactionStatus.value = ''
}

function getTargetIdPayload() {
  const idKeyMap: Record<ReactionTargetType, string> = {
    art: 'artId',
    artImage: 'artImageId',
    bot: 'botId',
    chat: 'chatId',
    component: 'componentId',
    dream: 'dreamId',
    gallery: 'galleryId',
    message: 'messageId',
    pitch: 'pitchId',
    post: 'postId',
    prompt: 'promptId',
    resource: 'resourceId',
    reward: 'rewardId',
    tag: 'tagId',
  }

  return {
    [idKeyMap[props.targetType]]: props.targetId,
  }
}

async function submitReaction() {
  if (!userStore.user?.id) {
    reactionStatus.value = 'error'
    reactionMessage.value = 'You must be logged in to submit a reaction.'
    return
  }

  isSubmitting.value = true
  reactionMessage.value = ''
  reactionStatus.value = ''

  try {
    await reactionStore.addReaction({
      ...getTargetIdPayload(),
      userId: userStore.user.id,
      rating: rating.value,
      reactionType: selectedReactionType.value,
      comment: comment.value,
      reactionCategory: props.reactionCategory,
    })

    reactionStatus.value = 'success'
    reactionMessage.value = 'Reaction submitted.'
  } catch (error) {
    reactionStatus.value = 'error'
    reactionMessage.value =
      error instanceof Error ? error.message : 'Failed to submit reaction.'
  } finally {
    isSubmitting.value = false
  }
}
</script>
