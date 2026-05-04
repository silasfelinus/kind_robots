<!-- /components/content/reactions/reaction-card.vue -->
<template>
  <section
    class="rounded-2xl border border-base-300 bg-base-200 shadow-sm"
    :class="compact ? 'p-3' : 'p-4'"
  >
    <div
      v-if="showHeader"
      class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
    >
      <div class="min-w-0">
        <p
          class="text-xs font-bold uppercase tracking-wide text-base-content/45"
        >
          Reaction
        </p>

        <h2
          class="truncate font-black text-primary"
          :class="compact ? 'text-base' : 'text-xl'"
        >
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
        <div
          class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <label class="text-sm font-bold text-base-content/70"> Rate </label>

          <button
            v-if="rating"
            class="btn btn-xs btn-ghost rounded-xl"
            type="button"
            @click="rating = 0"
          >
            Clear stars
          </button>
        </div>

        <div class="mt-2 flex flex-wrap items-center gap-1 sm:gap-2">
          <button
            v-for="star in 5"
            :key="star"
            type="button"
            class="select-none leading-none transition active:scale-95"
            :class="[
              compact ? 'text-3xl' : 'text-4xl sm:text-5xl',
              hoverRating >= star || (!hoverRating && rating >= star)
                ? 'scale-110 text-warning'
                : 'text-base-content/25 hover:text-warning/70',
            ]"
            @mouseenter="hoverRating = star"
            @mouseleave="hoverRating = 0"
            @click="setRating(star)"
          >
            ★
          </button>
        </div>
      </div>

      <div
        class="grid grid-cols-1 gap-3"
        :class="compact ? '' : 'md:grid-cols-[minmax(0,240px)_1fr]'"
      >
        <label class="form-control">
          <span class="label">
            <span class="label-text font-bold">Reaction Type</span>
          </span>

          <select
            v-model="selectedReactionType"
            class="select select-bordered bg-base-100"
            :class="compact ? 'select-sm' : ''"
          >
            <option v-for="type in reactionTypes" :key="type" :value="type">
              {{ type }}
            </option>
          </select>
        </label>

        <label v-if="showComment" class="form-control">
          <span class="label">
            <span class="label-text font-bold">Comment</span>
          </span>

          <input
            v-model="comment"
            class="input input-bordered bg-base-100"
            :class="compact ? 'input-sm' : ''"
            placeholder="Optional comment..."
          />
        </label>
      </div>

      <div class="flex flex-wrap justify-between gap-2">
        <div class="flex flex-wrap gap-2">
          <button
            class="btn btn-accent rounded-xl"
            :class="compact ? 'btn-sm' : ''"
            type="button"
            @click="toggleComment"
          >
            <Icon name="kind-icon:comment" class="h-4 w-4" />
            {{ showComment ? 'Hide Comment' : 'Comment' }}
          </button>

          <button
            class="btn btn-ghost rounded-xl"
            :class="compact ? 'btn-sm' : ''"
            type="button"
            @click="clearReaction"
          >
            <Icon name="kind-icon:x" class="h-4 w-4" />
            Clear
          </button>
        </div>

        <button
          class="btn btn-primary rounded-xl text-white"
          :class="compact ? 'btn-sm' : ''"
          type="button"
          :disabled="isSubmitting || !canSubmit"
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
        v-if="showShare"
        class="flex flex-wrap justify-center gap-2 border-t border-base-300 pt-3"
      >
        <button
          v-for="platform in sharePlatforms"
          :key="platform.key"
          class="btn btn-sm btn-secondary rounded-xl"
          type="button"
          @click="share(platform.key)"
        >
          <Icon :name="platform.icon" class="h-4 w-4" />
          {{ platform.label }}
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
  getReactionTargetPayload,
  type ReactionCategoryEnum,
  type ReactionTargetType,
  type ReactionTypeEnum,
  reactionTypes,
  useReactionStore,
} from '@/stores/reactionStore'

type SharePlatform = 'facebook' | 'twitter' | 'instagram' | 'copy'

const props = withDefaults(
  defineProps<{
    targetId: number
    targetType: ReactionTargetType
    reactionCategory: ReactionCategoryEnum
    targetTitle?: string
    compact?: boolean
    showHeader?: boolean
    showShare?: boolean
    startCommentOpen?: boolean
  }>(),
  {
    targetTitle: '',
    compact: false,
    showHeader: true,
    showShare: false,
    startCommentOpen: false,
  },
)

const emit = defineEmits<{
  submitted: []
  cleared: []
  shared: [platform: SharePlatform]
}>()

const reactionStore = useReactionStore()
const userStore = useUserStore()

const rating = ref(0)
const hoverRating = ref(0)
const selectedReactionType = ref<ReactionTypeEnum>('NEUTRAL')
const comment = ref('')
const showComment = ref(props.startCommentOpen)
const isSubmitting = ref(false)
const reactionMessage = ref('')
const reactionStatus = ref<'success' | 'error' | ''>('')

const sharePlatforms: Array<{
  key: SharePlatform
  label: string
  icon: string
}> = [
  {
    key: 'facebook',
    label: 'Facebook',
    icon: 'kind-icon:facebook',
  },
  {
    key: 'twitter',
    label: 'Twitter',
    icon: 'kind-icon:twitter',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    icon: 'kind-icon:instagram',
  },
  {
    key: 'copy',
    label: 'Copy',
    icon: 'kind-icon:copy',
  },
]

const formattedTargetType = computed(() => {
  return props.targetType
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (letter) => letter.toUpperCase())
})

const canSubmit = computed(() => {
  return Boolean(props.targetId && props.targetType && props.reactionCategory)
})

function setRating(value: number) {
  rating.value = value
}

function toggleComment() {
  showComment.value = !showComment.value
}

function clearReaction() {
  rating.value = 0
  hoverRating.value = 0
  selectedReactionType.value = 'NEUTRAL'
  comment.value = ''
  showComment.value = props.startCommentOpen
  reactionMessage.value = ''
  reactionStatus.value = ''
  emit('cleared')
}

function getTargetIdPayload() {
  const idKeyMap: Record<ReactionTargetType, string> = {
    art: 'artId',
    artImage: 'artImageId',
    artCollection: 'artCollectionId',
    bot: 'botId',
    butterfly: 'butterflyId',
    character: 'characterId',
    chat: 'chatId',
    component: 'componentId',
    dream: 'dreamId',
    gallery: 'galleryId',
    pitch: 'pitchId',
    prompt: 'promptId',
    resource: 'resourceId',
    reward: 'rewardId',
    scenario: 'scenarioId',
    tag: 'tagId',
    theme: 'themeId',
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

  if (!canSubmit.value) {
    reactionStatus.value = 'error'
    reactionMessage.value = 'Missing reaction target.'
    return
  }

  isSubmitting.value = true
  reactionMessage.value = ''
  reactionStatus.value = ''

  try {
    await reactionStore.addReaction({
      ...getReactionTargetPayload(props.targetType, props.targetId),
      userId: userStore.user.id,
      rating: rating.value,
      reactionType: selectedReactionType.value,
      comment: comment.value.trim(),
      reactionCategory: props.reactionCategory,
    } as Parameters<typeof reactionStore.addReaction>[0])

    reactionStatus.value = 'success'
    reactionMessage.value = 'Reaction submitted.'
    emit('submitted')
  } catch (error) {
    reactionStatus.value = 'error'
    reactionMessage.value =
      error instanceof Error ? error.message : 'Failed to submit reaction.'
  } finally {
    isSubmitting.value = false
  }
}

async function share(platform: SharePlatform) {
  const title = props.targetTitle || formattedTargetType.value
  const text = `Check this out: ${title}`

  if (platform === 'copy') {
    await navigator.clipboard.writeText(text)
    reactionStatus.value = 'success'
    reactionMessage.value = 'Copied share text.'
    emit('shared', platform)
    return
  }

  emit('shared', platform)
}
</script>
