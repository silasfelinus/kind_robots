<template>
  <section class="rh-screen rh-study-settings" aria-label="Fishing settings">
    <RulerHookedArt class="rh-backdrop rh-study-settings__backdrop" :candidates="BACKDROPS.gear" eager />
    <div class="rh-parchment rh-study-settings__sheet">
      <p class="rh-eyebrow">Royal angling handbook</p>
      <h2 class="rh-title rh-title--big">How shall we fish?</h2>
      <fieldset class="rh-study-settings__modes">
        <legend class="sr-only">Fishing mode</legend>
        <label class="rh-study-settings__mode" :class="{ 'is-on': quiz.mode === 'classic' }">
          <input
            type="radio"
            name="ruler-fishing-mode"
            value="classic"
            :checked="quiz.mode === 'classic'"
            @change="quiz.setMode('classic')"
          />
          <span class="rh-study-settings__illustration" aria-hidden="true">🎣</span>
          <span><strong>Classic</strong><small>Stop the bobber in the gold, hook, then reel.</small></span>
        </label>
        <label class="rh-study-settings__mode" :class="{ 'is-on': quiz.mode === 'quiz' }">
          <input
            type="radio"
            name="ruler-fishing-mode"
            value="quiz"
            :checked="quiz.mode === 'quiz'"
            @change="quiz.setMode('quiz')"
          />
          <span class="rh-study-settings__illustration" aria-hidden="true">📜</span>
          <span><strong>Learning</strong><small>Each correct answer lands a random fish.</small></span>
        </label>
      </fieldset>
      <fieldset class="rh-study-settings__modules">
        <legend>Subjects in the mix</legend>
        <label v-for="subject in subjects" :key="subject.id" class="rh-study-settings__subject">
          <input
            type="checkbox"
            :checked="quiz.modules[subject.id]"
            :disabled="quiz.modules[subject.id] && quiz.enabled.length === 1"
            @change="quiz.toggleModule(subject.id)"
          />
          <span aria-hidden="true">{{ subject.icon }}</span>
          <span><strong>{{ subject.label }}</strong><small>{{ subject.subtitle }}</small></span>
        </label>
      </fieldset>
      <p class="rh-study-settings__footer">
        Subjects expand as you answer. Mandarin uses your existing tutor lessons and spaced review
        when signed in.
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
import type { FishingQuizModule } from '~/utils/rulerHooked/quiz'

const quiz = useRulerHookedQuizStore()
const subjects: { id: FishingQuizModule; label: string; icon: string; subtitle: string }[] = [
  { id: 'flags', label: 'Countries & flags', icon: '🌍', subtitle: 'Learn to recognize the world.' },
  { id: 'capitals', label: 'US states & capitals', icon: '🏛️', subtitle: 'All 50 states unlock over time.' },
  { id: 'mandarin', label: 'Mandarin', icon: '🀄', subtitle: 'Picture lessons, pronunciation and spaced recall.' },
]
onMounted(() => quiz.initialize())
</script>

<style scoped>
.rh-study-settings__backdrop { filter: brightness(0.65) saturate(0.75); }
.rh-study-settings__sheet {
  position: absolute;
  z-index: 2;
  inset: clamp(4.25rem, 11cqi, 5.5rem) clamp(0.5rem, 2.5cqi, 2rem) clamp(0.5rem, 2cqi, 1.25rem);
  left: var(--rh-sheet-left, clamp(0.5rem, 2.5cqi, 2rem));
  display: grid;
  align-content: start;
  gap: 0.75rem;
  overflow-y: auto;
}
.rh-study-settings__modes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.55rem; }
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
.rh-study-settings__mode.is-on { border-color: var(--rh-plum); box-shadow: inset 0 0 0 1px var(--rh-plum); }
.rh-study-settings__illustration { font-size: 2rem; }
.rh-study-settings strong, .rh-study-settings small { display: block; }
.rh-study-settings small { font-size: 0.78rem; }
.rh-study-settings__modules { display: grid; gap: 0.4rem; }
.rh-study-settings__modules legend { font-weight: 800; margin-bottom: 0.35rem; }
.rh-study-settings__subject { display: flex; gap: 0.65rem; align-items: center; padding: 0.45rem 0.5rem; border-radius: 0.6rem; background: rgb(255 255 255 / 0.5); cursor: pointer; }
.rh-study-settings__subject > span:first-of-type { font-size: 1.6rem; }
.rh-study-settings input { accent-color: var(--rh-plum); width: 1.1rem; height: 1.1rem; flex-shrink: 0; }
.rh-study-settings__footer { font-size: 0.77rem; line-height: 1.3; }
.rh-study-settings__footer a { color: var(--rh-plum); text-decoration: underline; font-weight: 800; }
@container rhconsole (max-width: 499px) {
  .rh-study-settings__modes { grid-template-columns: 1fr; }
  .rh-study-settings__illustration { font-size: 1.4rem; }
}
</style>
