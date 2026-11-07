<template>
  <section class="rh-screen rh-study-settings" aria-label="Fishing settings">
    <RulerHookedArt
      class="rh-backdrop rh-study-settings__backdrop"
      :candidates="BACKDROPS.gear"
      eager
    />
    <div class="rh-parchment rh-study-settings__sheet">
      <p class="rh-eyebrow">Royal angling handbook</p>
      <h2 class="rh-title rh-title--big">How shall we fish?</h2>
      <fieldset class="rh-study-settings__modes">
        <legend class="sr-only">Fishing mode</legend>
        <label
          class="rh-study-settings__mode"
          :class="{ 'is-on': quiz.mode === 'classic' }"
        >
          <input
            type="radio"
            name="ruler-fishing-mode"
            value="classic"
            :checked="quiz.mode === 'classic'"
            @change="quiz.setMode('classic')"
          />
          <span class="rh-study-settings__illustration" aria-hidden="true"
            >🎣</span
          >
          <span
            ><strong>Classic</strong
            ><small>Stop the bobber in the gold, hook, then reel.</small></span
          >
        </label>
        <label
          class="rh-study-settings__mode"
          :class="{ 'is-on': quiz.mode === 'quiz' }"
        >
          <input
            type="radio"
            name="ruler-fishing-mode"
            value="quiz"
            :checked="quiz.mode === 'quiz'"
            @change="quiz.setMode('quiz')"
          />
          <span class="rh-study-settings__illustration" aria-hidden="true"
            >📜</span
          >
          <span
            ><strong>Learning</strong
            ><small>Each correct answer lands a random fish.</small></span
          >
        </label>
      </fieldset>
      <fieldset class="rh-study-settings__modules">
        <legend>Subjects in the mix</legend>
        <label
          v-for="subject in subjects"
          :key="subject.id"
          class="rh-study-settings__subject"
        >
          <input
            type="checkbox"
            :checked="quiz.modules[subject.id]"
            :disabled="quiz.modules[subject.id] && quiz.enabled.length === 1"
            @change="quiz.toggleModule(subject.id)"
          />
          <span aria-hidden="true">{{ subject.icon }}</span>
          <span
            ><strong>{{ subject.label }}</strong
            ><small>{{ subject.subtitle }}</small></span
          >
        </label>
      </fieldset>
      <fieldset
        v-if="quiz.mode === 'quiz'"
        class="rh-study-settings__classroom"
      >
        <legend>Build your lesson</legend>
        <p class="rh-study-settings__hint">
          Choose how much help to see before each cast. A right answer lands the
          fish; a miss opens the field guide.
        </p>
        <div
          class="rh-study-settings__segmented"
          role="group"
          aria-label="Learning pace"
        >
          <button
            v-for="choice in lessonStyles"
            :key="choice.id"
            type="button"
            :aria-pressed="quiz.lessonMode === choice.id"
            :class="{ 'is-selected': quiz.lessonMode === choice.id }"
            @click="quiz.setLessonMode(choice.id)"
          >
            <strong>{{ choice.label }}</strong>
            <small>{{ choice.description }}</small>
          </button>
        </div>
        <p class="rh-study-settings__hint">
          <strong>Challenge</strong> · Easy starts with two choices. Standard
          uses four; Expert unlocks more words sooner.
        </p>
        <div
          class="rh-study-settings__segmented rh-study-settings__segmented--tight"
          role="group"
          aria-label="Challenge level"
        >
          <button
            v-for="choice in difficulties"
            :key="choice.id"
            type="button"
            :aria-pressed="quiz.difficulty === choice.id"
            :class="{ 'is-selected': quiz.difficulty === choice.id }"
            @click="quiz.setDifficulty(choice.id)"
          >
            {{ choice.label }}
          </button>
        </div>
        <p class="rh-study-settings__hint">
          <strong>Question direction</strong> · Recognize names, reverse the
          clues, or mix both.
        </p>
        <div
          class="rh-study-settings__segmented rh-study-settings__segmented--tight"
          role="group"
          aria-label="Question direction"
        >
          <button
            v-for="choice in directions"
            :key="choice.id"
            type="button"
            :aria-pressed="quiz.promptDirection === choice.id"
            :class="{ 'is-selected': quiz.promptDirection === choice.id }"
            @click="quiz.setPromptDirection(choice.id)"
          >
            {{ choice.label }}
          </button>
        </div>
      </fieldset>
      <fieldset
        v-if="quiz.mode === 'quiz' && quiz.modules.mandarin"
        class="rh-study-settings__mandarin"
      >
        <legend>Mandarin study topic</legend>
        <p class="rh-study-settings__hint">
          Pick a subject for the Mandarin questions. All topics use Tutor
          vocabulary, review scheduling and pronunciation.
        </p>
        <div
          class="rh-study-settings__topic-grid"
          role="group"
          aria-label="Mandarin topics"
        >
          <button
            v-for="topic in topics"
            :key="topic.id"
            type="button"
            :aria-pressed="quiz.mandarinScope === topic.id"
            :class="{ 'is-selected': quiz.mandarinScope === topic.id }"
            :title="topic.description"
            @click="quiz.setMandarinScope(topic.id)"
          >
            <span aria-hidden="true">{{ topicIcons[topic.id] ?? '🀄' }}</span>
            {{ topic.label }}
          </button>
        </div>
        <p class="rh-study-settings__hint">
          Correct in this topic:
          {{ quiz.topicCorrect[quiz.mandarinScope] ?? 0 }}
        </p>
        <div
          class="rh-study-settings__segmented rh-study-settings__segmented--tight"
          role="group"
          aria-label="Word reference depth"
        >
          <button
            type="button"
            :class="{ 'is-selected': quiz.referenceDetail === 'quick' }"
            :aria-pressed="quiz.referenceDetail === 'quick'"
            @click="quiz.setReferenceDetail('quick')"
          >
            Quick word card
          </button>
          <button
            type="button"
            :class="{ 'is-selected': quiz.referenceDetail === 'full' }"
            :aria-pressed="quiz.referenceDetail === 'full'"
            @click="quiz.setReferenceDetail('full')"
          >
            Deep word history
          </button>
        </div>
      </fieldset>
      <p v-if="quiz.mode === 'quiz'" class="rh-study-settings__footer">
        <strong>Classroom progress</strong> · Flags {{ quiz.correct.flags }}/{{
          quiz.attempts.flags
        }}
        · Capitals {{ quiz.correct.capitals }}/{{ quiz.attempts.capitals }} ·
        Mandarin {{ quiz.correct.mandarin }}/{{ quiz.attempts.mandarin }}
        <small>(correct / answers attempted on this device)</small>
      </p>
      <p class="rh-study-settings__footer">
        Subjects expand as you answer. Mandarin uses your existing tutor lessons
        and spaced review when signed in.
        <NuxtLink to="/play/mandarin">Visit Mandarin Tutor</NuxtLink>
      </p>
      <p class="rh-study-settings__footer">
        Changes apply to your next question and are saved on this device.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRulerHookedQuizStore } from '~/stores/rulerHookedQuizStore'
import { BACKDROPS } from '~/utils/rulerHooked/artLibrary'
import {
  MANDARIN_QUIZ_TOPICS,
  type FishingQuizModule,
  type FishingQuizDifficulty,
  type FishingLessonMode,
  type FishingPromptDirection,
} from '~/utils/rulerHooked/quiz'

const quiz = useRulerHookedQuizStore()
const topics = MANDARIN_QUIZ_TOPICS
const lessonStyles: {
  id: FishingLessonMode
  label: string
  description: string
}[] = [
  {
    id: 'guided',
    label: 'Guided',
    description: 'Study unfamiliar clues first.',
  },
  {
    id: 'always',
    label: 'Study every time',
    description: 'A briefing before every cast.',
  },
  {
    id: 'quiz-first',
    label: 'Test me',
    description: 'Answer first, then learn.',
  },
]
const difficulties: { id: FishingQuizDifficulty; label: string }[] = [
  { id: 'easy', label: 'Easy · 2' },
  { id: 'standard', label: 'Standard · 4' },
  { id: 'challenge', label: 'Expert · 4' },
]
const directions: { id: FishingPromptDirection; label: string }[] = [
  { id: 'forward', label: 'Recognize' },
  { id: 'reverse', label: 'Reverse' },
  { id: 'mixed', label: 'Shuffle' },
]
const topicIcons: Record<string, string> = {
  all: '📖',
  animals: '🐼',
  colors: '🎨',
  numbers: '🔢',
  family: '🏡',
  people: '👥',
  body: '🩺',
  'food-drink': '🍜',
  home: '🛋️',
  school: '📚',
  work: '🧰',
  'travel-transport': '🚆',
  places: '🏯',
  weather: '⛅',
  'time-calendar': '⏳',
  directions: '🧭',
  clothing: '👕',
  'shopping-money': '🛍️',
  'everyday-actions': '🏃',
  adjectives: '✨',
  'questions-grammar': '❔',
  greetings: '👋',
  casino: '🎲',
}
const subjects: {
  id: FishingQuizModule
  label: string
  icon: string
  subtitle: string
}[] = [
  {
    id: 'flags',
    label: 'Countries & flags',
    icon: '🌍',
    subtitle: 'Learn to recognize the world.',
  },
  {
    id: 'capitals',
    label: 'US states & capitals',
    icon: '🏛️',
    subtitle: 'All 50 states unlock over time.',
  },
  {
    id: 'mandarin',
    label: 'Mandarin',
    icon: '🀄',
    subtitle: 'Picture lessons, pronunciation and spaced recall.',
  },
]
onMounted(() => quiz.initialize())
</script>

<style scoped>
.rh-study-settings__backdrop {
  filter: brightness(0.65) saturate(0.75);
}
.rh-study-settings__sheet {
  position: absolute;
  z-index: 2;
  inset: clamp(4.25rem, 11cqi, 5.5rem) clamp(0.5rem, 2.5cqi, 2rem)
    clamp(0.5rem, 2cqi, 1.25rem);
  left: var(--rh-sheet-left, clamp(0.5rem, 2.5cqi, 2rem));
  display: grid;
  align-content: start;
  gap: 0.75rem;
  overflow-y: auto;
}
.rh-study-settings__modes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
}
.rh-study-settings__mode {
  display: flex;
  gap: 0.55rem;
  align-items: center;
  padding: 0.65rem;
  border: 2px solid rgb(58 38 22 / 0.22);
  border-radius: 0.8rem;
  cursor: pointer;
  background: rgb(255 255 255 / 0.4);
}
.rh-study-settings__mode.is-on {
  border-color: var(--rh-plum);
  box-shadow: inset 0 0 0 1px var(--rh-plum);
}
.rh-study-settings__illustration {
  font-size: 2rem;
}
.rh-study-settings strong,
.rh-study-settings small {
  display: block;
}
.rh-study-settings small {
  font-size: 0.78rem;
}
.rh-study-settings__modules {
  display: grid;
  gap: 0.4rem;
}
.rh-study-settings__modules legend,
.rh-study-settings__mandarin legend,
.rh-study-settings__classroom legend {
  font-weight: 800;
  margin-bottom: 0.35rem;
}
.rh-study-settings__mandarin,
.rh-study-settings__classroom {
  display: grid;
  gap: 0.4rem;
  padding: 0.6rem;
  border: 1px solid rgb(58 38 22 / 0.3);
  border-radius: 0.8rem;
  background: rgb(255 250 240 / 0.4);
}
.rh-study-settings__hint {
  font-size: 0.76rem;
  line-height: 1.35;
}
.rh-study-settings__segmented {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.35rem;
}
.rh-study-settings__segmented button,
.rh-study-settings__topic-grid button {
  border: 1px solid rgb(58 38 22 / 0.25);
  border-radius: 0.65rem;
  background: rgb(255 255 255 / 0.56);
  padding: 0.4rem;
  text-align: center;
  cursor: pointer;
  font-size: 0.78rem;
}
.rh-study-settings__segmented button.is-selected,
.rh-study-settings__topic-grid button.is-selected {
  color: var(--rh-plum);
  background: rgb(254 222 149 / 0.8);
  border-color: var(--rh-plum);
  box-shadow: inset 0 0 0 1px var(--rh-plum);
}
.rh-study-settings__segmented small {
  font-size: 0.7rem;
  line-height: 1.25;
}
.rh-study-settings__segmented--tight button {
  font-weight: 800;
}
.rh-study-settings__topic-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr));
  gap: 0.35rem;
}
.rh-study-settings__topic-grid button span {
  margin-right: 0.15rem;
}
.rh-study-settings__subject {
  display: flex;
  gap: 0.65rem;
  align-items: center;
  padding: 0.45rem 0.5rem;
  border-radius: 0.6rem;
  background: rgb(255 255 255 / 0.5);
  cursor: pointer;
}
.rh-study-settings__subject > span:first-of-type {
  font-size: 1.6rem;
}
.rh-study-settings input {
  accent-color: var(--rh-plum);
  width: 1.1rem;
  height: 1.1rem;
  flex-shrink: 0;
}
.rh-study-settings__footer {
  font-size: 0.77rem;
  line-height: 1.3;
}
.rh-study-settings__footer a {
  color: var(--rh-plum);
  text-decoration: underline;
  font-weight: 800;
}
@container rhconsole (max-width: 499px) {
  .rh-study-settings__modes {
    grid-template-columns: 1fr;
  }
  .rh-study-settings__illustration {
    font-size: 1.4rem;
  }
  .rh-study-settings__segmented {
    grid-template-columns: 1fr;
  }
  .rh-study-settings__segmented--tight {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
