<!-- Opening ceremony only: the avatar never appears in subsequent gameplay art. -->
<template>
  <div class="flex min-h-0 flex-col gap-3">
    <div class="relative mx-auto flex w-full max-w-[22rem] flex-1 items-center justify-center overflow-hidden rounded-2xl border border-amber-200/40 bg-slate-950/80 shadow-[0_18px_48px_rgba(0,0,0,0.4)]">
      <img
        v-if="customPreviewUrl"
        :src="customPreviewUrl"
        alt="Your chosen ruler portrait"
        class="aspect-[3/4] max-h-[31dvh] w-full object-contain"
      />
      <img
        v-else-if="!brokenPresets[chosen.id]"
        :key="chosen.id"
        :src="`/images/ruler-hooked/ruler-${chosen.id}.webp`"
        :alt="`${chosen.title} appearance preview`"
        class="aspect-[3/4] max-h-[31dvh] w-full object-contain"
        @error="brokenPresets[chosen.id] = true"
      />
      <div
        v-else
        class="flex aspect-[3/4] min-h-36 w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-amber-900/30 to-slate-950 px-4 text-center"
        role="img"
        :aria-label="`${chosen.title} portrait not yet available`"
      >
        <Icon name="kind-icon:crown" class="size-16 text-amber-300" />
        <span class="font-serif text-xl text-amber-100">{{ chosen.title }}</span>
        <span class="max-w-52 text-xs text-amber-100/70">Portrait illustration awaiting delivery</span>
      </div>
      <div class="pointer-events-none absolute inset-1 rounded-xl border border-amber-300/30" />
    </div>

    <div class="flex items-center justify-between gap-2">
      <button
        type="button"
        class="flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-amber-200/40 bg-slate-950/65 text-amber-100 hover:bg-amber-200/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
        aria-label="Previous ruler portrait"
        @click="shift(-1)"
      >
        <Icon name="kind-icon:chevron-left" class="kr-icon-5" />
      </button>
      <div class="min-w-0 flex-1 text-center">
        <p class="font-serif text-xl font-semibold text-amber-100">{{ chosen.title }}</p>
        <p class="text-xs text-amber-100/65">{{ selectedIndex + 1 }} of {{ presets.length }} portraits</p>
      </div>
      <button
        type="button"
        class="flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-amber-200/40 bg-slate-950/65 text-amber-100 hover:bg-amber-200/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
        aria-label="Next ruler portrait"
        @click="shift(1)"
      >
        <Icon name="kind-icon:chevron-right" class="kr-icon-5" />
      </button>
    </div>

    <div
      class="flex snap-x gap-2 overflow-x-auto pb-1"
      role="group"
      aria-label="Choose ruler portrait"
    >
      <button
        v-for="preset in presets"
        :key="preset.id"
        type="button"
        class="relative flex min-w-16 snap-start flex-col items-center gap-1 rounded-xl border p-1 transition-colors"
        :class="!customFile && preset.id === modelValue
          ? 'border-amber-300 bg-amber-200/25 ring-2 ring-amber-300/40'
          : 'border-amber-200/20 bg-slate-950/55 hover:border-amber-200/70'"
        :aria-pressed="!customFile && preset.id === modelValue"
        :aria-label="`Select ${preset.title}: ${preset.look}`"
        @click="selectPreset(preset.id)"
      >
        <img
          v-if="!brokenPresets[preset.id]"
          :src="`/images/ruler-hooked/ruler-${preset.id}.webp`"
          alt=""
          class="size-14 rounded-lg object-cover"
          loading="lazy"
          @error="brokenPresets[preset.id] = true"
        />
        <Icon v-else name="kind-icon:crown" class="size-14 rounded-lg bg-slate-900 p-3 text-amber-100/70" />
        <span class="max-w-16 truncate text-[10px] text-amber-100">{{ preset.title }}</span>
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="min-h-11 flex-1 rounded-xl border border-amber-200/50 bg-amber-200/10 px-4 text-sm font-semibold text-amber-100 hover:bg-amber-200/20"
        @click="filePicker?.click()"
      >
        <Icon name="kind-icon:image" class="mr-2 inline-block kr-icon-4" />
        Use your own portrait
      </button>
      <input ref="filePicker" type="file" accept="image/*" class="sr-only" aria-label="Upload ruler portrait" @change="onFilePicked" />
      <button
        v-if="customFile"
        type="button"
        class="min-h-11 rounded-xl border border-amber-200/30 px-3 text-sm text-amber-100"
        @click="clearCustom"
      >
        Clear photo
      </button>
      <p class="w-full text-center text-[11px] text-amber-100/60">
        The portrait is for the opening only. Personal uploads stay on this device.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RULER_PRESETS } from '~/utils/rulerHooked/rulerPresets'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{
  'update:modelValue': [id: string]
  'custom-file': [file: File | null]
}>()
const presets = RULER_PRESETS
const selectedIndex = computed(() => Math.max(0, presets.findIndex((preset) => preset.id === props.modelValue)))
const chosen = computed(() => presets[selectedIndex.value]!)
const brokenPresets = reactive<Record<string, boolean>>({})
const filePicker = ref<HTMLInputElement | null>(null)
const customFile = ref<File | null>(null)
const customPreviewUrl = ref<string | null>(null)

function clearCustom() {
  if (customPreviewUrl.value) URL.revokeObjectURL(customPreviewUrl.value)
  customPreviewUrl.value = null
  customFile.value = null
  if (filePicker.value) filePicker.value.value = ''
  emit('custom-file', null)
}
function selectPreset(id: string) {
  if (customFile.value) clearCustom()
  emit('update:modelValue', id)
}
function shift(delta: number) {
  selectPreset(presets[(selectedIndex.value + delta + presets.length) % presets.length]!.id)
}
function onFilePicked(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  if (customPreviewUrl.value) URL.revokeObjectURL(customPreviewUrl.value)
  customFile.value = file
  customPreviewUrl.value = URL.createObjectURL(file)
  emit('custom-file', file)
}
onBeforeUnmount(() => {
  if (customPreviewUrl.value) URL.revokeObjectURL(customPreviewUrl.value)
})
</script>
