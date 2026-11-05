<template>
  <section class="rh-parchment rh-quiz" aria-label="Learn to catch">
    <header class="rh-quiz__head">
      <div>
        <p class="rh-eyebrow">Knowledge on the line</p>
        <h2 class="rh-title">{{ encounter.fishName }} is biting</h2>
      </div>
      <span class="rh-quiz__seal">✦ {{ moduleLabel }}</span>
    </header>

    <p v-if="quiz.loading" role="status">Preparing the next question…</p>
    <div
      v-else-if="quiz.error && !quiz.question"
      class="rh-quiz__message"
      role="alert"
    >
      <p>{{ quiz.error }}</p>
      <div class="rh-actions">
        <button
          class="rh-btn rh-btn--gold"
          type="button"
          @click="quiz.retryLoading()"
        >
          Retry
        </button>
        <button class="rh-btn" type="button" @click="quiz.setMode('classic')">
          Fish in Classic mode
        </button>
      </div>
    </div>

    <template v-else-if="quiz.question">
      <div
        v-if="quiz.introduction && quiz.currentMandarinCard"
        class="rh-quiz__lesson"
      >
        <MandarinCardArt
          class="rh-quiz__art"
          :card-key="quiz.currentMandarinCard.key"
          :simplified="quiz.currentMandarinCard.simplified"
          :meaning="quiz.currentMandarinCard.meaning"
          :art="quiz.currentArt"
        />
        <div class="rh-quiz__lesson-copy">
          <p class="rh-eyebrow">New word · Learn first</p>
          <h3>{{ quiz.currentMandarinCard.simplified }}</h3>
          <p class="rh-quiz__pinyin">{{ quiz.currentMandarinCard.pinyin }}</p>
          <p>{{ quiz.currentMandarinCard.meaning }}</p>
          <p v-if="quiz.currentMandarinCard.history" class="rh-quiz__detail">
            {{ quiz.currentMandarinCard.history }}
          </p>
          <p
            v-else-if="quiz.currentMandarinCard.components.length"
            class="rh-quiz__detail"
          >
            Parts:
            {{
              quiz.currentMandarinCard.components
                .slice(0, 3)
                .map((part) => part.glyph + ' ' + part.label)
                .join(' · ')
            }}
          </p>
          <div class="rh-actions">
            <button type="button" class="rh-btn" @click="speak">
              🔊 Hear it
            </button>
            <button
              type="button"
              class="rh-btn rh-btn--gold"
              @click="quiz.finishIntroduction()"
            >
              Ready to answer
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="quiz.feedback" class="rh-quiz__message" role="status">
        <p>{{ quiz.feedback }}</p>
        <button
          type="button"
          class="rh-btn rh-btn--gold"
          @click="quiz.nextQuestion()"
        >
          Another question
        </button>
      </div>

      <div v-else class="rh-quiz__challenge">
        <p class="rh-quiz__prompt">{{ quiz.question.prompt }}</p>
        <div
          class="rh-quiz__symbol"
          :class="{ 'is-flag': quiz.question.module === 'flags' }"
        >
          {{ quiz.question.hero }}
          <button
            v-if="quiz.question.module === 'mandarin'"
            type="button"
            class="rh-quiz__sound"
            aria-label="Hear Mandarin pronunciation"
            @click="speak"
          >
            🔊
          </button>
        </div>
        <KrChoiceHand
          :choices="hand"
          :deal-key="quiz.question.id"
          :animate="false"
          testid-prefix="ruler-quiz-choice"
          @play="pick"
        />
        <p class="rh-quiz__note">
          Choose correctly to land this fish. A mistake brings another question,
          not a lost catch.
        </p>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { useMandarinTutorStore } from '~/stores/mandarinTutorStore'
import { useRulerHookedQuizStore } from '~/stores/rulerHookedQuizStore'
import type { SimpleFishingEncounter } from '~/utils/rulerHooked/simpleFishing'

const props = defineProps<{ encounter: SimpleFishingEncounter }>()
const quiz = useRulerHookedQuizStore()
const tutor = useMandarinTutorStore()

const moduleLabel = computed(() => {
  const module = quiz.question?.module
  return module === 'flags'
    ? 'Flags'
    : module === 'capitals'
      ? 'Capitals'
      : module === 'mandarin'
        ? 'Mandarin'
        : 'Quiz'
})
const hand = computed(() =>
  (quiz.question?.options ?? []).map((option) => ({
    id: option.id,
    label: option.label,
    icon: option.icon ?? (quiz.question?.module === 'capitals' ? '🏛️' : '✒️'),
  })),
)
function pick(choice: { id: string }) {
  quiz.answer(choice.id)
}
function speak() {
  if (quiz.currentMandarinCard) void tutor.speak(quiz.currentMandarinCard)
}
onMounted(() => void quiz.nextQuestion())
watch(
  () => props.encounter.fishSlug,
  () => void quiz.nextQuestion(),
)
</script>

<style scoped>
.rh-quiz {
  width: 100%;
  min-width: 0;
  max-height: min(72vh, 38rem);
  overflow-y: auto;
  scrollbar-width: thin;
  display: grid;
  gap: 0.5rem;
}
.rh-quiz__head {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: center;
}
.rh-quiz__seal {
  flex-shrink: 0;
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--rh-plum);
}
.rh-quiz__challenge {
  display: grid;
  gap: 0.15rem;
  --hand-card-max: 6.25rem;
  --hand-card-cqw: 25cqw;
  --hand-card-vh: 14vh;
  --hand-focus-scale: 1;
  --hand-band: var(--rh-plum);
  --hand-band-ink: #fff4dc;
  --hand-accent: var(--rh-gold);
}
.rh-quiz__prompt {
  font-weight: 800;
  text-align: center;
}
.rh-quiz__symbol {
  position: relative;
  min-height: 2.7rem;
  text-align: center;
  font-size: clamp(1.5rem, 6cqi, 2.5rem);
  font-weight: 800;
  line-height: 1.15;
  color: var(--rh-plum);
}
.rh-quiz__symbol.is-flag {
  font-size: clamp(2.5rem, 10cqi, 4.5rem);
}
.rh-quiz__sound {
  margin-left: 0.4rem;
  font-size: 1.2rem;
  vertical-align: middle;
  border: 1px solid currentColor;
  border-radius: 0.5rem;
}
.rh-quiz__note {
  font-size: 0.71rem;
  opacity: 0.8;
  text-align: center;
}
.rh-quiz__lesson {
  display: grid;
  grid-template-columns: minmax(6rem, 36%) minmax(0, 1fr);
  gap: 0.65rem;
  align-items: start;
}
.rh-quiz__art {
  aspect-ratio: 2 / 3;
  min-height: 10rem;
  border-radius: 0.7rem;
}
.rh-quiz__lesson-copy {
  display: grid;
  align-content: start;
  gap: 0.3rem;
}
.rh-quiz__lesson-copy h3 {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1.1;
}
.rh-quiz__pinyin {
  font-weight: 800;
}
.rh-quiz__detail {
  font-size: 0.74rem;
  line-height: 1.25;
}
.rh-quiz__message {
  display: grid;
  gap: 0.7rem;
}
@container rhconsole (max-width: 599px) {
  .rh-quiz {
    max-height: 48vh;
  }
  .rh-quiz__lesson {
    grid-template-columns: 1fr 1.5fr;
  }
  .rh-quiz__art {
    min-height: 7rem;
  }
}
</style>
