<!-- /components/resources/resource-card.vue -->
<template>
  <article
    class="group flex h-full flex-col overflow-hidden kr-panel p-0 transition hover:-translate-y-0.5 hover:shadow-lg"
  >
    <button
      type="button"
      class="relative aspect-square w-full shrink-0 overflow-hidden bg-base-200 text-left"
      :aria-label="`Open ${label}`"
      @click="emit('open', resource.id)"
    >
      <kr-deferred-image
        :src="previewSrc"
        :alt="label"
        class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
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
    </button>

    <div class="flex flex-1 flex-col gap-2 p-3">
      <h3
        class="line-clamp-3 break-words text-sm font-black leading-snug"
        :title="label"
      >
        {{ label }}
      </h3>

      <p
        v-if="triggerText"
        class="line-clamp-1 rounded-lg bg-base-200/70 px-2 py-1 font-mono text-xs text-base-content/80"
        :title="triggerText"
      >
        {{ triggerText }}
      </p>

      <p
        v-if="humanDescription"
        class="line-clamp-2 text-xs text-base-content/60"
      >
        {{ humanDescription }}
      </p>

      <span v-if="showsServerBadge" class="badge badge-outline badge-xs w-fit">
        {{ resource.supportedServer }}
      </span>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ResourceGalleryRecord } from '@/stores/resourceGalleryStore'

const props = defineProps<{
  resource: ResourceGalleryRecord
}>()

const emit = defineEmits<{
  open: [id: number]
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

function isMachineDescription(text: string): boolean {
  const segments = text
    .split('|')
    .map((segment) => segment.trim())
    .filter(Boolean)

  if (segments.length < 2) return false

  const fielded = segments.filter((segment) =>
    /^[\w ]{2,24}:\s*\S/.test(segment),
  ).length

  return fielded >= 2 && fielded * 2 >= segments.length
}

const humanDescription = computed(() => {
  const text = (props.resource.description || '').trim()
  if (!text || isMachineDescription(text)) return ''
  return text
})

function normalizeModelToken(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

const showsServerBadge = computed(() => {
  const server = normalizeModelToken(props.resource.supportedServer)
  if (!server) return false

  const generation = normalizeModelToken(props.resource.generation)
  if (!generation) return true

  return !server.startsWith(generation) && !generation.startsWith(server)
})
</script>
