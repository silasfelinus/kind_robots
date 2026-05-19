// /components/content/art/art-reactions.vue
<template>
  <div
    class="relative mx-auto w-full max-w-3xl space-y-6 rounded-2xl border border-base-300 bg-base-200 p-6 shadow-lg"
  >
    <h2 class="text-xl font-bold text-primary">React to this Image</h2>

    <div
      v-if="!currentArtImage"
      class="rounded-2xl border border-base-300 bg-base-100 p-4 text-sm text-base-content/60"
    >
      Select an image first. The reaction goblin needs a target.
    </div>

    <template v-else>
      <div class="flex items-center gap-2">
        <span class="font-semibold">Rate:</span>
        <div class="flex gap-1">
          <button
            v-for="star in 5"
            :key="star"
            class="cursor-pointer select-none border-0 bg-transparent p-0 text-3xl transition-transform duration-100"
            :class="{
              'scale-110 text-yellow-400': hoverRating >= star,
              'text-yellow-300': hoverRating === 0 && rating >= star,
              'text-gray-400': hoverRating < star && rating < star,
            }"
            type="button"
            @mouseenter="hoverRating = star"
            @mouseleave="hoverRating = 0"
            @click="setRating(star)"
          >
            ★
          </button>
        </div>
      </div>

      <div class="space-y-2">
        <label class="font-semibold">Reaction Type</label>
        <select
          v-model="selectedReactionType"
          class="select select-bordered w-full rounded-2xl bg-base-100"
        >
          <option v-for="type in reactionTypes" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
      </div>

      <div>
        <input
          v-model="comment"
          class="input input-bordered w-full rounded-2xl bg-base-100"
          placeholder="Leave a comment..."
        />
      </div>

      <div class="flex flex-wrap gap-2">
        <button class="btn btn-primary rounded-2xl" @click="submitReaction">
          <Icon name="kind-icon:submit" class="mr-1" />
          Submit
        </button>

        <button class="btn btn-outline rounded-2xl" @click="clearReaction">
          <Icon name="kind-icon:clear" class="mr-1" />
          Clear
        </button>
      </div>

      <div v-if="reactionMessage" class="mt-2">
        <div
          :class="[
            'alert shadow-sm',
            reactionStatus === 'success' ? 'alert-success' : 'alert-error',
          ]"
        >
          <Icon
            :name="
              reactionStatus === 'success'
                ? 'kind-icon:check'
                : 'kind-icon:warning'
            "
            class="mr-2"
          />
          {{ reactionMessage }}
        </div>
      </div>

      <div v-if="publicReactions.length" class="border-t border-base-300 pt-6">
        <h3 class="mb-2 text-lg font-semibold text-base-content">
          Recent Reactions
        </h3>

        <ul class="space-y-2">
          <li
            v-for="reaction in publicReactions"
            :key="reaction.id"
            class="rounded-2xl border border-base-300 bg-base-100 p-3 text-sm"
          >
            <div class="flex items-center justify-between gap-3">
              <div>
                <strong>{{ reaction.reactionType }}</strong>
                <span v-if="reaction.rating"> · {{ reaction.rating }}/5</span>
              </div>

              <span class="text-xs text-base-content/70">
                {{ formatDate(reaction.createdAt) }}
              </span>
            </div>

            <p v-if="reaction.comment" class="mt-1 text-base-content/80">
              “{{ reaction.comment }}”
            </p>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  useReactionStore,
  reactionTypes,
  type ReactionTypeEnum,
} from '@/stores/reactionStore'
import { useUserStore } from '@/stores/userStore'
import { useArtStore } from '@/stores/artStore'

type ImageReaction = {
  id: number
  artImageId?: number | null
  userId: number
  rating: number
  reactionType: ReactionTypeEnum
  comment?: string | null
  createdAt: Date | string
}

type ReactionFetchStore = ReturnType<typeof useReactionStore> & {
  fetchReactionsByArtImageId?: (id: number) => Promise<unknown>
  fetchReactions?: () => Promise<unknown>
}

const userStore = useUserStore()
const artStore = useArtStore()
const reactionStore = useReactionStore() as ReactionFetchStore

const currentArtImage = computed(() => artStore.currentArtImage)
const userId = computed(() => userStore.user?.id || userStore.userId || 10)

const rating = ref(0)
const hoverRating = ref(0)
const selectedReactionType = ref<ReactionTypeEnum>('NEUTRAL')
const comment = ref('')
const reactionMessage = ref('')
const reactionStatus = ref<'success' | 'error' | ''>('')

const imageReactions = computed<ImageReaction[]>(() => {
  return reactionStore.reactions as ImageReaction[]
})

const publicReactions = computed(() => {
  const imageId = currentArtImage.value?.id
  if (!imageId) return []

  return imageReactions.value.filter((reaction) => {
    return reaction.artImageId === imageId && reaction.userId !== userId.value
  })
})

watch(
  () => currentArtImage.value?.id,
  async (imageId) => {
    clearReaction()

    if (!imageId) return

    await fetchImageReactions(imageId)
    hydrateMyReaction(imageId)
  },
  { immediate: true },
)

onMounted(async () => {
  const imageId = currentArtImage.value?.id
  if (!imageId) return

  await fetchImageReactions(imageId)
  hydrateMyReaction(imageId)
})

function setRating(value: number) {
  rating.value = value
}

function clearReaction() {
  rating.value = 0
  hoverRating.value = 0
  selectedReactionType.value = 'NEUTRAL'
  comment.value = ''
}

function hydrateMyReaction(imageId: number) {
  const myReaction = imageReactions.value.find((reaction) => {
    return reaction.artImageId === imageId && reaction.userId === userId.value
  })

  if (!myReaction) return

  rating.value = myReaction.rating
  selectedReactionType.value = myReaction.reactionType
  comment.value = myReaction.comment || ''
}

async function fetchImageReactions(imageId: number) {
  if (typeof reactionStore.fetchReactionsByArtImageId === 'function') {
    await reactionStore.fetchReactionsByArtImageId(imageId)
    return
  }

  if (typeof reactionStore.fetchReactions === 'function') {
    await reactionStore.fetchReactions()
  }
}

async function submitReaction() {
  const imageId = currentArtImage.value?.id
  const activeUserId = userStore.user?.id || userStore.userId

  if (!imageId || !activeUserId) {
    reactionStatus.value = 'error'
    reactionMessage.value = 'Login required.'
    return
  }

  try {
    await reactionStore.addReaction({
      artImageId: imageId,
      userId: activeUserId,
      rating: rating.value,
      reactionType: selectedReactionType.value,
      comment: comment.value,
      reactionCategory: 'ART_IMAGE',
    })

    reactionStatus.value = 'success'
    reactionMessage.value = 'Image reaction submitted.'
  } catch (error) {
    console.error('Image reaction failed:', error)
    reactionStatus.value = 'error'
    reactionMessage.value = 'Submission failed.'
  }

  setTimeout(() => {
    reactionStatus.value = ''
    reactionMessage.value = ''
  }, 5000)
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString()
}
</script>
