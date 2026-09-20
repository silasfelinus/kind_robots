<!-- components/ruler-hooked/ruler-hooked-opening.vue
     The once-per-reign opening (ruler-hooked/t-028): three short, image-led
     beats -- premise, realm, first thing to do -- read inside the same
     centered setup window ruler-hooked/t-024 introduced (the host, e.g.
     ruler-hooked-game.vue, owns the <dialog> chrome; this is content-only,
     matching ruler-hooked-slots.vue's split). Skippable at any point; "Begin"
     and "Skip" both just dismiss -- neither withholds anything, this is
     framing, not a gate. -->
<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center justify-between gap-2">
      <h3 class="kr-text-faded-sm kr-text-eyebrow-bold tracking-wide">
        {{ beat.heading }}
      </h3>
      <span class="kr-text-faded-xs">{{ step + 1 }} / {{ beats.length }}</span>
    </div>

    <div
      v-if="beat.sceneRegion"
      class="h-32 w-full overflow-hidden rounded-xl bg-base-200"
    >
      <img
        v-if="regionArtSrc"
        :src="regionArtSrc"
        alt=""
        class="h-full w-full object-cover"
        loading="lazy"
        @error="regionArtBroken = true"
      />
    </div>
    <div
      v-else
      class="flex h-32 w-full items-center justify-center overflow-hidden rounded-xl bg-base-200"
    >
      <img
        v-if="narratorStage !== 'broken'"
        :src="narratorArtSrc"
        :alt="narratorName"
        class="kr-icon-12 rounded-full border border-base-300 object-cover"
        loading="lazy"
        @error="onNarratorArtError"
      />
      <div
        v-else
        class="kr-text-bold-lg flex kr-icon-12 items-center justify-center rounded-full border border-base-300 bg-base-300 opacity-60"
      >
        {{ narratorName.charAt(0) }}
      </div>
    </div>

    <p class="kr-text-faded-sm-80">{{ beat.text }}</p>

    <div class="flex items-center justify-between gap-2">
      <button type="button" class="kr-btn-ghost-plain" @click="emit('skip')">
        Skip
      </button>
      <div class="flex gap-2">
        <button
          v-if="step > 0"
          type="button"
          class="kr-btn-ghost-plain"
          @click="step -= 1"
        >
          Back
        </button>
        <button type="button" class="kr-btn-primary-plain" @click="advance">
          {{ isLast ? 'Begin' : 'Next' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RULER_HOOKED_OPENING } from '~/utils/rulerHooked/opening'
import {
  characterPortraitPath,
  characterFallbackPortraitPath,
} from '~/utils/rulerHooked/characterArt'
import { useRulerHookedStore } from '~/stores/rulerHookedStore'

const emit = defineEmits<{ skip: []; done: [] }>()

const store = useRulerHookedStore()
const beats = RULER_HOOKED_OPENING.beats
const step = ref(0)
const beat = computed(() => beats[step.value] ?? beats[0]!)
const isLast = computed(() => step.value === beats.length - 1)

function advance() {
  if (isLast.value) emit('done')
  else step.value += 1
}

// Region-scene beats reuse a landscape layer already resolved for preview
// (no state yet exists at opening time), falling back to nothing rather than
// a broken image if the layer isn't rendered.
const regionArtBroken = ref(false)
watch(step, () => {
  regionArtBroken.value = false
})
const regionArtSrc = computed(() => {
  if (regionArtBroken.value || !beat.value.sceneRegion) return ''
  const state = store.scene?.regionStates[beat.value.sceneRegion]
  if (!state) return ''
  return `/images/ruler-hooked/${beat.value.sceneRegion}-${state}.webp`
})

const narratorName = computed(
  () =>
    store.bundle.characters.find(
      (c) => c.slug === RULER_HOOKED_OPENING.narratorSlug,
    )?.name ?? 'Advisor',
)
// Same three-step fallback ladder as ruler-hooked-advisor.vue: expression
// art -> single neutral portrait -> initial-letter badge.
type PortraitStage = 'expression' | 'fallback' | 'broken'
const narratorStage = ref<PortraitStage>('expression')
const narratorArtSrc = computed(() =>
  narratorStage.value === 'expression'
    ? characterPortraitPath(RULER_HOOKED_OPENING.narratorSlug, 'neutral')
    : characterFallbackPortraitPath(RULER_HOOKED_OPENING.narratorSlug),
)
function onNarratorArtError() {
  narratorStage.value =
    narratorStage.value === 'expression' ? 'fallback' : 'broken'
}
</script>
