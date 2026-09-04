<!-- components/ruler-hooked/ruler-hooked-cosmetics-picker.vue
     Shared ruler-appearance picker (ruler-hooked/t-021): a grid of the twelve
     preset rulers (t-020's approved cast) plus a "use my own picture instead"
     file input. Used both at new-game creation (ruler-hooked-slots.vue) and
     from the in-play "change appearance" panel (ruler-hooked-cosmetics.vue) —
     cosmetics are cosmetic-only by design, so nothing here is locked to
     creation time. Presets are read entirely from RULER_PRESETS data; no id
     is ever hardcoded in the template (t-021: "read the list as data"). -->
<template>
  <div class="flex flex-col gap-3">
    <div class="grid grid-cols-[repeat(auto-fit,minmax(4.5rem,1fr))] gap-2">
      <button
        v-for="preset in presets"
        :key="preset.id"
        type="button"
        class="group flex flex-col items-center gap-1 rounded-lg border p-1.5 text-center transition-colors"
        :class="
          !customFile && modelValue === preset.id
            ? 'border-primary bg-primary/10'
            : 'border-base-300 hover:border-primary/50'
        "
        :title="preset.look"
        :aria-pressed="!customFile && modelValue === preset.id"
        @click="selectPreset(preset.id)"
      >
        <img
          v-if="!brokenPresets[preset.id]"
          :src="`/images/ruler-hooked/ruler-${preset.id}.webp`"
          :alt="`${preset.title} ${preset.id}`"
          class="aspect-square w-full rounded-md bg-base-200 object-cover"
          loading="lazy"
          @error="onPresetImgError(preset.id)"
        />
        <div
          v-else
          class="flex aspect-square w-full items-center justify-center rounded-md bg-base-200 text-lg font-bold opacity-50"
        >
          {{ preset.title.charAt(0) }}
        </div>
        <span class="line-clamp-1 text-[10px] font-medium opacity-80">{{
          preset.title
        }}</span>
      </button>
    </div>

    <div
      class="flex flex-wrap items-center gap-2 border-t border-base-300 pt-2"
    >
      <label class="kr-btn-outline-xs">
        Use my own picture instead
        <input
          type="file"
          accept="image/*"
          class="hidden"
          @change="onFilePicked"
        />
      </label>
      <span
        v-if="customFile"
        class="flex items-center gap-1 text-xs opacity-70"
      >
        <img
          v-if="customPreviewUrl"
          :src="customPreviewUrl"
          alt="Custom portrait preview"
          class="size-8 rounded object-cover"
        />
        {{ customFile.name }}
        <button type="button" class="kr-btn-ghost-xs-plain" @click="clearCustom">
          clear
        </button>
      </span>
      <span v-else class="text-xs opacity-50"
        >Stored on this device only — never uploaded.</span
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { RULER_PRESETS } from '~/utils/rulerHooked/rulerPresets'

defineProps<{
  /** Selected preset id — ignored for display purposes while a custom file is staged. */
  modelValue: string
}>()
const emit = defineEmits<{
  'update:modelValue': [id: string]
  /** A new custom-portrait file was picked (or cleared, with null). */
  'custom-file': [file: File | null]
}>()

const presets = RULER_PRESETS
const customFile = ref<File | null>(null)
const customPreviewUrl = ref<string | null>(null)

// A preset's own dedicated layer may not be rendered yet (t-021/t-020); a
// broken preview thumbnail just hides the <img> rather than showing a
// browser broken-image icon — the picker still works by title/tooltip.
const brokenPresets = reactive<Record<string, boolean>>({})
function onPresetImgError(id: string) {
  brokenPresets[id] = true
}

function selectPreset(id: string) {
  clearCustom()
  emit('update:modelValue', id)
}

function onFilePicked(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (customPreviewUrl.value) URL.revokeObjectURL(customPreviewUrl.value)
  customFile.value = file
  customPreviewUrl.value = URL.createObjectURL(file)
  emit('custom-file', file)
}

function clearCustom() {
  if (customPreviewUrl.value) URL.revokeObjectURL(customPreviewUrl.value)
  customFile.value = null
  customPreviewUrl.value = null
  emit('custom-file', null)
}

onBeforeUnmount(() => {
  if (customPreviewUrl.value) URL.revokeObjectURL(customPreviewUrl.value)
})
</script>
