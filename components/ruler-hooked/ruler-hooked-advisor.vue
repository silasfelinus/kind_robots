<!-- components/ruler-hooked/ruler-hooked-advisor.vue
     The standing advisor (ruler-hooked/t-028): present throughout play,
     reacting to catches, escapes, kingdom health, and pending endings instead
     of those things arriving as bare system messages. Portrait degrades
     gracefully -- expression art, then a single neutral portrait, then an
     initial-letter badge -- the same three-step ladder
     ruler-hooked-cosmetics-picker.vue already uses for ruler presets, since
     none of this art has rendered yet (t-028 is schema-only for art). -->
<template>
  <div
    v-if="advisor && line"
    class="kr-panel-flat flex items-start gap-3 rounded-xl p-3"
  >
    <img
      v-if="stage !== 'broken'"
      :src="portraitSrc"
      :alt="advisorLabel"
      class="kr-icon-12 shrink-0 rounded-full border border-base-300 object-cover"
      loading="lazy"
      @error="onPortraitError"
    />
    <div
      v-else
      class="kr-text-bold-lg flex kr-icon-12 shrink-0 items-center justify-center rounded-full border border-base-300 bg-base-200 opacity-60"
    >
      {{ advisor.name.charAt(0) }}
    </div>
    <div class="min-w-0 flex-1">
      <p class="kr-text-faded-xs kr-text-eyebrow-bold">{{ advisorLabel }}</p>
      <p class="mt-0.5 text-sm" :class="moodClass">{{ line.text }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRulerHookedStore } from '~/stores/rulerHookedStore'
import {
  characterPortraitPath,
  characterFallbackPortraitPath,
} from '~/utils/rulerHooked/characterArt'
import type { AdvisorMood } from '~/utils/rulerHooked/advisor'

const store = useRulerHookedStore()
const advisor = computed(() => store.advisorCharacter)
const line = computed(() => store.advisorLine)

const advisorLabel = computed(() =>
  advisor.value
    ? [advisor.value.name, advisor.value.honorific].filter(Boolean).join(', ')
    : '',
)

// expression-specific art -> single neutral portrait -> initial-letter badge.
// Resets whenever the mood changes so a newly-relevant expression gets its
// own chance before falling back.
type PortraitStage = 'expression' | 'fallback' | 'broken'
const stage = ref<PortraitStage>('expression')
watch(
  () => line.value?.mood,
  () => {
    stage.value = 'expression'
  },
)

const portraitSrc = computed(() => {
  if (!advisor.value) return ''
  if (stage.value === 'expression' && line.value) {
    return characterPortraitPath(advisor.value.slug, line.value.mood)
  }
  return characterFallbackPortraitPath(advisor.value.slug)
})

function onPortraitError() {
  stage.value = stage.value === 'expression' ? 'fallback' : 'broken'
}

const MOOD_CLASS: Record<AdvisorMood, string> = {
  neutral: '',
  pleased: 'text-success',
  concerned: 'text-warning',
  alarmed: 'text-error',
}
const moodClass = computed(() =>
  line.value ? MOOD_CLASS[line.value.mood] : '',
)
</script>
