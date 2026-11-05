<!-- Quill's situational lesson: the steward's portrait and one line of advice,
     anchored bottom-left above the nav. Action lessons dismiss themselves
     when you do the thing; the rest have "Got it". -->
<template>
  <aside
    class="rh-coach"
    :class="{ 'rh-coach--low': screen === 'lake' }"
    aria-live="polite"
    :aria-label="`Advice from ${name}`"
  >
    <RulerHookedArt
      class="rh-coach__face"
      :candidates="characterCandidates(ADVISOR_CHARACTER_SLUG)"
      :alt="name"
      :initial="name.charAt(0)"
      position="center 18%"
    />
    <div class="rh-coach__bubble">
      <p class="rh-coach__name">{{ name }}</p>
      <p class="rh-coach__text">{{ lesson.text }}</p>
      <div class="rh-coach__actions">
        <button
          v-if="lesson.points && lesson.points !== screen"
          type="button"
          class="rh-btn rh-btn--gold rh-btn--small"
          @click="emit('go', lesson.points)"
        >
          Show me
        </button>
        <button
          v-if="!lesson.byAction || (lesson.points && lesson.points !== screen)"
          type="button"
          class="rh-btn rh-btn--small"
          @click="emit('learn', lesson.id)"
        >
          Got it
        </button>
        <button type="button" class="rh-coach__skip" @click="emit('skip')">
          Skip lessons
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ADVISOR_CHARACTER_SLUG } from '~/utils/rulerHooked/advisor'
import { characterCandidates } from '~/utils/rulerHooked/artLibrary'
import type { ConsoleScreen, Lesson } from '~/utils/rulerHooked/tutorial'

defineProps<{ lesson: Lesson; screen: ConsoleScreen; name: string }>()
const emit = defineEmits<{
  learn: [id: string]
  skip: []
  go: [screen: ConsoleScreen]
}>()
</script>

<style scoped>
.rh-coach {
  position: absolute;
  z-index: 40;
  left: clamp(0.4rem, 1.5cqi, 1rem);
  bottom: calc(var(--rh-nav-h, 5rem) + 0.5rem);
  display: flex;
  align-items: flex-end;
  gap: 0.4rem;
  max-width: min(30rem, calc(100% - 0.8rem));
  animation: rh-coach-in 320ms ease;
  pointer-events: auto;
}
.rh-coach__face {
  flex: none;
  width: clamp(3.75rem, 10cqi, 6rem);
  aspect-ratio: 3 / 4;
  border-radius: 1rem 1rem 0.4rem 1rem;
  border: 2px solid var(--rh-gold);
  box-shadow:
    0 0 0 3px rgb(59 21 48 / 0.7),
    0 8px 16px rgb(0 0 0 / 0.4);
}
.rh-coach__bubble {
  position: relative;
  padding: 0.55rem 0.8rem 0.6rem;
  border-radius: 1rem 1rem 1rem 0.2rem;
  background: linear-gradient(180deg, #fffaf0, var(--rh-parch));
  color: var(--rh-ink);
  border: 1.5px solid var(--rh-gold);
  box-shadow: 0 8px 18px rgb(0 0 0 / 0.35);
}
.rh-coach__name {
  font-family: var(--rh-display);
  font-weight: 800;
  font-size: 0.78rem;
  color: var(--rh-plum);
  letter-spacing: 0.04em;
}
.rh-coach__text {
  font-size: clamp(0.85rem, 1.6cqi, 0.98rem);
  line-height: 1.35;
}
.rh-coach__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.4rem;
}
.rh-coach__skip {
  margin-left: auto;
  font-size: 0.72rem;
  text-decoration: underline;
  opacity: 0.65;
  min-height: 2rem;
}
/* Quill speaks from just under the HUD, clear of petitions, atlas cards and
   the fishing dock. Only the wide lake view has a free bottom-left corner. */
.rh-coach {
  bottom: auto;
  left: auto;
  top: 4.6rem;
  right: clamp(0.4rem, 1.5cqi, 1rem);
}
@container rhconsole (min-width: 900px) {
  .rh-coach--low {
    top: auto;
    right: auto;
    left: clamp(0.4rem, 1.5cqi, 1rem);
    bottom: calc(var(--rh-nav-h, 5rem) + 0.5rem);
  }
}
@keyframes rh-coach-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .rh-coach {
    animation: none;
  }
}
</style>
