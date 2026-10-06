<!-- /components/music-video/music-video-lora-picker.vue -->
<template>
  <div class="flex flex-wrap items-center gap-1">
    <span
      v-for="id in modelValue"
      :key="id"
      class="kr-badge-outline inline-flex items-center gap-1"
    >
      {{ loraName(id) }}
      <button
        type="button"
        class="kr-btn kr-btn-xs"
        :aria-label="`Remove ${loraName(id)}`"
        @click="remove(id)"
      >
        ×
      </button>
    </span>
    <select
      v-if="modelValue.length < max"
      class="kr-input w-auto min-w-0 flex-1 text-sm"
      :aria-label="label"
      :value="''"
      @focus="load"
      @change="onPick"
    >
      <option value="">
        {{ resourceStore.isLoading ? 'Loading…' : label }}
      </option>
      <option v-for="lora in choices" :key="lora.id" :value="lora.id">
        {{ lora.name }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
// music-video/t-032. Silas, 2026-10-06: "optionally add a lora to a specific
// image, or globally." Used for settings.loraResourceIds and per scene.
import { computed, onMounted } from 'vue'
import { useResourceStore } from '@/stores/resourceStore'

const props = withDefaults(
  defineProps<{ modelValue: number[]; max?: number; label?: string }>(),
  { max: 8, label: 'Add a LoRA' },
)
const emit = defineEmits<{ 'update:modelValue': [ids: number[]] }>()
const resourceStore = useResourceStore()

const choices = computed(() =>
  resourceStore.visibleLoras.filter(
    (lora) => !props.modelValue.includes(lora.id),
  ),
)

function loraName(id: number): string {
  return (
    resourceStore.resources.find((resource) => resource.id === id)?.name ??
    `LoRA #${id}`
  )
}

function load() {
  void resourceStore.getResources()
}

function onPick(event: Event) {
  const select = event.target as HTMLSelectElement
  const id = Number(select.value)
  select.value = ''
  if (!Number.isInteger(id) || id <= 0) return
  emit('update:modelValue', [...props.modelValue, id].slice(0, props.max))
}

function remove(id: number) {
  emit(
    'update:modelValue',
    props.modelValue.filter((value) => value !== id),
  )
}

// Names for LoRAs already chosen need the list even before the select opens.
onMounted(() => {
  if (props.modelValue.length) load()
})
</script>
