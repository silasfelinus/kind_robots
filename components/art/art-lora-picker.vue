<!-- /components/art/art-lora-picker.vue -->
<template>
  <section class="space-y-3 kr-panel-flat p-3">
    <div class="flex flex-wrap items-start justify-between gap-2">
      <div class="min-w-0">
        <h3 class="flex items-center gap-2 text-sm font-bold">
          <Icon name="kind-icon:sparkles" class="size-4 text-secondary" />
          LoRAs <span class="font-normal opacity-50">(optional)</span>
        </h3>
        <p class="mt-0.5 text-xs text-base-content/55">
          Stack up to {{ MAX_LORAS_PER_JOB }} compatible LoRAs. They apply in
          order, and trigger words are added to the render prompt automatically.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-1">
        <button
          v-if="rankedLoras.length"
          type="button"
          class="btn btn-ghost btn-xs rounded-xl"
          @click="expanded = !expanded"
        >
          {{ expanded ? 'Comfortable height' : 'Expand browser' }}
        </button>
        <button
          v-if="modelValue.length"
          type="button"
          class="btn btn-ghost btn-xs rounded-xl"
          @click="emitValue([])"
        >
          Clear all
        </button>
      </div>
    </div>

    <p
      v-if="!supported"
      class="rounded-xl border border-dashed border-base-300 bg-base-200/50 p-3 text-xs text-base-content/60"
    >
      {{ engineLabel }} builds its model into the workflow and ignores LoRAs.
      Switch to a preset that supports them to use this.
    </p>

    <template v-else>
      <ol v-if="selected.length" class="space-y-2">
        <li
          v-for="(entry, index) in selected"
          :key="entry.resourceId"
          class="rounded-xl border border-secondary/40 bg-secondary/5 p-2"
        >
          <div class="flex items-start gap-2">
            <span
              class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-secondary text-[0.65rem] font-black text-secondary-content"
              :title="`Applied ${ordinal(index)}`"
            >
              {{ index + 1 }}
            </span>

            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-semibold">
                {{ loraLabel(entry.resource) }}
              </span>
              <span
                class="block truncate text-[11px] text-base-content/50"
                :title="entry.resource.localPath || ''"
              >
                {{ entry.resource.localPath }}
              </span>
              <span
                v-if="triggerWords(entry.resource)"
                class="mt-0.5 line-clamp-2 block text-[11px] text-base-content/55"
              >
                Trigger: {{ triggerWords(entry.resource) }}
              </span>
            </span>

            <span class="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                class="btn btn-ghost btn-xs btn-square"
                :disabled="index === 0"
                :aria-label="`Move ${loraLabel(entry.resource)} earlier`"
                @click="move(index, -1)"
              >
                <Icon name="kind-icon:chevron-up" class="size-3.5" />
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-xs btn-square"
                :disabled="index === selected.length - 1"
                :aria-label="`Move ${loraLabel(entry.resource)} later`"
                @click="move(index, 1)"
              >
                <Icon name="kind-icon:chevron-down" class="size-3.5" />
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-xs btn-square text-error"
                :aria-label="`Remove ${loraLabel(entry.resource)}`"
                @click="remove(entry.resourceId)"
              >
                <Icon name="kind-icon:close" class="size-3.5" />
              </button>
            </span>
          </div>

          <div class="mt-1.5 flex flex-wrap items-center gap-2 pl-7">
            <span class="text-[11px] font-bold text-base-content/60">
              Strength
            </span>
            <input
              :value="entry.strength"
              type="range"
              min="0"
              max="2"
              step="0.05"
              class="range range-secondary range-xs min-w-32 flex-1"
              :aria-label="`${loraLabel(entry.resource)} strength`"
              @input="setStrength(entry.resourceId, $event)"
            />
            <input
              :value="entry.strength"
              type="number"
              min="0"
              max="2"
              step="0.05"
              class="input input-bordered input-xs w-20 rounded-lg"
              :aria-label="`${loraLabel(entry.resource)} strength value`"
              @input="setStrength(entry.resourceId, $event)"
            />
          </div>
        </li>
      </ol>

      <p v-if="atCapacity" class="text-xs font-semibold text-warning">
        That is the maximum of {{ MAX_LORAS_PER_JOB }}. Remove one to add
        another.
      </p>

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
        No compatible LoRA Resources are available for {{ compatibilityLabel }}.
        Switch the model/checkpoint, add a compatible Resource, or enable mature
        content if the one you expect is flagged 18+.
      </p>

      <template v-else>
        <input
          v-model="search"
          type="search"
          class="input input-bordered input-sm w-full rounded-xl bg-base-200"
          placeholder="Search compatible LoRAs by name, path, or trigger word…"
        />

        <div
          class="overflow-y-auto overscroll-contain pr-1"
          :class="expanded ? 'max-h-none' : 'max-h-[32rem]'"
        >
          <div
            class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-2"
          >
            <button
              v-for="entry in visibleLoras"
              :key="entry.resource.id"
              type="button"
              class="flex gap-2 overflow-hidden rounded-xl border p-2 text-left transition disabled:opacity-40"
              :class="
                isSelected(entry.resource.id)
                  ? 'border-secondary bg-secondary/10'
                  : 'border-base-300 bg-base-100 hover:border-secondary/60'
              "
              :aria-pressed="isSelected(entry.resource.id)"
              :disabled="atCapacity && !isSelected(entry.resource.id)"
              @click="toggle(entry.resource.id)"
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

                <span class="badge badge-secondary badge-xs rounded-lg">
                  {{ entry.resource.supportedServer }}
                </span>

                <span
                  v-if="triggerWords(entry.resource)"
                  class="line-clamp-2 block text-[11px] text-base-content/55"
                >
                  Trigger: {{ triggerWords(entry.resource) }}
                </span>
              </span>
            </button>
          </div>
        </div>

        <p
          v-if="search.trim() && !visibleLoras.length"
          class="text-xs text-base-content/50"
        >
          No compatible LoRA matches “{{ search.trim() }}”.
        </p>
      </template>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Resource } from '~/prisma/generated/prisma/client'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useResourceStore } from '@/stores/resourceStore'
import {
  CHECKPOINT_FAMILY_LABELS,
  detectCheckpointFamily,
  engineProfile,
  type ArtGeneratorEngine,
  type CheckpointFamily,
} from '@/utils/artGeneratorPresets'
import { MAX_LORAS_PER_JOB } from '@/utils/loraLimits'
import {
  artLoraCompatibilityRank,
  loraTriggerTerms,
  type LoraPick,
} from '@/utils/loraSelection'

type PreviewArtImage = {
  imagePath?: string | null
  path?: string | null
  thumbnailPath?: string | null
}

type LoraResource = Resource & { ArtImage?: PreviewArtImage | null }

export type { LoraPick }

const props = defineProps<{
  modelValue: LoraPick[]
  engine: ArtGeneratorEngine
  checkpointFamily?: CheckpointFamily
}>()

const emit = defineEmits<{
  'update:modelValue': [value: LoraPick[]]
}>()

const resourceStore = useResourceStore()
const checkpointStore = useCheckpointStore()
const search = ref('')
const expanded = ref(false)

const profile = computed(() => engineProfile(props.engine))
const supported = computed(() => profile.value.supports.lora)
const engineLabel = computed(() => profile.value.label)
const atCapacity = computed(() => props.modelValue.length >= MAX_LORAS_PER_JOB)
const effectiveCheckpointFamily = computed<CheckpointFamily>(() =>
  props.checkpointFamily ?? detectCheckpointFamily(checkpointStore.selectedCheckpoint),
)
const compatibilityLabel = computed(() => {
  if (props.engine !== 'comfy') return engineLabel.value
  return `${CHECKPOINT_FAMILY_LABELS[effectiveCheckpointFamily.value]} checkpoint`
})

const rankedLoras = computed(() => {
  if (!supported.value) return []

  return (resourceStore.visibleLoras as LoraResource[])
    .filter((resource) => Boolean(resource.localPath?.trim()))
    .map((resource) => ({
      resource,
      rank: artLoraCompatibilityRank(
        resource,
        props.engine,
        effectiveCheckpointFamily.value,
      ),
    }))
    .filter((entry) => entry.rank > 0)
    .sort(
      (a, b) =>
        b.rank - a.rank ||
        loraLabel(a.resource).localeCompare(loraLabel(b.resource)),
    )
})

const byId = computed(
  () =>
    new Map(rankedLoras.value.map(({ resource }) => [resource.id, resource])),
)

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

const selected = computed(() => {
  return props.modelValue
    .map((pick) => {
      const resource = byId.value.get(pick.resourceId)
      return resource
        ? { resourceId: pick.resourceId, strength: pick.strength, resource }
        : null
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
})

onMounted(async () => {
  if (!resourceStore.hasLoaded) await resourceStore.getResources()
})

watch(
  [rankedLoras, supported, effectiveCheckpointFamily, () => props.engine],
  () => {
    if (!resourceStore.hasLoaded || !props.modelValue.length) return

    if (!supported.value) {
      emitValue([])
      return
    }

    const survivors = props.modelValue.filter((pick) =>
      byId.value.has(pick.resourceId),
    )
    if (survivors.length !== props.modelValue.length) emitValue(survivors)
  },
)

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

function setStrength(resourceId: number, event: Event): void {
  const raw = Number((event.target as HTMLInputElement).value)
  const strength = Number.isFinite(raw) ? Math.min(2, Math.max(0, raw)) : 1
  emitValue(
    props.modelValue.map((pick) =>
      pick.resourceId === resourceId ? { ...pick, strength } : pick,
    ),
  )
}

function ordinal(index: number): string {
  return (
    ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'][index] ?? 'next'
  )
}

function loraLabel(resource: LoraResource): string {
  return resource.customLabel?.trim() || resource.name
}

function triggerWords(resource: LoraResource): string {
  return loraTriggerTerms(resource).join(', ')
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
