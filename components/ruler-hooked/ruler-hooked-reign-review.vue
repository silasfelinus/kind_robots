<!-- components/ruler-hooked/ruler-hooked-reign-review.vue
     "Ruler stuff" (ruler-hooked/t-028, Silas: "IS there an option to deal
     with ruler stuff?"): who the ruler is, how the realm currently regards
     them (plain-language read of kingdomHealth, not raw numbers), and a
     history of what their choices have actually done. Read-only -- no store
     mutation happens here, this is entirely derived from the active save. -->
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
        <p class="kr-text-faded-xs">
          Turn {{ save.turnCount }} · {{ save.status.toLowerCase() }}
        </p>
      </div>
    </div>

    <div>
      <h4 class="kr-text-faded-sm kr-text-eyebrow-bold mb-2 tracking-wide">
        How the realm regards you
      </h4>
      <ul class="flex flex-col gap-1">
        <li
          v-for="axis in axisReadings"
          :key="axis.key"
          class="flex items-center justify-between gap-2 text-sm"
        >
          <span class="capitalize opacity-70">{{ axis.key }}</span>
          <span class="font-medium">{{ axis.reading }}</span>
        </li>
      </ul>
    </div>

    <div
      v-if="advisorLine"
      class="rounded-lg border border-base-300 bg-base-200/40 p-2"
    >
      <p class="kr-text-faded-xs kr-text-eyebrow-bold">{{ advisorName }}</p>
      <p class="mt-0.5 text-sm">{{ advisorLine.text }}</p>
    </div>

    <div class="grid grid-cols-3 gap-2 text-center">
      <div class="kr-panel-tint-compact-50">
        <p class="kr-text-bold-lg">{{ save.counters.fishCaught ?? 0 }}</p>
        <p class="kr-text-faded-xs">fish caught</p>
      </div>
      <div class="kr-panel-tint-compact-50">
        <p class="kr-text-bold-lg">{{ save.counters.cardsResolved ?? 0 }}</p>
        <p class="kr-text-faded-xs">decisions made</p>
      </div>
      <div class="kr-panel-tint-compact-50">
        <p class="kr-text-bold-lg">{{ discoveredCount }}</p>
        <p class="kr-text-faded-xs">species discovered</p>
      </div>
    </div>

    <div>
      <h4 class="kr-text-faded-sm kr-text-eyebrow-bold mb-2 tracking-wide">
        What your choices have done
      </h4>
      <ol v-if="history.length" class="flex flex-col gap-2">
        <li
          v-for="entry in history"
          :key="`${entry.turn}-${entry.cardId}`"
          class="text-sm"
        >
          <span class="kr-text-faded-xs">Turn {{ entry.turn }}</span>
          — {{ entry.prompt }}
          <span class="font-medium">→ {{ entry.choiceText }}</span>
        </li>
      </ol>
      <p v-else class="kr-text-faded-sm-80">
        No decisions yet — the reign is still young.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AXIS_KEYS } from '~/types/ruler-hooked'
import type { AxisKey, RunSave } from '~/types/ruler-hooked'
import { currentAdvisorLine } from '~/utils/rulerHooked/advisor'
import { HERO_RULER_PRESET_ID } from '~/utils/rulerHooked/rulerPresets'
import { getPortraitUrl } from '~/utils/rulerHooked/portraitStore'
import { useRulerHookedStore } from '~/stores/rulerHookedStore'

const props = defineProps<{ save: RunSave }>()
const store = useRulerHookedStore()

const rulerLabel = computed(() =>
  [props.save.ruler.honorific, props.save.ruler.name].filter(Boolean).join(' '),
)

// Same portrait as the play scene (ruler-hooked-stage.vue): a locally-stored
// custom upload takes priority over the preset, both falling back to an
// initial-letter badge on failure.
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
  // A broken custom portrait degrades to the preset, not straight to the
  // badge, so switching appearance stays possible from this view too.
  portraitStage.value = portraitStage.value === 'custom' ? 'preset' : 'broken'
}

function readingFor(value: number): string {
  if (value <= 20) return 'in crisis'
  if (value <= 40) return 'struggling'
  if (value <= 60) return 'holding steady'
  if (value <= 80) return 'doing well'
  return 'thriving'
}
const axisReadings = computed(() =>
  AXIS_KEYS.map((key: AxisKey) => ({
    key,
    reading: readingFor(Math.round(props.save.kingdomHealth[key] ?? 50)),
  })),
)

const discoveredCount = computed(
  () => Object.keys(props.save.fishopedia).length,
)

// Last 8 decisions, most recent first -- enough to feel like a history
// without turning this into a full choiceLog dump.
const history = computed(() => [...props.save.choiceLog].reverse().slice(0, 8))

const advisorName = computed(() => store.advisorCharacter?.name ?? 'Advisor')
const advisorLine = computed(() =>
  currentAdvisorLine(store.bundle, props.save, {}),
)
</script>
