<template>
  <section class="rh-word-sheet" aria-label="Mandarin answer reference">
    <p class="rh-word-sheet__verdict" role="status">
      {{
        correct
          ? '✓ Right answer · A fish is on the line'
          : 'Not quite · Learn this word'
      }}
    </p>
    <div class="rh-word-sheet__body">
      <MandarinCardArt
        class="rh-word-sheet__art"
        :card-key="card.key"
        :simplified="card.simplified"
        :meaning="card.meaning"
        :art="art"
      />
      <div class="rh-word-sheet__identity">
        <p class="rh-eyebrow">
          {{ animalMode ? 'Animal field guide' : 'Mandarin field guide' }}
        </p>
        <h3>{{ card.meaning }}</h3>
        <p class="rh-word-sheet__hanzi">{{ card.simplified }}</p>
        <p
          v-if="card.traditional && card.traditional !== card.simplified"
          class="rh-word-sheet__small"
        >
          Traditional: {{ card.traditional }}
        </p>
        <p class="rh-word-sheet__pinyin">{{ card.pinyin }}</p>
        <button
          type="button"
          class="rh-btn rh-word-sheet__audio"
          @click="emit('speak')"
        >
          🔊 Hear pronunciation
        </button>
      </div>
    </div>

    <div class="rh-word-sheet__facts">
      <p v-if="card.meanings.length > 1" class="rh-word-sheet__small">
        Also:
        {{
          card.meanings
            .filter((meaning) => meaning !== card.meaning)
            .join(' · ')
        }}
      </p>
      <section v-if="lesson?.syllables.length" aria-label="Pronunciation notes">
        <h4>Pronunciation &amp; tones</h4>
        <p
          v-for="(syllable, index) in lesson.syllables"
          :key="index"
          class="rh-word-sheet__fact"
        >
          <strong>{{ syllable.syllable }} {{ syllable.toneArrow }}</strong>
          {{ syllable.toneShape }}
          <span v-if="syllable.sandhiNote">· {{ syllable.sandhiNote }}</span>
        </p>
      </section>
      <section v-if="lesson" aria-label="Word origins">
        <h4>Word &amp; character origins</h4>
        <p class="rh-word-sheet__fact">{{ lesson.history }}</p>
        <template
          v-for="character in lesson.characters"
          :key="character.character"
        >
          <p v-if="character.formation?.hint" class="rh-word-sheet__fact">
            <strong>{{ character.character }}</strong
            >: {{ character.formation.hint }}
          </p>
          <p
            v-for="component in character.components.filter(
              (part) =>
                part.role === 'semantic' ||
                part.role === 'phonetic' ||
                part.role === 'idea',
            )"
            :key="character.character + component.glyph"
            class="rh-word-sheet__fact"
          >
            <strong>{{ component.glyph }}</strong> {{ component.contribution }}
          </p>
        </template>
      </section>
      <p v-if="lesson?.soundFamilies.length" class="rh-word-sheet__small">
        Sound family:
        {{
          lesson.soundFamilies[0]?.members
            .slice(0, 3)
            .map((member) => member.simplified + ' (' + member.pinyin + ')')
            .join(' · ')
        }}
      </p>
      <p class="rh-word-sheet__source">
        Source: {{ card.source.label }}
        <a
          v-if="card.source.url"
          :href="card.source.url"
          target="_blank"
          rel="noopener noreferrer"
          >View vocabulary source</a
        >
      </p>
    </div>

    <button
      type="button"
      class="rh-btn rh-btn--gold rh-btn--big rh-word-sheet__continue"
      @click="emit('continue')"
    >
      {{ correct ? 'Land the fish' : 'Try another word' }}
    </button>
  </section>
</template>

<script setup lang="ts">
import type { MandarinCard } from '~/utils/mandarin'
import type { MandarinLesson } from '~/utils/mandarinLesson'

defineProps<{
  card: MandarinCard
  lesson: MandarinLesson | null
  art: string
  correct: boolean
  animalMode: boolean
}>()
const emit = defineEmits<{ speak: []; continue: [] }>()
</script>

<style scoped>
.rh-word-sheet {
  display: grid;
  gap: 0.55rem;
  min-width: 0;
}
.rh-word-sheet__verdict {
  font-weight: 800;
  color: var(--rh-plum);
}
.rh-word-sheet__body {
  display: grid;
  grid-template-columns: minmax(6rem, 32%) minmax(0, 1fr);
  gap: 0.65rem;
}
.rh-word-sheet__art {
  aspect-ratio: 2 / 3;
  border: 2px solid rgb(58 38 22 / 0.25);
  border-radius: 0.65rem;
  min-height: 8rem;
}
.rh-word-sheet__identity {
  min-width: 0;
  display: grid;
  align-content: center;
  justify-items: start;
  gap: 0.15rem;
}
.rh-word-sheet__identity h3 {
  font-family: var(--rh-display);
  font-size: clamp(1.2rem, 3cqi, 1.8rem);
  font-weight: 800;
  line-height: 1.12;
  overflow-wrap: anywhere;
}
.rh-word-sheet__hanzi {
  font-size: clamp(1.9rem, 5cqi, 3rem);
  font-weight: 700;
  line-height: 1.15;
}
.rh-word-sheet__pinyin {
  font-size: 1rem;
  font-weight: 800;
}
.rh-word-sheet__small {
  font-size: 0.8rem;
  line-height: 1.3;
}
.rh-word-sheet__audio {
  min-height: 2.5rem;
  padding-inline: 0.65rem;
}
.rh-word-sheet__facts {
  display: grid;
  gap: 0.3rem;
}
.rh-word-sheet__facts section {
  display: grid;
  gap: 0.25rem;
}
.rh-word-sheet__facts h4 {
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--rh-plum);
}
.rh-word-sheet__fact {
  font-size: 0.82rem;
  line-height: 1.3;
}
.rh-word-sheet__source {
  font-size: 0.72rem;
  opacity: 0.78;
}
.rh-word-sheet__source a {
  text-decoration: underline;
  margin-left: 0.3rem;
}
.rh-word-sheet__continue {
  position: sticky;
  bottom: 0;
  z-index: 2;
  box-shadow: 0 -5px 15px rgb(244 231 201 / 0.95);
}
@container rhconsole (max-width: 480px) {
  .rh-word-sheet__body {
    grid-template-columns: minmax(5.5rem, 36%) minmax(0, 1fr);
  }
  .rh-word-sheet__audio {
    font-size: 0.78rem;
  }
}
</style>
