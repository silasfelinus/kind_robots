<template>
  <details class="rounded-2xl border border-base-300 bg-base-100/70">
    <summary class="cursor-pointer px-3 py-2.5 font-semibold">
      Video checkpoint
      <span class="ml-2 text-xs font-normal opacity-60">{{ selectedLabel }}</span>
    </summary>
    <div class="space-y-3 border-t border-base-300 p-3">
      <p class="kr-text-faded-xs">
        Choose models cataloged for this video architecture. A model's maturity
        label describes its catalog metadata, not a guaranteed content filter.
      </p>

      <label v-if="engine === 'wan'" class="block space-y-1">
        <span class="kr-text-semibold-sm">WAN architecture</span>
        <select
          class="select select-bordered select-sm w-full"
          :value="mode"
          :disabled="hasEndFrame"
          @change="emit('update:mode', ($event.target as HTMLSelectElement).value as WanVideoMode)"
        >
          <option value="ti2v">WAN 2.2 5B · faster, single model</option>
          <option value="a14b">WAN 2.2 14B · high + low noise (slower)</option>
        </select>
        <span v-if="hasEndFrame" class="kr-text-faded-xs">
          End-frame morphing requires the 14B pair.
        </span>
      </label>

      <label class="block space-y-1">
        <span class="kr-text-semibold-sm">{{ firstTitle }}</span>
        <select
          class="select select-bordered select-sm w-full"
          :value="firstModelId ?? ''"
          @change="emit('update:firstModelId', selectedId($event))"
        >
          <option value="">Studio default (general-purpose, not safety-verified)</option>
          <option v-for="resource in firstOptions" :key="resource.id" :value="resource.id">
            {{ resource.customLabel || resource.name }} · {{ maturityLabel(resource) }}
          </option>
        </select>
      </label>
      <label v-if="engine === 'wan' && mode === 'a14b'" class="block space-y-1">
        <span class="kr-text-semibold-sm">Low-noise partner</span>
        <select
          class="select select-bordered select-sm w-full"
          :value="lowModelId ?? ''"
          @change="emit('update:lowModelId', selectedId($event))"
        >
          <option value="">Studio default low-noise expert</option>
          <option v-for="resource in lowOptions" :key="resource.id" :value="resource.id">
            {{ resource.customLabel || resource.name }} · {{ maturityLabel(resource) }}
          </option>
        </select>
        <span v-if="(firstModelId == null) !== (lowModelId == null)" class="text-xs text-warning">
          Custom WAN 14B renders need both high- and low-noise models selected.
        </span>
      </label>

      <div v-if="chosen.length" class="grid gap-2 sm:grid-cols-2">
        <div v-for="resource in chosen" :key="resource.id"
          class="flex items-center gap-2 rounded-xl border border-base-300 p-2">
          <img v-if="resource.previewImageUrl" :src="resource.previewImageUrl"
            :alt="resource.customLabel || resource.name"
            class="size-14 shrink-0 rounded-lg object-cover" loading="lazy" />
          <div class="min-w-0">
            <div class="truncate text-xs font-semibold">{{ resource.customLabel || resource.name }}</div>
            <div class="kr-text-faded-xs">{{ maturityLabel(resource) }}</div>
            <div class="truncate text-[11px] opacity-50">{{ resource.localPath }}</div>
          </div>
        </div>
      </div>
      <p v-if="!firstOptions.length" class="kr-text-faded-xs">
        No alternative {{ firstTitle.toLowerCase() }} models in the accessible catalog.
        The studio default remains available.
      </p>
      <p class="kr-text-faded-xs">
        Catalog entries marked Unreviewed are not certified SFW. Curators can add
        [maturity:general], [maturity:mature-capable], or [maturity:adult-focused]
        to a Resource's description after reviewing its intended use.
      </p>
    </div>
  </details>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useResourceStore } from '@/stores/resourceStore'
import { useUserStore } from '@/stores/userStore'
import {
  videoModelMaturity,
  videoModelSlot,
  type WanVideoMode,
  type VideoModelSlot,
} from '@/utils/videoModelResources'
import type { VideoEngine } from '@/utils/videoPresets'
import type { Resource } from '~/prisma/generated/prisma/client'

const props = defineProps<{
  engine: VideoEngine
  mode: WanVideoMode
  hasEndFrame: boolean
  firstModelId: number | null
  lowModelId: number | null
}>()
const emit = defineEmits<{
  'update:mode': [mode: WanVideoMode]
  'update:firstModelId': [id: number | null]
  'update:lowModelId': [id: number | null]
}>()

const resourceStore = useResourceStore()
const userStore = useUserStore()
const firstSlot = computed<VideoModelSlot>(() =>
  props.engine === 'ltx'
    ? 'ltx'
    : props.mode === 'a14b'
      ? 'wan-high'
      : 'wan-ti2v',
)
const firstTitle = computed(() =>
  props.engine === 'ltx' ? 'LTX checkpoint' :
  props.mode === 'a14b' ? 'High-noise expert' : 'WAN 5B model',
)
function options(slot: VideoModelSlot): Resource[] {
  return resourceStore.resources.filter((resource) =>
    videoModelSlot(resource) === slot &&
    (userStore.showMature || !resource.isMature),
  )
}
const firstOptions = computed(() => options(firstSlot.value))
const lowOptions = computed(() => options('wan-low'))
const chosen = computed(() =>
  resourceStore.resources.filter((resource) =>
    resource.id === props.firstModelId || resource.id === props.lowModelId,
  ),
)
const selectedLabel = computed(() =>
  chosen.value.length
    ? chosen.value.map((resource) => resource.customLabel || resource.name).join(' + ')
    : 'Studio default',
)
function maturityLabel(resource: Resource): string {
  const value = videoModelMaturity(resource)
  return value === 'adult-focused' ? 'Adult-focused' :
    value === 'mature-capable' ? 'Mature-capable' :
    value === 'general' ? 'General (catalog reviewed)' : 'Unreviewed'
}
function selectedId(event: Event): number | null {
  const value = Number((event.target as HTMLSelectElement).value)
  return Number.isInteger(value) && value > 0 ? value : null
}
watch([firstSlot, firstOptions], () => {
  if (props.firstModelId !== null &&
      !firstOptions.value.some((resource) => resource.id === props.firstModelId)) {
    emit('update:firstModelId', null)
  }
})
watch(lowOptions, () => {
  if (props.lowModelId !== null &&
      !lowOptions.value.some((resource) => resource.id === props.lowModelId)) {
    emit('update:lowModelId', null)
  }
})
onMounted(async () => {
  if (!resourceStore.hasLoaded) await resourceStore.getResources()
})
</script>
