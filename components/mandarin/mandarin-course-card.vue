<!-- /components/mandarin/mandarin-course-card.vue
     mandarin-tutor/t-028: one screen of the guided course.

     Every branch below is ONE idea. That constraint is the whole design: the reference
     page at /play/mandarin/learn/<key> already shows a word's pinyin anatomy, component
     roles, sound family and history all at once, and it is the right page for someone
     reading about a character they already care about. It is the wrong page for someone
     meeting 说 for the first time, who needs the pieces handed over one at a time.

     This component renders and emits; it owns no sequence state and makes no requests.
     The page owns the plan, the index, and every write. -->
<template>
  <article class="kr-panel-section-plain shadow-lg">
    <!-- ORIENTATION ------------------------------------------------------- -->
    <template v-if="step.kind === 'intro'">
      <p class="kr-text-eyebrow-bold text-primary">Before we start</p>
      <h2 class="kr-text-black-xl mt-1">{{ step.title }}</h2>
      <p class="mt-3 leading-relaxed">{{ step.body }}</p>

      <div
        v-if="step.example?.length"
        class="mt-4 grid gap-2 grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))]"
      >
        <div
          v-for="item in step.example"
          :key="`${item.glyph}-${item.label}`"
          class="kr-panel-flat p-3 text-center"
        >
          <p class="text-4xl leading-none font-semibold">{{ item.glyph }}</p>
          <p class="kr-text-faded-xs mt-2 leading-relaxed">{{ item.label }}</p>
        </div>
      </div>
    </template>

    <!-- MEET IT ----------------------------------------------------------- -->
    <template v-else-if="beat === 'meet' && lesson">
      <p class="kr-text-eyebrow-bold text-primary">A new word</p>

      <div
        class="mt-3 flex flex-wrap items-center justify-center gap-5 text-center"
      >
        <div
          v-if="artUrl"
          class="size-40 shrink-0 overflow-hidden rounded-3xl border border-base-300 shadow-inner"
        >
          <MandarinCardArt
            :card-key="lesson.key"
            :simplified="lesson.simplified"
            :meaning="lesson.meaning"
            :art="artUrl"
            eager
            @error="$emit('art-error', lesson.key)"
          />
        </div>

        <div>
          <p class="text-7xl leading-none font-semibold">
            {{ lesson.simplified }}
          </p>
          <p class="kr-text-bold-2xl mt-3 tracking-wide">{{ lesson.pinyin }}</p>
          <p class="mt-1 text-xl font-semibold">{{ lesson.meaning }}</p>
        </div>
      </div>

      <button
        type="button"
        class="kr-btn-outline-md mx-auto mt-4 flex"
        @click="$emit('speak')"
      >
        <Icon name="kind-icon:volume" class="kr-icon-4" />
        Hear it
      </button>

      <p
        v-if="lesson.meanings.length > 1"
        class="kr-text-faded-xs mt-4 text-center leading-relaxed"
      >
        Also: {{ lesson.meanings.slice(1).join(' · ') }}
      </p>

      <!-- A word whose parts the source gives no job to gets NO pieces screen (see
           utils/mandarinCourse.ts). Saying so here, in one clause, is the whole of what
           that screen was ever able to say. -->
      <p
        v-if="lesson.teachability === 'vocabulary'"
        class="kr-text-dim-xs-45 mt-4 text-center leading-relaxed"
      >
        Its parts don't explain this one — learn it whole.
      </p>
    </template>

    <!-- HOW IT SOUNDS ------------------------------------------------------ -->
    <template v-else-if="beat === 'sound' && lesson">
      <p class="kr-text-eyebrow-bold text-primary">
        How {{ lesson.simplified }} sounds
      </p>
      <h2 class="kr-text-black-xl mt-1 tracking-wide">{{ lesson.pinyin }}</h2>

      <div
        class="mt-4 grid gap-2 grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))]"
      >
        <div
          v-for="(syllable, index) in lesson.syllables"
          :key="`${syllable.syllable}-${index}`"
          class="kr-panel-flat p-3"
        >
          <div class="flex items-baseline justify-between gap-2">
            <span class="text-3xl font-bold tracking-wide">{{
              syllable.syllable
            }}</span>
            <span class="text-2xl" :title="syllable.toneLabel">{{
              syllable.toneArrow
            }}</span>
          </div>

          <p class="kr-text-faded-xs mt-2 leading-relaxed">
            Starts with
            <b class="font-mono">{{ syllable.initial || 'no consonant' }}</b
            >, rides on <b class="font-mono">{{ syllable.final }}</b
            >, tone <b>{{ syllable.spokenTone }}</b> — {{ syllable.toneShape }}.
          </p>

          <p
            v-if="syllable.sandhiNote"
            class="mt-2 rounded-lg border border-warning/35 bg-warning/10 p-2 text-xs leading-relaxed"
          >
            <b
              >Written {{ syllable.lexicalTone }}, said
              {{ syllable.spokenTone }}.</b
            >
            {{ syllable.sandhiNote }}
          </p>
        </div>
      </div>

      <button
        type="button"
        class="kr-btn-outline-md mx-auto mt-4 flex"
        @click="$emit('speak')"
      >
        <Icon name="kind-icon:volume" class="kr-icon-4" />
        Hear it again
      </button>
    </template>

    <!-- WHAT IT'S BUILT FROM ----------------------------------------------- -->
    <template v-else-if="beat === 'pieces' && lesson">
      <p class="kr-text-eyebrow-bold text-primary">
        What {{ lesson.simplified }} is built from
      </p>
      <p class="kr-text-faded-xs mt-1 leading-relaxed">{{ lesson.summary }}</p>

      <div class="mt-4 space-y-3">
        <div
          v-for="entry in teachingCharacters"
          :key="entry.character"
          class="kr-panel-flat p-3"
        >
          <span class="text-4xl leading-none font-semibold">{{
            entry.character
          }}</span>

          <div class="mt-3 space-y-2">
            <div
              v-for="component in entry.components"
              :key="`${component.glyph}:${component.role}`"
              class="rounded-xl border p-3"
              :class="roleTint(component.role)"
            >
              <div class="flex items-start gap-3">
                <span class="text-3xl leading-none font-semibold">{{
                  component.glyph
                }}</span>
                <div class="min-w-0">
                  <p class="kr-text-eyebrow-bold">
                    {{ roleLabel(component.role) }}
                  </p>
                  <p class="mt-1 text-sm leading-relaxed">
                    {{ component.contribution }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Dictionary radicals and unexplained written parts are reference facts, not
           lessons, so they get one muted line instead of a block each. Giving them equal
           weight is what made 的's screen read as four ways of saying nothing. -->
      <p
        v-if="referenceNotes.length"
        class="kr-text-dim-xs-45 mt-3 leading-relaxed"
      >
        {{ referenceNotes.join(' · ') }}
      </p>
    </template>

    <!-- SOUND FAMILY -------------------------------------------------------- -->
    <template v-else-if="beat === 'family' && lesson">
      <p class="kr-text-eyebrow-bold text-primary">Built on the same sound</p>

      <div
        v-for="family in lesson.soundFamilies"
        :key="family.phonetic"
        class="mt-3"
      >
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-4xl leading-none font-semibold">{{
            family.phonetic
          }}</span>
          <span class="kr-text-semibold-sm">
            also builds {{ family.members.length }}
            {{ family.members.length === 1 ? 'other word' : 'other words' }} you
            can study here
          </span>
          <span v-if="family.drifted" class="kr-badge-warning-xs"
            >readings have drifted</span
          >
        </div>

        <p v-if="family.drifted" class="kr-text-faded-xs mt-2 leading-relaxed">
          These share a sound component but no longer share a reading ({{
            family.readings.join(', ')
          }}). That is history showing through, not an error — the component
          records how the character sounded when it was coined.
        </p>

        <div
          class="mt-3 grid gap-2 grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))]"
        >
          <div
            v-for="member in family.members.slice(0, 8)"
            :key="member.key"
            class="kr-panel-compact-xs"
          >
            <span class="text-2xl font-semibold">{{ member.simplified }}</span>
            <span class="ml-2 text-xs opacity-65">{{ member.pinyin }}</span>
            <span class="mt-1 block truncate text-xs opacity-70">{{
              member.meaning
            }}</span>
          </div>
        </div>
      </div>
    </template>

    <!-- RECALL --------------------------------------------------------------- -->
    <template v-else-if="beat === 'recall' && lesson">
      <p class="kr-text-eyebrow-bold text-primary">
        {{ isReview ? 'Do you still have it?' : 'Now recall it' }}
      </p>

      <div v-if="!revealed" class="py-8 text-center">
        <p class="text-7xl leading-none font-semibold">
          {{ lesson.simplified }}
        </p>
        <p class="kr-text-faded-sm mt-5">
          Say it out loud, with the tone, before you reveal.
        </p>
        <button
          type="button"
          class="kr-btn-primary-md-plain mt-4"
          @click="$emit('reveal')"
        >
          Reveal
        </button>
      </div>

      <div v-else class="space-y-4">
        <div class="py-4 text-center">
          <p class="text-6xl leading-none font-semibold">
            {{ lesson.simplified }}
          </p>
          <p class="kr-text-bold-2xl mt-3 tracking-wide">{{ lesson.pinyin }}</p>
          <p class="mt-1 text-xl font-semibold">{{ lesson.meaning }}</p>
        </div>

        <p class="kr-text-faded-xs text-center">
          How did that go? Answer honestly — it sets when you see this next.
        </p>

        <!-- Container-width, not viewport-width: this is a shared component and can be
             embedded in a host narrower than its own breakpoint implies (layout contract
             rule 8, verifyLayoutContract.ts). The four rating buttons wrap to two rows in a
             narrow pane and sit on one row when there is room. -->
        <div
          class="grid gap-2 grid-cols-[repeat(auto-fit,minmax(min(50%-0.25rem,7rem),1fr))]"
        >
          <button
            type="button"
            class="btn btn-sm btn-outline btn-error"
            @click="$emit('rate', 'again')"
          >
            Again
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline btn-warning"
            @click="$emit('rate', 'hard')"
          >
            Hard
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline btn-success"
            @click="$emit('rate', 'good')"
          >
            Good
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline btn-accent"
            @click="$emit('rate', 'easy')"
          >
            Easy
          </button>
        </div>
      </div>
    </template>

    <!-- SESSION END ---------------------------------------------------------- -->
    <template v-else-if="step.kind === 'done'">
      <p class="kr-text-eyebrow-bold text-primary">Session complete</p>
      <h2 class="kr-text-black-xl mt-1">That's the set.</h2>
      <p class="mt-3 leading-relaxed">
        Everything you read is saved, and the words you recalled are scheduled
        to come back when they are actually due. Carry on now or come back
        whenever — nothing here expires and nothing will chase you.
      </p>
    </template>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MandarinComponentRole } from '@/utils/mandarin'
import { isTeachingRole, type MandarinLesson } from '@/utils/mandarinLesson'
import type { MandarinCourseStep } from '@/utils/mandarinCourse'

const props = defineProps<{
  step: MandarinCourseStep
  /** Null only for intro/done steps, which carry no word. */
  lesson: MandarinLesson | null
  revealed: boolean
  /** True when this word's run is a single recall beat, i.e. a review rather than a first meeting. */
  isReview: boolean
  artUrl: string
}>()

defineEmits<{
  reveal: []
  rate: [rating: 'again' | 'hard' | 'good' | 'easy']
  speak: []
  'art-error': [cardKey: string]
}>()

const beat = computed(() =>
  props.step.kind === 'word' ? props.step.beat : null,
)

/**
 * Characters with something the source actually gives a job to.
 *
 * A mixed word (电脑, where only 脑 decomposes) drops the silent half rather than
 * rendering it as a bare glyph, and a character whose only pieces are a dictionary
 * radical and an unexplained stroke group drops out entirely -- those move to
 * `referenceNotes` below.
 */
const teachingCharacters = computed(() =>
  (props.lesson?.characters ?? [])
    .map((entry) => ({
      ...entry,
      components: entry.components.filter((component) =>
        isTeachingRole(component.role),
      ),
    }))
    .filter((entry) => entry.components.length > 0),
)

/** Radicals and unexplained written parts, as one muted line rather than a block each. */
const referenceNotes = computed(() => {
  const notes: string[] = []
  for (const entry of props.lesson?.characters ?? []) {
    for (const component of entry.components) {
      if (isTeachingRole(component.role)) continue
      if (component.role === 'uncertain') continue
      if (!notes.includes(component.contribution)) {
        notes.push(component.contribution)
      }
    }
  }
  return notes
})

const ROLE_LABELS: Record<MandarinComponentRole, string> = {
  semantic: 'Meaning component',
  phonetic: 'Sound component',
  radical: 'Dictionary radical',
  form: 'Written component',
  uncertain: 'Unresolved',
}

function roleLabel(role: MandarinComponentRole): string {
  return ROLE_LABELS[role] ?? 'Component'
}

const ROLE_TINTS: Record<MandarinComponentRole, string> = {
  semantic: 'border-success/35 bg-success/8',
  phonetic: 'border-info/35 bg-info/8',
  radical: 'border-base-300 bg-base-200/35',
  form: 'border-base-300 bg-base-100',
  uncertain: 'border-warning/35 bg-warning/8',
}

function roleTint(role: MandarinComponentRole): string {
  return ROLE_TINTS[role] ?? 'border-base-300 bg-base-100'
}
</script>
