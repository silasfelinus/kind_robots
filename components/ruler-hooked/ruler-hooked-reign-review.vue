<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-3">
      <img
        v-if="portraitStage !== 'broken'"
        :src="portraitSrc"
        :alt="rulerLabel"
        class="kr-icon-12 shrink-0 rounded-full border border-base-300 object-cover"
        loading="lazy"
        @error="onPortraitError"
      />
      <div
        v-else
        class="kr-text-bold-lg flex kr-icon-12 shrink-0 items-center justify-center rounded-full border border-base-300 bg-base-200 opacity-60"
      >
        {{ (save.ruler.name || '?').charAt(0) }}
      </div>
      <div>
        <p class="kr-text-bold-lg">{{ rulerLabel }}</p>
        <p class="kr-text-faded-xs">Your reign, your people, and the realm they live in.</p>
      </div>
    </div>

    <RulerHookedKingdomView
      :save="save"
      :bundle="store.bundle"
      :scene="store.scene"
      :regions="store.bundle.regions"
    />
  </div>
</template>

<script setup lang="ts">
import type { RunSave } from '~/types/ruler-hooked'
import { HERO_RULER_PRESET_ID } from '~/utils/rulerHooked/rulerPresets'
import { getPortraitUrl } from '~/utils/rulerHooked/portraitStore'
import { useRulerHookedStore } from '~/stores/rulerHookedStore'

const props = defineProps<{ save: RunSave }>()
const store = useRulerHookedStore()

const rulerLabel = computed(() =>
  [props.save.ruler.honorific, props.save.ruler.name].filter(Boolean).join(' '),
)

const presetId = computed(
  () => props.save.ruler.cosmetics?.presetId ?? HERO_RULER_PRESET_ID,
)
const customPortraitId = computed(
  () => props.save.ruler.cosmetics?.customPortraitId ?? null,
)

const customPortraitUrl = ref<string | null>(null)
watch(
  customPortraitId,
  async (id, _prev, onCleanup) => {
    let cancelled = false
    onCleanup(() => {
      cancelled = true
    })
    if (!id) {
      customPortraitUrl.value = null
      return
    }
    const url = await getPortraitUrl(id)
    if (!cancelled) customPortraitUrl.value = url
  },
  { immediate: true },
)
const prevUrl = ref<string | null>(null)
watch(customPortraitUrl, (url) => {
  if (prevUrl.value && prevUrl.value !== url) URL.revokeObjectURL(prevUrl.value)
  prevUrl.value = url
})
onBeforeUnmount(() => {
  if (prevUrl.value) URL.revokeObjectURL(prevUrl.value)
})

type PortraitStage = 'custom' | 'preset' | 'broken'
const portraitStage = ref<PortraitStage>('preset')
watch(
  [customPortraitUrl, presetId],
  ([customUrl]) => {
    portraitStage.value = customUrl ? 'custom' : 'preset'
  },
  { immediate: true },
)
const portraitSrc = computed(() => {
  if (portraitStage.value === 'custom') return customPortraitUrl.value ?? ''
  if (portraitStage.value === 'preset') {
    return `/images/ruler-hooked/ruler-${presetId.value}.webp`
  }
  return ''
})
function onPortraitError() {
  portraitStage.value = portraitStage.value === 'custom' ? 'preset' : 'broken'
}
</script>
