<!-- /components/model/model-card.vue -->
<!--
  A single checkpoint (base model) in the model browser. Mirrors <lora-card>
  (reactable-card + preview image + base-model badge + localPath health + Edit),
  but for CHECKPOINT resources: no trigger words, and it shows the base model /
  folder rather than a LoRA type. Maturity gating matches lora-card — a mature
  row is hidden (image + details) when the viewer hasn't opted in.
-->
<template>
  <reactable-card
    :compact="compact"
    :show-reaction="canReact"
    :target-id="reactionTargetId"
    target-type="resource"
    reaction-category="RESOURCE"
    :target-title="modelLabel"
    :card-class="isHiddenMature ? 'opacity-75' : ''"
    @select="emitEdit"
  >
    <template v-if="showEdit" #actions>
      <button
        class="rounded-full bg-base-100 p-2 text-primary shadow transition hover:bg-primary hover:text-primary-content"
        type="button"
        title="Edit model"
        @click.stop="emitEdit"
      >
        <Icon name="kind-icon:edit" class="h-4 w-4" />
      </button>
    </template>

    <div
      v-if="showImage"
      :class="[
        'relative w-full overflow-hidden rounded-2xl border border-base-300 bg-base-300',
        imageHeightClass,
      ]"
    >
      <img
        v-if="imageSource && !isHiddenMature"
        :src="imageSource"
        :alt="modelLabel"
        class="h-full w-full object-cover transition-transform group-hover:scale-105"
        loading="lazy"
        @error="imageFailed = true"
      />

      <div
        v-else
        class="flex h-full w-full items-center justify-center bg-base-200"
      >
        <div class="flex flex-col items-center gap-2 text-base-content/45">
          <Icon
            :name="isHiddenMature ? 'kind-icon:lock' : 'kind-icon:checkpoint'"
            class="h-10 w-10"
          />

          <span class="text-xs font-bold">
            {{ isHiddenMature ? 'Mature hidden' : 'No preview' }}
          </span>
        </div>
      </div>

      <div class="absolute left-2 top-2 flex flex-wrap gap-1">
        <span v-if="baseModel" class="badge badge-secondary badge-sm">
          {{ baseModel }}
        </span>

        <span
          v-if="model.isMature && showMatureBadge"
          class="badge badge-warning badge-sm"
        >
          Mature
        </span>
      </div>

      <div
        v-if="!hasLocalPath"
        class="absolute bottom-2 right-2 badge badge-error badge-sm shadow"
        title="No localPath — this checkpoint can't be sent to a render until it is re-scanned."
      >
        needs re-scan
      </div>
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-2 text-center">
      <h3
        :class="[
          'font-black leading-tight text-base-content line-clamp-2',
          compact ? 'text-sm' : 'text-base',
        ]"
        :title="modelLabel"
      >
        {{ modelLabel }}
      </h3>

      <p
        v-if="showDescription && modelDescription && !isHiddenMature"
        class="line-clamp-2 text-xs text-base-content/60"
      >
        {{ modelDescription }}
      </p>

      <p
        v-if="hasLocalPath && !isHiddenMature"
        class="line-clamp-1 font-mono text-[11px] text-base-content/45"
        :title="localPathText"
      >
        {{ localPathText }}
      </p>

      <div v-if="showMeta" class="flex flex-wrap justify-center gap-2">
        <span v-if="model.civitaiUrl" class="badge badge-outline badge-sm">
          Civitai
        </span>

        <span v-if="model.hash" class="badge badge-outline badge-sm">
          hashed
        </span>
      </div>

      <button
        v-if="showEdit"
        class="btn btn-sm btn-outline mt-auto rounded-xl"
        type="button"
        @click.stop="emitEdit"
      >
        <Icon name="kind-icon:edit" class="h-4 w-4" />
        Edit
      </button>
    </div>
  </reactable-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Resource } from '@/stores/resourceStore'

const props = withDefaults(
  defineProps<{
    model: Partial<Resource>
    showMature?: boolean
    compact?: boolean
    showImage?: boolean
    showDescription?: boolean
    showMeta?: boolean
    showMatureBadge?: boolean
    showReaction?: boolean
    showEdit?: boolean
    imageHeightClass?: string
  }>(),
  {
    showMature: false,
    compact: false,
    showImage: true,
    showDescription: true,
    showMeta: true,
    showMatureBadge: true,
    showReaction: false,
    showEdit: true,
    imageHeightClass: 'h-44',
  },
)

const emit = defineEmits<{
  edit: [model: Partial<Resource>]
}>()

const imageFailed = ref(false)

function safeText(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return ''
}

const isHiddenMature = computed(() => {
  return Boolean(props.model.isMature && !props.showMature)
})

const modelLabel = computed(() => {
  if (isHiddenMature.value) return 'Hidden model'

  return (
    safeText(props.model.customLabel).trim() ||
    safeText(props.model.name).trim() ||
    'Unnamed model'
  )
})

const modelDescription = computed(() => {
  return safeText(props.model.description).trim()
})

const localPathText = computed(() => {
  return safeText(props.model.localPath).trim()
})

// Base model: prefer the checkpoint's folder (the reliable post-repair signal),
// then the tagged generation / supportedServer.
const baseModel = computed(() => {
  const path = localPathText.value.replaceAll('\\', '/').replace(/^\/+/, '')
  const folder = path.includes('/') ? path.split('/')[0] : ''

  return (
    folder ||
    safeText(props.model.generation).trim() ||
    safeText(props.model.supportedServer).trim()
  ).toUpperCase()
})

const hasLocalPath = computed(() => {
  return localPathText.value.length > 0
})

const imageSource = computed(() => {
  if (isHiddenMature.value || imageFailed.value) return ''

  return (
    safeText(props.model.previewImageUrl).trim() ||
    safeText(props.model.imagePath).trim() ||
    safeText(props.model.MediaPath).trim() ||
    ''
  )
})

const reactionTargetId = computed(() => {
  const id = Number(props.model.id)

  return Number.isInteger(id) && id > 0 ? id : 0
})

const canReact = computed(() => {
  return Boolean(props.showReaction && reactionTargetId.value > 0)
})

function emitEdit() {
  if (!props.showEdit) return

  emit('edit', props.model)
}
</script>
