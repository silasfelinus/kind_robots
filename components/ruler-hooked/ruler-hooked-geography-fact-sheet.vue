<template>
  <section class="rh-geography-guide" aria-label="Geography lesson">
    <p class="rh-geography-guide__status" role="status">
      {{ study ? '✦ Field lesson · Learn this pair' : correct ? '✓ Correct · Your fish awaits' : 'Not quite · Here is the answer' }}
    </p>
    <div class="rh-geography-guide__plate">
      <div class="rh-geography-guide__symbol" :class="{ 'is-flag': question.module === 'flags' }" aria-hidden="true">
        {{ question.module === 'flags' ? flag : '🏛️' }}
      </div>
      <div class="rh-geography-guide__copy">
        <p class="rh-eyebrow">{{ question.module === 'flags' ? 'World flag guide' : 'United States atlas' }}</p>
        <h3>{{ title }}</h3>
        <p class="rh-geography-guide__subtitle">{{ subtitle }}</p>
      </div>
    </div>
    <p class="rh-geography-guide__fact">{{ question.explanation }}</p>
    <p class="rh-geography-guide__hint">
      {{ question.module === 'flags'
        ? 'Study the colors and shapes of the flag, then remember its country.'
        : 'Practice both directions: state to capital and capital to state.' }}
    </p>
    <button
      class="rh-btn rh-btn--gold rh-geography-guide__continue"
      type="button"
      @click="emit('continue')"
    >
      {{ study ? 'Ready to answer' : correct ? 'Land the fish' : 'Try another question' }}
    </button>
  </section>
</template>

<script setup lang="ts">
import type { FishingQuizQuestion } from '~/utils/rulerHooked/quiz'

const props = defineProps<{
  question: FishingQuizQuestion
  study: boolean
  correct: boolean
}>()
const emit = defineEmits<{ continue: [] }>()
const reversed = computed(() =>
  props.question.module === 'flags'
    ? props.question.hero === props.question.correctId
    : props.question.hero !== props.question.id.slice('capitals:'.length),
)
const flag = computed(() =>
  reversed.value
    ? props.question.options.find((option) => option.id === props.question.correctId)?.label ?? '🌍'
    : props.question.hero,
)
const title = computed(() =>
  props.question.module === 'flags'
    ? props.question.correctId
    : reversed.value
      ? props.question.correctId
      : props.question.hero,
)
const subtitle = computed(() =>
  props.question.module === 'flags'
    ? 'Recognize the national flag'
    : reversed.value
      ? 'Capital: ' + props.question.hero
      : 'Capital: ' + props.question.correctId,
)
</script>

<style scoped>
.rh-geography-guide {
  display: grid;
  gap: 0.65rem;
}
.rh-geography-guide__status {
  font-weight: 800;
  color: var(--rh-plum);
}
.rh-geography-guide__plate {
  display: grid;
  grid-template-columns: minmax(6rem, 34%) minmax(0, 1fr);
  gap: 0.8rem;
  padding: 0.65rem;
  align-items: center;
  background: rgb(255 255 255 / 0.32);
  border: 2px solid rgb(70 42 24 / 0.18);
  border-radius: 0.8rem;
}
.rh-geography-guide__symbol {
  display: grid;
  place-items: center;
  min-height: 8rem;
  border-radius: 0.5rem;
  background: rgb(250 232 190 / 0.6);
  font-size: clamp(3rem, 10cqi, 5rem);
}
.rh-geography-guide__copy h3 {
  font-size: clamp(1.4rem, 4cqi, 2rem);
  font-weight: 800;
  line-height: 1.1;
}
.rh-geography-guide__subtitle {
  font-weight: 700;
  color: var(--rh-plum);
}
.rh-geography-guide__fact {
  font-size: 1rem;
  font-weight: 750;
  line-height: 1.35;
}
.rh-geography-guide__hint {
  font-size: 0.8rem;
  line-height: 1.35;
}
.rh-geography-guide__continue {
  position: sticky;
  bottom: 0;
}
</style>
