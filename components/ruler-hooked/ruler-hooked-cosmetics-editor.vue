<!-- components/ruler-hooked/ruler-hooked-cosmetics-editor.vue
     The ruler's name, honorific, and portrait preset -- all cosmetic-only, so
     this one form covers both "new reign" (no `save` prop) and "edit this
     reign" (ruler-hooked/t-021: presets and honorific are not locked at
     creation). Presets/suggestions are read as data from rulerPresets.ts, never
     hardcoded here. -->
<template>
  <div class="flex flex-wrap items-end gap-2">
    <label class="form-control">
      <span class="label-text text-xs">Ruler name</span>
      <input
        v-model="name"
        type="text"
        placeholder="Mo"
        class="input input-bordered input-sm w-28"
      />
    </label>
    <label class="form-control">
      <span class="label-text text-xs">Title</span>
      <input
        v-model="honorific"
        type="text"
        :list="honorificListId"
        placeholder="Ruler"
        class="input input-bordered input-sm w-32"
      />
    </label>
    <label class="form-control">
      <span class="label-text text-xs">Portrait</span>
      <select v-model="presetId" class="select select-bordered select-sm">
        <option
          v-for="preset in RULER_PRESETS"
          :key="preset.id"
          :value="preset.id"
        >
          {{ preset.title }} — {{ preset.id }}
        </option>
      </select>
    </label>
    <button
      type="button"
      class="btn btn-primary btn-sm"
      :disabled="!name.trim()"
      @click="submit"
    >
      {{ submitLabel ?? 'Save' }}
    </button>
  </div>
  <datalist :id="honorificListId">
    <option
      v-for="title in HONORIFIC_SUGGESTIONS"
      :key="title"
      :value="title"
    />
  </datalist>
</template>

<script setup lang="ts">
import {
  RULER_PRESETS,
  HONORIFIC_SUGGESTIONS,
  DEFAULT_RULER_PRESET_ID,
} from '~/utils/rulerHooked/rulerPresets'
import type { RunSave } from '~/types/ruler-hooked'

const props = defineProps<{
  /** Omit (or pass null) for the "new reign" case -- fields start blank/default. */
  save?: RunSave | null
  submitLabel?: string
}>()
const emit = defineEmits<{
  submit: [{ name: string; honorific: string; presetId: string }]
}>()

const honorificListId = `ruler-honorific-suggestions-${useId()}`

// "New reign" (no `save`) keeps the PoC's original ready-to-go defaults so the
// button isn't disabled on first render; editing an existing reign always shows
// its real values.
const name = ref(props.save?.ruler.name ?? 'Mo')
const honorific = ref(props.save?.ruler.honorific ?? 'Queen')
const presetId = ref(
  props.save?.ruler.cosmetics?.presetId ?? DEFAULT_RULER_PRESET_ID,
)

function submit() {
  if (!name.value.trim()) return
  emit('submit', {
    name: name.value.trim(),
    honorific: honorific.value.trim() || 'Ruler',
    presetId: presetId.value,
  })
}
</script>
