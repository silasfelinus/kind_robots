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
import { computed, onMounted, ref, watch } from 'vue'
import { useResourceStore, type Resource } from '~/stores/resourceStore'

const props = withDefaults(
  defineProps<{
    modelValue?: number[]
    baseFilter?: string | null
  }>(),
  { modelValue: () => [], baseFilter: null },
)

const emit = defineEmits<{
  'update:modelValue': [ids: number[]]
  change: [
    payload: {
      loraResourceIds: number[]
      loraName: string | null
      triggers: string
    },
  ]
}>()

const resourceStore = useResourceStore()
const query = ref('')

const availableLoras = computed<Resource[]>(() => {
  const base = props.baseFilter?.toLowerCase() ?? null

  return resourceStore.visibleLoras.filter((resource) =>
    base
      ? (resource.generation ?? '').toLowerCase().includes(base) ||
        (resource.supportedServer ?? '').toLowerCase().includes(base)
      : true,
  )
})

const loras = computed<Resource[]>(() => {
  const search = query.value.trim().toLowerCase()

  return availableLoras.value
    .filter((resource) =>
      search
        ? [
            resource.customLabel,
            resource.name,
            resource.generation,
            resource.triggerWords,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(search))
        : true,
    )
    .sort((a, b) =>
      (a.customLabel || a.name || '').localeCompare(
        b.customLabel || b.name || '',
      ),
    )
})

const availableLoraIds = computed(
  () => new Set(availableLoras.value.map((resource) => resource.id)),
)

const selected = computed<Resource[]>(() =>
  props.modelValue
    .map((id) => availableLoras.value.find((resource) => resource.id === id))
    .filter((resource): resource is Resource => Boolean(resource)),
)

function engineName(resource: Resource): string {
  return resource.localPath || resource.name || resource.customLabel || ''
}

function emitChange(ids: number[]): void {
  emit('update:modelValue', ids)

  const chosen = ids
    .map((id) => availableLoras.value.find((resource) => resource.id === id))
    .filter((resource): resource is Resource => Boolean(resource))
  const primary = chosen.at(0)
  const triggers = chosen
    .map((resource) => resource.defaultTrigger || resource.triggerWords || '')
    .filter(Boolean)
    .join(', ')

  emit('change', {
    loraResourceIds: ids,
    loraName: primary ? engineName(primary) : null,
    triggers,
  })
}

function toggle(resource: Resource): void {
  const ids = props.modelValue.includes(resource.id)
    ? props.modelValue.filter((id) => id !== resource.id)
    : [...props.modelValue, resource.id]

  emitChange(ids)
}

function isSelected(resource: Resource): boolean {
  return props.modelValue.includes(resource.id)
}

watch(
  [() => props.modelValue, () => resourceStore.hasLoaded, availableLoraIds],
  () => {
    if (!resourceStore.hasLoaded) return

    const visibleIds = props.modelValue.filter((id) =>
      availableLoraIds.value.has(id),
    )

    if (
      visibleIds.length !== props.modelValue.length ||
      visibleIds.some((id, index) => id !== props.modelValue[index])
    ) {
      emitChange(visibleIds)
    }
  },
  { immediate: true },
)

onMounted(async () => {
  if (!resourceStore.hasLoaded) {
    await resourceStore.getResources()
  }
})
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center gap-2">
      <span class="text-sm font-medium">LoRAs</span>
      <span v-if="selected.length" class="badge badge-sm badge-primary">
        {{ selected.length }}
      </span>
    </div>

    <maturity-toggle
      variant="resource"
      label="Mature LoRAs"
      visible-text="Mature image LoRAs are available in this selector."
      hidden-text="Mature image LoRAs are hidden from this selector."
    />

    <div v-if="selected.length" class="flex flex-wrap gap-1">
      <button
        v-for="resource in selected"
        :key="resource.id"
        type="button"
        class="badge badge-outline gap-1 rounded-xl"
        :title="resource.triggerWords || ''"
        @click="toggle(resource)"
      >
        {{ resource.customLabel || resource.name }}
        <span v-if="resource.isMature" class="text-error">·18+</span>
        ✕
      </button>
    </div>

    <input
      v-model="query"
      type="text"
      placeholder="Search LoRAs…"
      class="input input-bordered input-xs rounded-lg"
    />

    <ul
      class="menu menu-xs max-h-56 flex-nowrap overflow-y-auto rounded-lg bg-base-200 p-1"
    >
      <li v-if="!loras.length" class="disabled px-2 py-1 text-xs opacity-60">
        No matching LoRAs.
      </li>
      <li v-for="resource in loras" :key="resource.id">
        <button
          type="button"
          class="flex items-center justify-between gap-2"
          :class="{ 'bg-primary/20': isSelected(resource) }"
          @click="toggle(resource)"
        >
          <span class="truncate">
            <span :class="{ 'font-semibold': isSelected(resource) }">
              {{ resource.customLabel || resource.name }}
            </span>
            <span v-if="resource.isMature" class="ml-1 text-error">18+</span>
          </span>
          <span class="shrink-0 text-[10px] opacity-60">
            {{ resource.generation || resource.supportedServer }}
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>
