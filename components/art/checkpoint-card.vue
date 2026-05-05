<!-- /components/content/art/checkpoint-card.vue -->
<template>
  <reactable-card
    :selected="isActive"
    :compact="compact"
    :show-reaction="canReact"
    :target-id="reactionTargetId"
    target-type="resource"
    reaction-category="RESOURCE"
    :target-title="checkpointLabel"
    :card-class="isHiddenMature ? 'opacity-75' : ''"
    @select="selectCheckpoint"
  >
    <div
      v-if="showImage"
      :class="[
        'relative w-full overflow-hidden rounded-2xl border border-base-300 bg-base-300',
        imageHeightClass,
      ]"
    >
      <art-card
        v-if="art && !isHiddenMature"
        :art="art"
        :compact="true"
        :show-actions="false"
        :show-prompt="false"
        :show-meta="false"
        :show-select-button="false"
        :show-reaction="false"
        :auto-load-image="autoLoadArtImage"
        class="h-full w-full rounded-none border-0 bg-transparent p-0"
      />

      <img
        v-else-if="imageSource && !isHiddenMature"
        :src="imageSource"
        :alt="checkpointLabel"
        class="h-full w-full object-cover transition-transform group-hover:scale-105"
        loading="lazy"
      />

      <div
        v-else
        class="flex h-full w-full items-center justify-center bg-base-200"
      >
        <div class="flex flex-col items-center gap-2 text-base-content/45">
          <Icon
            :name="isHiddenMature ? 'kind-icon:lock' : fallbackIcon"
            class="h-10 w-10"
          />

          <span class="text-xs font-bold">
            {{ isHiddenMature ? 'Mature hidden' : 'No preview' }}
          </span>
        </div>
      </div>

      <div class="absolute left-2 top-2 flex flex-wrap gap-1">
        <span
          v-if="isActive && showActiveBadge"
          class="badge badge-primary badge-sm"
        >
          Active
        </span>

        <span
          v-if="checkpoint.isMature && showMatureBadge"
          class="badge badge-warning badge-sm"
        >
          Mature
        </span>
      </div>

      <div
        v-if="isActive"
        class="absolute bottom-2 right-2 rounded-full bg-primary p-2 text-primary-content shadow"
      >
        <Icon name="kind-icon:check" class="h-4 w-4" />
      </div>
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-2 text-center">
      <h3
        :class="[
          'font-black leading-tight text-base-content',
          compact ? 'line-clamp-2 text-sm' : 'line-clamp-2 text-base',
        ]"
        :title="checkpointLabel"
      >
        {{ checkpointLabel }}
      </h3>

      <p
        v-if="showDescription && checkpoint.description && !isHiddenMature"
        class="line-clamp-2 text-xs text-base-content/60"
      >
        {{ checkpoint.description }}
      </p>

      <div v-if="showMeta" class="flex flex-wrap justify-center gap-2">
        <span v-if="checkpoint.localPath" class="badge badge-outline badge-sm">
          Local
        </span>

        <span v-if="checkpoint.artImageId" class="badge badge-ghost badge-sm">
          Preview
        </span>

        <span v-if="checkpoint.userId" class="badge badge-primary badge-sm">
          User
        </span>

        <span
          v-if="checkpoint.generation"
          class="badge badge-secondary badge-sm"
        >
          {{ checkpoint.generation }}
        </span>
      </div>

      <button
        v-if="showSelectButton"
        class="btn btn-sm mt-auto rounded-xl"
        :class="isActive ? 'btn-primary text-white' : 'btn-outline'"
        type="button"
        :disabled="!canSelect"
        @click.stop="selectCheckpoint"
      >
        <Icon name="kind-icon:checkpoint" class="h-4 w-4" />
        {{ isActive ? 'Selected' : 'Select' }}
      </button>
    </div>

    <details
      v-if="showDebug"
      class="rounded-2xl border border-base-300 bg-base-200 p-2"
      @click.stop
    >
      <summary class="cursor-pointer text-xs font-bold text-base-content/70">
        Debug
      </summary>

      <pre class="mt-2 max-h-48 overflow-auto text-xs text-base-content/70">{{
        JSON.stringify(checkpoint, null, 2)
      }}</pre>
    </details>
  </reactable-card>
</template>

<script setup lang="ts">
// /components/content/art/checkpoint-card.vue
import { computed } from 'vue'
import type { Art } from '~/prisma/generated/prisma/client'
import type { Resource } from '@/stores/resourceStore'
import { useCheckpointStore } from '@/stores/checkpointStore'

type CheckpointResource = Partial<Resource> & {
  id?: number
  name?: string | null
  customLabel?: string | null
  description?: string | null
  localPath?: string | null
  MediaPath?: string | null
  generation?: string | null
  isMature?: boolean | null
  artImageId?: number | null
  userId?: number | null
}

const props = withDefaults(
  defineProps<{
    checkpoint: CheckpointResource
    art?: Art | null
    showMature?: boolean
    cacheBuster?: number
    compact?: boolean
    showImage?: boolean
    showDescription?: boolean
    showMeta?: boolean
    showSelectButton?: boolean
    showActiveBadge?: boolean
    showMatureBadge?: boolean
    showReaction?: boolean
    showDebug?: boolean
    allowSelect?: boolean
    autoLoadArtImage?: boolean
    fallbackImage?: string
    fallbackIcon?: string
    imageHeightClass?: string
  }>(),
  {
    art: null,
    showMature: false,
    cacheBuster: 0,
    compact: false,
    showImage: true,
    showDescription: true,
    showMeta: true,
    showSelectButton: false,
    showActiveBadge: true,
    showMatureBadge: true,
    showReaction: false,
    showDebug: false,
    allowSelect: true,
    autoLoadArtImage: true,
    fallbackImage: '/images/backtree.webp',
    fallbackIcon: 'kind-icon:image',
    imageHeightClass: 'h-40',
  },
)

const checkpointStore = useCheckpointStore()

const isActive = computed(() => {
  return Boolean(
    props.checkpoint.name &&
    checkpointStore.currentApiModel === props.checkpoint.name,
  )
})

const isHiddenMature = computed(() => {
  return Boolean(props.checkpoint.isMature && !props.showMature)
})

const reactionTargetId = computed(() => {
  const id = Number(props.checkpoint.id)

  return Number.isInteger(id) && id > 0 ? id : 0
})

const canReact = computed(() => {
  return Boolean(props.showReaction && reactionTargetId.value > 0)
})

const canSelect = computed(() => {
  return Boolean(
    props.allowSelect && props.checkpoint.name && !isHiddenMature.value,
  )
})

function safeText(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value)

  return ''
}

const checkpointLabel = computed(() => {
  if (isHiddenMature.value) return 'Hidden Checkpoint'

  return (
    safeText(props.checkpoint.customLabel).trim() ||
    safeText(props.checkpoint.name).trim() ||
    'Unnamed Checkpoint'
  )
})

const imageSource = computed(() => {
  const path =
    safeText(props.checkpoint.MediaPath).trim() ||
    safeText(props.fallbackImage).trim()

  if (!path) return ''

  if (!props.cacheBuster) return path

  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}t=${props.cacheBuster}`
})

function selectCheckpoint() {
  if (!canSelect.value || !props.checkpoint.name) return

  checkpointStore.selectCheckpointByName(props.checkpoint.name)
}
</script>
