<!-- /components/art/art-lora-picker.vue -->
<template>
  <section class="space-y-3 kr-panel-flat p-3">
    <div class="flex flex-wrap items-start justify-between gap-2">
      <div class="min-w-0">
        <h3 class="flex items-center gap-2 text-sm font-bold">
          <Icon name="kind-icon:sparkles" class="size-4 text-secondary" />
          LoRA <span class="font-normal opacity-50">(optional)</span>
        </h3>
        <p class="mt-0.5 text-xs text-base-content/55">
          One LoRA per job — the Comfy workflows wire a single LoraLoader, and
          the queue rejects more than one.
        </p>
      </div>
      <button
        v-if="modelValue"
        type="button"
        class="btn btn-ghost btn-xs rounded-xl"
        @click="select(null)"
      >
        Clear
      </button>
    </div>

    <p
      v-if="!supported"
      class="rounded-xl border border-dashed border-base-300 bg-base-200/50 p-3 text-xs text-base-content/60"
    >
      {{ engineLabel }} builds its model into the workflow and ignores LoRAs.
      Switch to a preset that supports one to use this.
    </p>

    <template v-else>
      <div
        v-if="resourceStore.isLoading && !resourceStore.hasLoaded"
        class="flex min-h-24 items-center justify-center rounded-xl bg-base-200"
      >
        <span class="loading loading-spinner loading-sm" />
      </div>

      <p
        v-else-if="!rankedLoras.length"
        class="rounded-xl border border-dashed border-base-300 bg-base-200/50 p-3 text-center text-xs text-base-content/60"
      >
        No LoRA Resources are available to you yet. Add one from Discover, or
        turn on mature content above if the one you want is flagged 18+.
      </p>

      <template v-else>
        <input
          v-model="search"
          type="search"
          class="input input-bordered input-sm w-full rounded-xl bg-base-200"
          placeholder="Search LoRAs by name, path, or trigger word…"
        />

        <div class="max-h-72 overflow-y-auto overscroll-contain pr-1">
          <div
            class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-2"
          >
            <button
              v-for="entry in visibleLoras"
              :key="entry.resource.id"
              type="button"
              class="flex gap-2 overflow-hidden rounded-xl border p-2 text-left transition"
              :class="
                modelValue === entry.resource.id
                  ? 'border-secondary bg-secondary/10 ring-2 ring-secondary/20'
                  : 'border-base-300 bg-base-100 hover:border-secondary/60'
              "
              :aria-pressed="modelValue === entry.resource.id"
              @click="select(entry.resource.id)"
            >
              <span
                class="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-base-200"
              >
                <img
                  v-if="previewImage(entry.resource)"
                  :src="previewImage(entry.resource)"
                  :alt="`${loraLabel(entry.resource)} preview`"
                  class="size-full object-cover"
                  loading="lazy"
                  @error="hideBrokenImage"
                />
                <Icon
                  v-else
                  name="kind-icon:sparkles"
                  class="size-5 opacity-30"
                />
              </span>

              <span class="min-w-0 flex-1 space-y-1">
                <span class="flex items-start justify-between gap-1">
                  <span class="truncate text-sm font-semibold">
                    {{ loraLabel(entry.resource) }}
                  </span>
                  <span
                    v-if="entry.resource.isMature"
                    class="badge badge-error badge-outline badge-xs shrink-0"
                  >
                    18+
                  </span>
                </span>

                <span class="flex flex-wrap items-center gap-1">
                  <span
                    class="badge badge-xs rounded-lg"
                    :class="entry.rank > 0 ? 'badge-secondary' : 'badge-ghost'"
                    :title="
                      entry.rank > 0
                        ? `Ranked compatible with ${engineLabel}`
                        : `Not tagged for ${engineLabel} — it may not load`
                    "
                  >
                    {{ entry.resource.supportedServer }}
                  </span>
                </span>

                <span
                  v-if="triggerWords(entry.resource)"
                  class="line-clamp-2 block text-[11px] text-base-content/55"
                >
                  {{ triggerWords(entry.resource) }}
                </span>
              </span>
            </button>
          </div>
        </div>

        <p
          v-if="search.trim() && !visibleLoras.length"
          class="text-xs text-base-content/50"
        >
          No LoRA matches “{{ search.trim() }}”.
        </p>

        <div
          v-if="selectedLora"
          class="flex flex-wrap items-end gap-2 rounded-xl bg-base-200 p-3"
        >
          <label class="min-w-40 flex-1 space-y-1">
            <span class="text-xs font-bold">
              Strength · {{ clampedStrength.toFixed(2) }}
            </span>
            <input
              :value="clampedStrength"
              type="range"
              min="0"
              max="2"
              step="0.05"
              class="range range-secondary range-xs w-full"
              @input="onStrength"
            />
          </label>
          <input
            :value="clampedStrength"
            type="number"
            min="0"
            max="2"
            step="0.05"
            class="input input-bordered input-sm w-24 rounded-xl"
            aria-label="LoRA strength"
            @input="onStrength"
          />
        </div>

        <p
          v-if="selectedLora && !selectedLora.localPath"
          class="text-xs text-error"
        >
          This Resource has no localPath, so ComfyUI cannot load it. Pick
          another, or fill in its path from the Resources manager.
        </p>
      </template>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Resource } from '~/prisma/generated/prisma/client'
import { useResourceStore } from '@/stores/resourceStore'
import {
  engineProfile,
  type ArtGeneratorEngine,
} from '@/utils/artGeneratorPresets'

type PreviewArtImage = {
  imagePath?: string | null
  path?: string | null
  thumbnailPath?: string | null
}

type LoraResource = Resource & { ArtImage?: PreviewArtImage | null }

const props = withDefaults(
  defineProps<{
    /** Resource id of the selected LoRA, or null. */
    modelValue: number | null
    strength?: number
    engine: ArtGeneratorEngine
  }>(),
  { strength: 1 },
)

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  'update:strength': [value: number]
}>()

const resourceStore = useResourceStore()
const search = ref('')

const profile = computed(() => engineProfile(props.engine))
const supported = computed(() => profile.value.supports.lora)
const engineLabel = computed(() => profile.value.label)

// Mirrors compatibilityRank() in server/utils/artLoraResource.ts. Nothing is
// HIDDEN by rank -- the enqueue route only hard-blocks incompatible LoRAs on
// the video and img2img lanes -- but a LoRA the server would rank at zero gets
// a plain badge instead of a confident one.
function rankFor(resource: LoraResource): number {
  const supportedServer = String(resource.supportedServer || '')

  if (props.engine === 'krea2' || props.engine === 'flux2') {
    if (supportedServer === 'FLUX') return 30
    if (supportedServer === 'KONTEXT') return 20
    if (supportedServer === 'GENERIC') return 10
    return 0
  }

  if (props.engine === 'comfy') {
    if (supportedServer === 'SDXL') return 30
    if (supportedServer === 'COMFY') return 15
    if (supportedServer === 'GENERIC') return 10
    return 0
  }

  return 0
}

const rankedLoras = computed(() => {
  return (resourceStore.visibleLoras as LoraResource[])
    .filter((resource) => Boolean(resource.localPath?.trim()))
    .map((resource) => ({ resource, rank: rankFor(resource) }))
    .sort(
      (a, b) =>
        b.rank - a.rank ||
        loraLabel(a.resource).localeCompare(loraLabel(b.resource)),
    )
})

const visibleLoras = computed(() => {
  const needle = search.value.trim().toLowerCase()
  if (!needle) return rankedLoras.value

  return rankedLoras.value.filter(({ resource }) => {
    return [
      resource.name,
      resource.customLabel,
      resource.localPath,
      resource.triggerWords,
      resource.defaultTrigger,
    ]
      .filter((value): value is string => typeof value === 'string')
      .some((value) => value.toLowerCase().includes(needle))
  })
})

const selectedLora = computed<LoraResource | null>(() => {
  if (!props.modelValue) return null
  return (
    rankedLoras.value.find(({ resource }) => resource.id === props.modelValue)
      ?.resource ?? null
  )
})

const clampedStrength = computed(() => clampStrength(props.strength))

onMounted(async () => {
  if (!resourceStore.hasLoaded) await resourceStore.getResources()
})

// A LoRA that leaves the visible set -- the maturity toggle was turned off, or
// the account lost access -- must not stay silently attached to the next job.
watch([rankedLoras, supported], () => {
  if (!resourceStore.hasLoaded) return
  if (props.modelValue && (!supported.value || !selectedLora.value)) {
    emit('update:modelValue', null)
  }
})

function select(resourceId: number | null): void {
  emit(
    'update:modelValue',
    resourceId && props.modelValue !== resourceId ? resourceId : null,
  )
}

function clampStrength(value: unknown): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 1
  return Math.min(2, Math.max(0, parsed))
}

function onStrength(event: Event): void {
  emit(
    'update:strength',
    clampStrength((event.target as HTMLInputElement).value),
  )
}

function loraLabel(resource: LoraResource): string {
  return resource.customLabel?.trim() || resource.name
}

function triggerWords(resource: LoraResource): string {
  return (resource.defaultTrigger || resource.triggerWords || '').trim()
}

function previewImage(resource: LoraResource): string {
  const candidate = [
    resource.previewImageUrl,
    resource.imagePath,
    resource.MediaPath,
    resource.ArtImage?.thumbnailPath,
    resource.ArtImage?.imagePath,
    resource.ArtImage?.path,
  ].find((value) => typeof value === 'string' && value.trim())

  const path = String(candidate || '').trim()
  if (!path) return ''
  if (/^(https?:|data:|blob:|\/)/.test(path)) return path
  return `/${path.replace(/^\/+/, '')}`
}

function hideBrokenImage(event: Event): void {
  ;(event.target as HTMLImageElement).style.display = 'none'
}
</script>
