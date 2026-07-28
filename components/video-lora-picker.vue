<template>
  <section class="space-y-3 rounded-lg border border-base-300 p-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="font-semibold">
          LoRA <span class="opacity-50">(optional)</span>
        </h2>
        <p class="text-xs opacity-60">
          {{ engine.toUpperCase() }}-compatible Resources only. Preview images
          come from the Resource record.
        </p>
      </div>
      <button
        v-if="modelValue"
        type="button"
        class="btn btn-xs btn-ghost"
        @click="emit('update:modelValue', null)"
      >
        Clear LoRA
      </button>
    </div>

    <div
      v-if="resourceStore.isLoading && !resourceStore.hasLoaded"
      class="flex min-h-28 items-center justify-center rounded-lg bg-base-200"
    >
      <span class="loading loading-spinner loading-sm" />
    </div>

    <div
      v-else-if="!compatibleResources.length"
      class="rounded-lg border border-dashed border-base-300 bg-base-200/50 p-4 text-center text-sm opacity-70"
    >
      No active {{ engine.toUpperCase() }} LoRA Resources are available.
    </div>

    <div v-else class="max-h-64 overflow-y-auto overscroll-contain pr-1">
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <button
          v-for="resource in compatibleResources"
          :key="resource.id"
          type="button"
          class="overflow-hidden rounded-lg border text-left transition"
          :class="
            modelValue === resource.id
              ? 'border-accent bg-accent/10 ring-2 ring-accent/20'
              : 'border-base-300 bg-base-100 hover:border-accent/60'
          "
          :aria-pressed="modelValue === resource.id"
          @click="selectResource(resource.id)"
        >
          <div
            v-if="previewImages(resource).length"
            class="grid aspect-video w-full overflow-hidden bg-base-200"
            :class="
              previewImages(resource).length > 1
                ? 'grid-cols-2'
                : 'grid-cols-1'
            "
          >
            <img
              v-for="src in previewImages(resource)"
              :key="src"
              :src="src"
              :alt="`${resourceLabel(resource)} preview`"
              class="h-full min-h-0 w-full object-cover"
              loading="lazy"
              @error="hideBrokenImage"
            />
          </div>
          <div
            v-else
            class="flex aspect-video items-center justify-center bg-base-200 text-3xl opacity-30"
            aria-hidden="true"
          >
            🎞️
          </div>

          <div class="space-y-1 p-3">
            <div class="flex items-start justify-between gap-2">
              <span class="font-semibold leading-tight">
                {{ resourceLabel(resource) }}
              </span>
              <span class="flex shrink-0 items-center gap-1">
                <span
                  v-if="resource.isMature"
                  class="badge badge-error badge-outline badge-sm"
                >
                  18+
                </span>
                <span
                  v-if="modelValue === resource.id"
                  class="badge badge-accent badge-sm"
                >
                  Selected
                </span>
              </span>
            </div>
            <p
              class="truncate text-xs opacity-60"
              :title="resource.localPath || ''"
            >
              {{ resource.localPath }}
            </p>
            <p
              v-if="resource.defaultTrigger || resource.triggerWords"
              class="line-clamp-2 text-xs opacity-70"
            >
              {{ resource.defaultTrigger || resource.triggerWords }}
            </p>
          </div>
        </button>
      </div>
    </div>

    <div
      v-if="selectedResource"
      class="grid gap-3 rounded-lg bg-base-200 p-3 sm:grid-cols-[1fr_7rem] sm:items-end"
    >
      <label class="space-y-1">
        <span class="text-sm font-semibold">
          LoRA strength: {{ normalizedStrength.toFixed(2) }}
        </span>
        <input
          :value="normalizedStrength"
          type="range"
          min="-2"
          max="2"
          step="0.05"
          class="range range-accent range-sm w-full"
          @input="updateStrength"
        />
      </label>
      <input
        :value="normalizedStrength"
        type="number"
        min="-2"
        max="2"
        step="0.05"
        class="input input-bordered input-sm w-full"
        aria-label="LoRA strength"
        @input="updateStrength"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useResourceStore } from '@/stores/resourceStore'
import type { VideoEngine } from '@/stores/videoStore'
import type { Resource } from '~/prisma/generated/prisma/client'

type PreviewArtImage = {
  imagePath?: string | null
  path?: string | null
  thumbnailPath?: string | null
}

type VideoLoraResource = Resource & {
  ArtImage?: PreviewArtImage | null
}

const props = defineProps<{
  modelValue: number | null
  strength: number
  engine: VideoEngine
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  'update:strength': [value: number]
}>()

const artStore = useArtStore()
const resourceStore = useResourceStore()

const compatibleResources = computed<VideoLoraResource[]>(() => {
  const supportedServer = props.engine.toUpperCase()

  return (resourceStore.resources as VideoLoraResource[]).filter((resource) => {
    return (
      (resource.resourceType === 'LORA' ||
        resource.resourceType === 'LYCORIS') &&
      Boolean(resource.localPath?.trim()) &&
      (!resource.isMature || artStore.showMature) &&
      (resource.supportedServer === supportedServer ||
        resource.supportedServer === 'GENERIC')
    )
  })
})

const selectedResource = computed(
  () =>
    compatibleResources.value.find(
      (resource) => resource.id === props.modelValue,
    ) ?? null,
)

const normalizedStrength = computed(() => clampStrength(props.strength))

onMounted(async () => {
  if (!resourceStore.hasLoaded) {
    await resourceStore.getResources()
  }
})

watch(
  [() => props.engine, compatibleResources],
  () => {
    if (props.modelValue && !selectedResource.value) {
      emit('update:modelValue', null)
    }
  },
  { immediate: true },
)

function resourceLabel(resource: VideoLoraResource): string {
  return resource.customLabel?.trim() || resource.name
}

function normalizeImagePath(value: string | null | undefined): string {
  const path = String(value || '').trim()
  if (!path) return ''
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:') ||
    path.startsWith('/')
  ) {
    return path
  }
  return `/${path.replace(/^\/+/, '')}`
}

function previewImages(resource: VideoLoraResource): string[] {
  return [
    resource.previewImageUrl,
    resource.imagePath,
    resource.MediaPath,
    resource.ArtImage?.thumbnailPath,
    resource.ArtImage?.imagePath,
    resource.ArtImage?.path,
  ]
    .map(normalizeImagePath)
    .filter(
      (path, index, paths) => Boolean(path) && paths.indexOf(path) === index,
    )
}

function selectResource(resourceId: number): void {
  emit('update:modelValue', props.modelValue === resourceId ? null : resourceId)
}

function clampStrength(value: unknown): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 1
  return Math.min(2, Math.max(-2, parsed))
}

function updateStrength(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update:strength', clampStrength(target.value))
}

function hideBrokenImage(event: Event): void {
  ;(event.target as HTMLImageElement).style.display = 'none'
}
</script>
