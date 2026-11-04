<!-- /components/coloring/coloring-book-render-settings.vue -->
<!-- Engine / checkpoint / LoRA for a page's next color render. Settings stick to
     the page in Conductor until changed (Silas, 2026-11-04 PT: "change the
     checkpoint or select a coloring book lora"). -->
<template>
  <div class="space-y-2">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <span class="kr-text-black-xs">Render with</span>
      <span class="kr-text-dim-xs-55">{{ currentSummary }}</span>
    </div>

    <div v-if="!options" class="kr-text-dim-xs-55">
      <span class="kr-spinner-xs" /> Loading engines and models...
    </div>
    <div v-else class="grid grid-cols-1 gap-2 @md:grid-cols-2">
      <label class="kr-form-field">
        <span class="kr-text-dim-xs-55 font-bold">Engine</span>
        <select
          class="kr-select-sm"
          :value="model.engine"
          @change="setEngine(eventValue($event))"
        >
          <option
            v-for="engine in options.engines"
            :key="engine.value"
            :value="engine.value"
          >
            {{ engine.label }}
          </option>
        </select>
      </label>

      <label v-if="model.engine === 'sdxl-checkpoint'" class="kr-form-field">
        <span class="kr-text-dim-xs-55 font-bold">Checkpoint</span>
        <select
          class="kr-select-sm"
          :value="model.checkpointId ?? ''"
          @change="update({ checkpointId: idValue($event) })"
        >
          <option value="">Pick a checkpoint...</option>
          <option
            v-for="checkpoint in options.checkpoints"
            :key="checkpoint.id"
            :value="checkpoint.id"
          >
            {{ checkpoint.label
            }}{{ checkpoint.generation ? ` · ${checkpoint.generation}` : '' }}
          </option>
        </select>
      </label>

      <label class="kr-form-field">
        <span class="kr-text-dim-xs-55 font-bold">LoRA</span>
        <select
          class="kr-select-sm"
          :value="model.loraId ?? ''"
          @change="update({ loraId: idValue($event) })"
        >
          <option value="">None</option>
          <option v-for="lora in loras" :key="lora.id" :value="lora.id">
            {{ lora.label }}{{ lora.generation ? ` · ${lora.generation}` : '' }}
          </option>
        </select>
      </label>

      <label v-if="model.loraId" class="kr-form-field">
        <span class="kr-text-dim-xs-55 font-bold">
          LoRA strength · {{ (model.loraStrength ?? 1).toFixed(2) }}
        </span>
        <input
          type="range"
          min="0"
          max="2"
          step="0.05"
          class="range range-xs"
          :value="model.loraStrength ?? 1"
          @input="update({ loraStrength: Number(eventValue($event)) })"
        />
      </label>
    </div>
    <p v-if="hint" class="kr-text-dim-xs-55">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {
  ColoringBookRenderEngine,
  ColoringBookRenderOptions,
  ColoringBookRenderSettings,
  ColoringBookRenderSettingsRequest,
} from '~/types/coloringBookStudio'

const props = defineProps<{
  options: ColoringBookRenderOptions | null
  current: ColoringBookRenderSettings
}>()

const model = defineModel<ColoringBookRenderSettingsRequest>({
  required: true,
})

const loras = computed(() =>
  (props.options?.loras ?? []).filter((lora) =>
    lora.engines.includes(model.value.engine),
  ),
)

const hint = computed(
  () =>
    props.options?.engines.find((engine) => engine.value === model.value.engine)
      ?.hint ?? '',
)

const currentSummary = computed(() => {
  const parts = [props.current.engine || 'krea2']
  if (props.current.checkpoint) {
    parts.push(props.current.checkpoint.split('/').pop() || '')
  }
  if (props.current.lora) {
    parts.push(
      `LoRA ${props.current.lora.split('/').pop()} @ ${props.current.loraStrength ?? 1}`,
    )
  }
  return `Last used: ${parts.join(' · ')}`
})

function eventValue(event: Event): string {
  return (event.target as HTMLInputElement | HTMLSelectElement).value
}

function idValue(event: Event): number | null {
  const id = Number(eventValue(event))
  return Number.isInteger(id) && id > 0 ? id : null
}

function update(patch: Partial<ColoringBookRenderSettingsRequest>): void {
  model.value = { ...model.value, ...patch }
}

function setEngine(value: string): void {
  const engine = value as ColoringBookRenderEngine
  const keepLora = (props.options?.loras ?? []).some(
    (lora) => lora.id === model.value.loraId && lora.engines.includes(engine),
  )
  update({
    engine,
    checkpointId:
      engine === 'sdxl-checkpoint' ? model.value.checkpointId : null,
    loraId: keepLora ? model.value.loraId : null,
  })
}
</script>
