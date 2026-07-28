<!-- /components/lora/lora-card.vue -->
<!--
  A single LoRA in the My Library browser. Built on <reactable-card> like
  <checkpoint-card>, but surfaces the LoRA-specific fields (preview image,
  base model, trigger words, localPath health) and an Edit affordance instead
  of a "select" action. Maturity gating mirrors checkpoint-card: when the row
  is mature and the viewer hasn't opted in, the image and details are hidden.
-->
<template>
  <reactable-card
    :compact="compact"
    :show-reaction="canReact"
    :target-id="reactionTargetId"
    target-type="resource"
    reaction-category="RESOURCE"
    :target-title="loraLabel"
    :card-class="isHiddenMature ? 'opacity-75' : ''"
    @select="emitEdit"
  >
    <template v-if="showEdit" #actions>
      <button
        class="rounded-full bg-base-100 p-2 text-primary shadow transition hover:bg-primary hover:text-primary-content"
        type="button"
        title="Edit LoRA"
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
        :alt="loraLabel"
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
            :name="isHiddenMature ? 'kind-icon:lock' : 'kind-icon:image'"
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
          v-if="lora.isMature && showMatureBadge"
          class="badge badge-warning badge-sm"
        >
          Mature
        </span>
      </div>

      <div
        v-if="!hasLocalPath"
        class="absolute bottom-2 right-2 badge badge-error badge-sm shadow"
        title="No localPath — this LoRA can't be sent to a render until it is re-scanned."
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
        :title="loraLabel"
      >
        {{ loraLabel }}
      </h3>

      <p
        v-if="showDescription && loraDescription && !isHiddenMature"
        class="line-clamp-2 text-xs text-base-content/60"
      >
        {{ loraDescription }}
      </p>

      <div
        v-if="showTriggerWords && triggerList.length && !isHiddenMature"
        class="flex flex-wrap justify-center gap-1"
      >
        <span
          v-for="trigger in triggerList"
          :key="trigger"
          class="badge badge-outline badge-xs font-mono"
        >
          {{ trigger }}
        </span>
      </div>

      <div v-if="showMeta" class="flex flex-wrap justify-center gap-2">
        <span v-if="hasLocalPath" class="badge badge-ghost badge-sm">
          {{ loraType }}
        </span>

        <span v-if="lora.civitaiUrl" class="badge badge-outline badge-sm">
          Civitai
        </span>

        <span v-if="lora.hash" class="badge badge-outline badge-sm">
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
    lora: Partial<Resource>
    showMature?: boolean
    compact?: boolean
    showImage?: boolean
    showDescription?: boolean
    showTriggerWords?: boolean
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
    showTriggerWords: true,
    showMeta: true,
    showMatureBadge: true,
    showReaction: false,
    showEdit: true,
    imageHeightClass: 'h-44',
  },
)

const emit = defineEmits<{
  edit: [lora: Partial<Resource>]
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
  return Boolean(props.lora.isMature && !props.showMature)
})

const loraLabel = computed(() => {
  if (isHiddenMature.value) return 'Hidden LoRA'

  return (
    safeText(props.lora.customLabel).trim() ||
    safeText(props.lora.name).trim() ||
    'Unnamed LoRA'
  )
})

const loraDescription = computed(() => {
  return safeText(props.lora.description).trim()
})

const baseModel = computed(() => {
  return (
    safeText(props.lora.generation).trim() ||
    safeText(props.lora.supportedServer).trim()
  )
})

const loraType = computed(() => {
  const type = safeText(props.lora.resourceType).trim().toUpperCase()
  return type === 'LYCORIS' ? 'LyCORIS' : 'LoRA'
})

const hasLocalPath = computed(() => {
  return safeText(props.lora.localPath).trim().length > 0
})

const triggerList = computed(() => {
  const source =
    safeText(props.lora.defaultTrigger).trim() ||
    safeText(props.lora.triggerWords).trim()

  if (!source) return []

  return source
    .split(',')
    .map((word) => word.trim())
    .filter(Boolean)
    .slice(0, 6)
})

const imageSource = computed(() => {
  if (isHiddenMature.value || imageFailed.value) return ''

  return (
    safeText(props.lora.previewImageUrl).trim() ||
    safeText(props.lora.imagePath).trim() ||
    safeText(props.lora.MediaPath).trim() ||
    ''
  )
})

const reactionTargetId = computed(() => {
  const id = Number(props.lora.id)

  return Number.isInteger(id) && id > 0 ? id : 0
})

const canReact = computed(() => {
  return Boolean(props.showReaction && reactionTargetId.value > 0)
})

function emitEdit() {
  if (!props.showEdit) return

  emit('edit', props.lora)
}
</script>
