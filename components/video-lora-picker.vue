<template>
  <section class="space-y-3 rounded-lg border border-base-300 p-3">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <h2 class="font-semibold">
          LoRAs <span class="opacity-50">(optional)</span>
        </h2>
        <p class="text-xs opacity-60">
          Stack up to {{ MAX_LORAS_PER_JOB }} {{ engine.toUpperCase() }} LoRAs.
          Trigger words are added to the render prompt automatically.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-1">
        <div class="join" aria-label="LoRA browser size">
          <button
            type="button"
            class="btn btn-xs join-item"
            :class="browserSize === 'comfortable' ? 'btn-accent' : 'btn-ghost'"
            @click="browserSize = 'comfortable'"
          >
            Comfortable
          </button>
          <button
            type="button"
            class="btn btn-xs join-item"
            :class="browserSize === 'expanded' ? 'btn-accent' : 'btn-ghost'"
            @click="browserSize = 'expanded'"
          >
            Expand
          </button>
        </div>
        <button
          v-if="modelValue.length"
          type="button"
          class="btn btn-xs btn-ghost"
          @click="emitValue([])"
        >
          Clear all
        </button>
      </div>
    </div>

    <maturity-toggle
      variant="resource"
      label="Mature LoRAs"
      visible-text="Mature video LoRAs are available in this selector."
      hidden-text="Mature video LoRAs are hidden from this selector."
    />

    <ol
      v-if="selected.length"
      class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))] gap-2"
    >
      <li
        v-for="(entry, index) in selected"
        :key="entry.resourceId"
        class="rounded-xl border border-accent/40 bg-accent/5 p-3"
      >
        <div class="flex items-start gap-2">
          <span
            class="flex size-6 shrink-0 items-center justify-center rounded-lg bg-accent text-xs font-black text-accent-content"
          >
            {{ index + 1 }}
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold">
              {{ resourceLabel(entry.resource) }}
            </p>
            <p
              class="truncate text-[11px] opacity-55"
              :title="entry.resource.localPath || ''"
            >
              {{ entry.resource.localPath }}
            </p>
            <p
              v-if="triggerText(entry.resource)"
              class="mt-1 line-clamp-2 text-[11px] opacity-70"
            >
              <span class="font-semibold">Trigger:</span>
              {{ triggerText(entry.resource) }}
            </p>
          </div>
          <div class="flex shrink-0 gap-0.5">
            <button
              type="button"
              class="btn btn-ghost btn-xs btn-square"
              :disabled="index === 0"
              :aria-label="`Move ${resourceLabel(entry.resource)} earlier`"
              @click="move(index, -1)"
            >
              ↑
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-xs btn-square"
              :disabled="index === selected.length - 1"
              :aria-label="`Move ${resourceLabel(entry.resource)} later`"
              @click="move(index, 1)"
            >
              ↓
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-xs btn-square text-error"
              :aria-label="`Remove ${resourceLabel(entry.resource)}`"
              @click="remove(entry.resourceId)"
            >
              ✕
            </button>
          </div>
        </div>

        <div class="mt-3 grid grid-cols-[minmax(0,1fr)_5.5rem] items-center gap-3">
          <label class="space-y-1">
            <span class="text-xs font-semibold">
              Strength {{ entry.strength.toFixed(2) }}
            </span>
            <input
              :value="entry.strength"
              type="range"
              min="-2"
              max="2"
              step="0.05"
              class="range range-accent range-sm w-full"
              :aria-label="`${resourceLabel(entry.resource)} strength`"
              @input="setStrength(entry.resourceId, $event)"
            />
          </label>
          <input
            :value="entry.strength"
            type="number"
            min="-2"
            max="2"
            step="0.05"
            class="input input-bordered input-sm w-full"
            :aria-label="`${resourceLabel(entry.resource)} strength value`"
            @input="setStrength(entry.resourceId, $event)"
          />
        </div>
      </li>
    </ol>

    <p v-if="atCapacity" class="text-xs font-semibold text-warning">
      Maximum stack reached. Remove one LoRA to add another.
    </p>

    <div
      v-if="resourceStore.isLoading && !resourceStore.hasLoaded"
      class="flex min-h-32 items-center justify-center rounded-lg bg-base-200"
    >
      <span class="loading loading-spinner loading-sm" />
    </div>

    <div
      v-else-if="!compatibleResources.length"
      class="rounded-lg border border-dashed border-base-300 bg-base-200/50 p-5 text-center text-sm opacity-70"
    >
      No active {{ engine.toUpperCase() }} LoRA Resources are available.
    </div>

    <template v-else>
      <div class="flex flex-wrap items-center gap-2">
        <input
          v-model="search"
          type="search"
          class="input input-bordered input-sm min-w-52 flex-1"
          placeholder="Search LoRAs by name, path, or trigger word…"
        />
        <span class="text-xs opacity-55">
          {{ filteredResources.length }} compatible
        </span>
      </div>

      <div
        class="overflow-y-auto overscroll-contain pr-1 transition-[max-height]"
        :class="browserSize === 'expanded' ? 'max-h-none' : 'max-h-[38rem]'"
      >
        <div
          class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))] gap-3"
        >
          <button
            v-for="resource in filteredResources"
            :key="resource.id"
            type="button"
            class="overflow-hidden rounded-xl border text-left transition disabled:opacity-40"
            :class="
              isSelected(resource.id)
                ? 'border-accent bg-accent/10 ring-2 ring-accent/20'
                : 'border-base-300 bg-base-100 hover:border-accent/60'
            "
            :aria-pressed="isSelected(resource.id)"
            :disabled="atCapacity && !isSelected(resource.id)"
            @click="toggle(resource.id)"
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
                <span class="min-w-0 truncate font-semibold leading-tight">
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
                    v-if="isSelected(resource.id)"
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
                v-if="triggerText(resource)"
                class="line-clamp-2 text-xs opacity-70"
              >
                <span class="font-semibold">Trigger:</span>
                {{ triggerText(resource) }}
              </p>
            </div>
          </button>
        </div>
      </div>

      <p
        v-if="search.trim() && !filteredResources.length"
        class="text-center text-xs opacity-55"
      >
        No compatible LoRA matches “{{ search.trim() }}”.
      </p>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useResourceStore } from '@/stores/resourceStore'
import { MAX_LORAS_PER_JOB } from '@/utils/loraLimits'
import {
  loraTriggerTerms,
  videoLoraCompatible,
  type LoraPick,
} from '@/utils/loraSelection'
import type { VideoEngine } from '@/utils/videoPresets'
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
  modelValue: LoraPick[]
  engine: VideoEngine
}>()

const emit = defineEmits<{
  'update:modelValue': [value: LoraPick[]]
}>()

const resourceStore = useResourceStore()
const search = ref('')
const browserSize = ref<'comfortable' | 'expanded'>('comfortable')

const compatibleResources = computed<VideoLoraResource[]>(() =>
  (resourceStore.visibleLoras as VideoLoraResource[]).filter(
    (resource) =>
      Boolean(resource.localPath?.trim()) &&
      videoLoraCompatible(resource, props.engine),
  ),
)

const byId = computed(
  () =>
    new Map(
      compatibleResources.value.map((resource) => [resource.id, resource]),
    ),
)

const selected = computed(() =>
  props.modelValue
    .map((pick) => {
      const resource = byId.value.get(pick.resourceId)
      return resource ? { ...pick, resource } : null
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
)

const atCapacity = computed(() => props.modelValue.length >= MAX_LORAS_PER_JOB)

const filteredResources = computed(() => {
  const needle = search.value.trim().toLowerCase()
  if (!needle) return compatibleResources.value

  return compatibleResources.value.filter((resource) =>
    [
      resource.name,
      resource.customLabel,
      resource.localPath,
      resource.defaultTrigger,
      resource.triggerWords,
    ]
      .filter((value): value is string => typeof value === 'string')
      .some((value) => value.toLowerCase().includes(needle)),
  )
})

onMounted(async () => {
  if (!resourceStore.hasLoaded) await resourceStore.getResources()
})

// Engine/maturity/access changes prune invalid picks immediately. A WAN LoRA
// never remains silently attached when the user switches to LTX, and vice versa.
watch([() => props.engine, compatibleResources], () => {
  if (!resourceStore.hasLoaded || !props.modelValue.length) return
  const survivors = props.modelValue.filter((pick) =>
    byId.value.has(pick.resourceId),
  )
  if (survivors.length !== props.modelValue.length) emitValue(survivors)
})

function emitValue(picks: LoraPick[]): void {
  emit('update:modelValue', picks.slice(0, MAX_LORAS_PER_JOB))
}

function isSelected(resourceId: number): boolean {
  return props.modelValue.some((pick) => pick.resourceId === resourceId)
}

function toggle(resourceId: number): void {
  if (isSelected(resourceId)) {
    remove(resourceId)
    return
  }
  if (atCapacity.value) return
  emitValue([...props.modelValue, { resourceId, strength: 1 }])
}

function remove(resourceId: number): void {
  emitValue(props.modelValue.filter((pick) => pick.resourceId !== resourceId))
}

function move(index: number, offset: number): void {
  const next = [...props.modelValue]
  const target = index + offset
  if (target < 0 || target >= next.length) return
  const [moved] = next.splice(index, 1)
  if (moved) next.splice(target, 0, moved)
  emitValue(next)
}

function clampStrength(value: unknown): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 1
  return Math.min(2, Math.max(-2, parsed))
}

function setStrength(resourceId: number, event: Event): void {
  const strength = clampStrength((event.target as HTMLInputElement).value)
  emitValue(
    props.modelValue.map((pick) =>
      pick.resourceId === resourceId ? { ...pick, strength } : pick,
    ),
  )
}

function resourceLabel(resource: VideoLoraResource): string {
  return resource.customLabel?.trim() || resource.name
}

function triggerText(resource: VideoLoraResource): string {
  return loraTriggerTerms(resource).join(', ')
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

function hideBrokenImage(event: Event): void {
  ;(event.target as HTMLImageElement).style.display = 'none'
}
</script>
