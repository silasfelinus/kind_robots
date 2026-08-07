<!-- /components/resources/resource-card.vue -->
<!--
  One Resource (checkpoint, LoRA, LyCORIS) as a card.

  Extracted from resource-gallery.vue when that grid moved onto kr-gallery.
  The markup is unchanged; it needed an owner because a card inlined in an
  `#item` slot reaches its record back through the slot's GalleryItem, and
  every one of the ~20 references would have become
  `resourceById.get(Number(item.id))!`.

  WHAT MOVED AND WHAT DID NOT. previewSrc and isEditable came with it -- pure
  functions of the record, so they belong to the thing that draws it. The five
  actions did NOT: generating a preview, uploading one, editing, and pushing a
  Resource into the art build all reach stores and APIs, so they are emits and
  the gallery decides what they mean. Same split the entity cards use, for the
  same reason -- a card that owns the consequence cannot be reused or exhibited.

  `label` and `triggerText` are the card's own copies. The gallery keeps its
  versions because the GENERATION path still needs them to build a prompt and
  choose checkpoint vs LoRA, which is store work. Duplicated deliberately: the
  alternative is the card importing from the gallery it is rendered by.

  The two busy flags are props rather than looked up, so this stays mountable in
  WonderLab from a plain fixture.

  NOT in verifyCardActionContract's ENTITY_CARDS: a Resource has no interact
  surface to `open`. Its primary actions are "add to build" and "start fresh",
  which are model-specific by nature. Adding it to that list would mean
  inventing an `open` with nowhere to go.
-->
<template>
  <article
    class="group flex min-h-[430px] flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
  >
    <div class="relative aspect-square overflow-hidden bg-base-200">
      <img
        :src="previewSrc"
        :alt="label"
        class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
        loading="lazy"
      />

      <div class="absolute left-2 top-2 flex flex-wrap gap-1">
        <span class="badge badge-primary badge-sm">
          {{ resource.resourceType }}
        </span>
        <span v-if="resource.generation" class="badge badge-neutral badge-sm">
          {{ resource.generation }}
        </span>
        <span v-if="resource.isMature" class="badge badge-error badge-sm">
          18+
        </span>
      </div>

      <div
        v-if="triggerText"
        class="absolute inset-x-2 bottom-2 translate-y-2 rounded-2xl bg-base-100/95 p-2 text-xs opacity-0 shadow transition group-hover:translate-y-0 group-hover:opacity-100"
      >
        <span class="font-semibold">Trigger:</span>
        {{ triggerText }}
      </div>
    </div>

    <div class="flex flex-1 flex-col gap-3 p-4">
      <div>
        <h3 class="line-clamp-2 text-lg font-bold">
          {{ label }}
        </h3>
        <p class="mt-1 line-clamp-3 text-sm text-base-content/65">
          {{ resource.description || 'No description yet.' }}
        </p>
      </div>

      <div class="flex flex-wrap gap-1 text-xs">
        <span class="badge badge-outline badge-sm">
          {{ resource.supportedServer }}
        </span>
        <span class="badge badge-outline badge-sm">
          {{ resource._count?.ArtImages || 0 }} checkpoint uses
        </span>
        <span class="badge badge-outline badge-sm">
          {{ resource._count?.UsedInImages || 0 }} LoRA uses
        </span>
      </div>

      <div class="mt-auto grid grid-cols-2 gap-2">
        <button
          type="button"
          class="btn btn-primary btn-sm rounded-2xl"
          @click="emit('add-to-build', resource)"
        >
          Add to build
        </button>
        <button
          type="button"
          class="btn btn-secondary btn-sm rounded-2xl"
          @click="emit('start-fresh', resource)"
        >
          Start fresh
        </button>
        <button
          type="button"
          class="btn btn-outline btn-sm rounded-2xl"
          :disabled="generatingPreview"
          @click="emit('generate-preview', resource)"
        >
          <span
            v-if="generatingPreview"
            class="loading loading-spinner loading-xs"
          />
          Generate preview
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-2xl"
          :disabled="uploadingPreview"
          @click="emit('upload-preview', resource)"
        >
          <span
            v-if="uploadingPreview"
            class="loading loading-spinner loading-xs"
          />
          Upload preview
        </button>
      </div>

      <button
        v-if="isEditable"
        type="button"
        class="btn btn-ghost btn-sm rounded-2xl"
        @click="emit('edit', resource)"
      >
        <icon name="kind-icon:edit" class="h-4 w-4" />
        Edit
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ResourceGalleryRecord } from '@/stores/resourceGalleryStore'

const EDITABLE_TYPES = ['CHECKPOINT', 'LORA', 'LYCORIS']

const props = withDefaults(
  defineProps<{
    resource: ResourceGalleryRecord
    generatingPreview?: boolean
    uploadingPreview?: boolean
  }>(),
  {
    generatingPreview: false,
    uploadingPreview: false,
  },
)

const emit = defineEmits<{
  edit: [resource: ResourceGalleryRecord]
  'add-to-build': [resource: ResourceGalleryRecord]
  'start-fresh': [resource: ResourceGalleryRecord]
  'generate-preview': [resource: ResourceGalleryRecord]
  'upload-preview': [resource: ResourceGalleryRecord]
}>()

const previewSrc = computed(
  () =>
    props.resource.ArtImage?.thumbnailPath ||
    props.resource.ArtImage?.imagePath ||
    props.resource.ArtImage?.path ||
    props.resource.previewImageUrl ||
    props.resource.imagePath ||
    '/images/kindart.webp',
)

const label = computed(() => props.resource.customLabel || props.resource.name)

const triggerText = computed(
  () =>
    props.resource.defaultTrigger ||
    props.resource.triggerWords ||
    props.resource.artPrompt ||
    '',
)

const isEditable = computed(() =>
  EDITABLE_TYPES.includes(String(props.resource.resourceType)),
)
</script>
