<!--
  components/art/lora-picker.vue

  A searchable, mature-aware multi-select for LoRA Resources. Drop it into any
  art surface; it reads Resources from the resourceStore (resourceType LORA /
  LYCORIS), respects the viewer's showMature consent, and reports the selection
  back so the parent can drive both generation and provenance:

    <LoraPicker v-model="loraResourceIds" @change="onLoraChange" />

  On change it emits { loraResourceIds, loraName, triggers } where:
    - loraResourceIds : ids to send as GenerateArtData.loraResourceIds (provenance)
    - loraName        : the primary LoRA's engine name (GenerateArtData.loraName;
                        current engines take a single LoRA, so it's the first pick)
    - triggers        : the selected LoRAs' defaultTrigger/triggerWords, joined,
                        for the parent to append to the prompt if desired.
-->
<script setup lang="ts">
import type { Resource } from '~/stores/resourceStore'

const props = withDefaults(
  defineProps<{
    modelValue?: number[]
    // Optional base-model filter, e.g. 'Pony' | 'SDXL' | 'Flux' — matches the
    // Resource.generation / supportedServer so a picker can be scoped to the
    // checkpoint the user is rendering with.
    baseFilter?: string | null
  }>(),
  { modelValue: () => [], baseFilter: null },
)

const emit = defineEmits<{
  'update:modelValue': [ids: number[]]
  change: [payload: { loraResourceIds: number[]; loraName: string | null; triggers: string }]
}>()

const resourceStore = useResourceStore()
const artStore = useArtStore()

const query = ref('')

const loras = computed<Resource[]>(() => {
  const q = query.value.trim().toLowerCase()
  const base = props.baseFilter?.toLowerCase() ?? null
  return resourceStore.resources
    .filter((r) => r.resourceType === 'LORA' || r.resourceType === 'LYCORIS')
    .filter((r) => (r.isMature ? artStore.showMature : true))
    .filter((r) =>
      base
        ? (r.generation ?? '').toLowerCase().includes(base) ||
          (r.supportedServer ?? '').toLowerCase().includes(base)
        : true,
    )
    .filter((r) =>
      q
        ? [r.customLabel, r.name, r.generation, r.triggerWords]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q))
        : true,
    )
    .sort((a, b) =>
      (a.customLabel || a.name || '').localeCompare(b.customLabel || b.name || ''),
    )
})

const selected = computed<Resource[]>(() =>
  props.modelValue
    .map((id) => resourceStore.resources.find((r) => r.id === id))
    .filter((r): r is Resource => Boolean(r)),
)

function engineName(r: Resource): string {
  return r.localPath || r.name || r.customLabel || ''
}

function emitChange(ids: number[]) {
  emit('update:modelValue', ids)
  const chosen = ids
    .map((id) => resourceStore.resources.find((r) => r.id === id))
    .filter((r): r is Resource => Boolean(r))
  const triggers = chosen
    .map((r) => r.defaultTrigger || r.triggerWords || '')
    .filter(Boolean)
    .join(', ')
  emit('change', {
    loraResourceIds: ids,
    loraName: chosen.length ? engineName(chosen[0]) : null,
    triggers,
  })
}

function toggle(r: Resource) {
  const ids = props.modelValue.includes(r.id)
    ? props.modelValue.filter((id) => id !== r.id)
    : [...props.modelValue, r.id]
  emitChange(ids)
}

function isSelected(r: Resource): boolean {
  return props.modelValue.includes(r.id)
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center gap-2">
      <span class="text-sm font-medium">LoRAs</span>
      <span v-if="selected.length" class="badge badge-sm badge-primary">{{ selected.length }}</span>
    </div>

    <!-- selected chips -->
    <div v-if="selected.length" class="flex flex-wrap gap-1">
      <button
        v-for="r in selected"
        :key="r.id"
        type="button"
        class="badge badge-outline gap-1 rounded-xl"
        :title="r.triggerWords || ''"
        @click="toggle(r)"
      >
        {{ r.customLabel || r.name }}
        <span v-if="r.isMature" class="text-error">·18+</span>
        ✕
      </button>
    </div>

    <input
      v-model="query"
      type="text"
      placeholder="Search LoRAs…"
      class="input input-bordered input-xs rounded-lg"
    />

    <!-- results -->
    <ul class="menu menu-xs max-h-56 flex-nowrap overflow-y-auto rounded-lg bg-base-200 p-1">
      <li v-if="!loras.length" class="disabled px-2 py-1 text-xs opacity-60">
        No matching LoRAs.
      </li>
      <li v-for="r in loras" :key="r.id">
        <button
          type="button"
          class="flex items-center justify-between gap-2"
          :class="{ 'bg-primary/20': isSelected(r) }"
          @click="toggle(r)"
        >
          <span class="truncate">
            <span :class="{ 'font-semibold': isSelected(r) }">{{ r.customLabel || r.name }}</span>
            <span v-if="r.isMature" class="ml-1 text-error">18+</span>
          </span>
          <span class="shrink-0 text-[10px] opacity-60">{{ r.generation || r.supportedServer }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>
