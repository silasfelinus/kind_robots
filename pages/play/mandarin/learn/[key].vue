<!-- /pages/play/mandarin/learn/[key].vue
     mandarin-tutor/t-022: the tutorial page for one word.

     Silas's reopening request: "I want a tutorial page for each of the words that we
     teach ... the instruction that shows the pinyin plus what each aspect represents,
     with historical info." This is that page, and it is deliberately ordered the way a
     person learns rather than the way the data is shaped: how it sounds, what it is
     built from, who else is built the same way, where the form came from -- and only
     then a button into the flashcard.

     Read-only and unauthenticated, backed by GET /api/mandarin/lessons/[key], which is
     derived entirely from the pinned public catalog. Lesson completion, points, and the
     soft study gate are mandarin-tutor/t-023 and are not wired here.

     Nothing on this page asserts a claim the pinned source did not make. Where the
     source is silent, utils/mandarinLesson.ts writes an explicit no-claim sentence and
     this page renders it as-is -- an honest gap teaches an academic learner more than a
     confident folk etymology. -->
<template>
  <main class="kr-surface bg-base-200/40">
    <div
      class="kr-scroll kr-container max-w-5xl space-y-4 px-3 py-4 sm:px-5 sm:py-6"
    >
      <nav class="flex flex-wrap items-center gap-2">
        <NuxtLink to="/play/mandarin" class="kr-btn-ghost">
          <Icon name="kind-icon:arrow-left" class="kr-icon-4" />
          Mandarin Tutor
        </NuxtLink>
      </nav>

      <div
        v-if="pending && !lesson"
        class="grid min-h-[50vh] place-items-center kr-panel-flat rounded-3xl"
      >
        <div class="text-center">
          <span class="loading loading-ring loading-lg text-primary" />
          <p class="kr-text-bold-sm mt-3 text-base-content/55">
            Building the lesson…
          </p>
        </div>
      </div>

      <div
        v-else-if="errorMessage"
        class="rounded-3xl border border-error/30 bg-error/10 p-8 text-center"
        role="alert"
      >
        <Icon name="kind-icon:warning" class="mx-auto size-10 text-error" />
        <p class="kr-text-black-xl mt-3">No lesson for this card</p>
        <p class="mt-2 text-sm text-base-content/65">{{ errorMessage }}</p>
        <NuxtLink to="/play/mandarin" class="kr-btn-primary-md-plain mt-4">
          Back to the catalog
        </NuxtLink>
      </div>

      <template v-else-if="lesson">
        <!-- 1. The word itself -------------------------------------------->
        <header class="kr-panel-section-plain shadow-lg">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="min-w-0">
              <p class="text-6xl leading-none font-semibold sm:text-7xl">
                {{ lesson.simplified }}
              </p>
              <p class="kr-text-bold-2xl mt-2 tracking-wide">
                {{ lesson.pinyin }}
              </p>
              <p class="mt-1 text-xl font-semibold">{{ lesson.meaning }}</p>
              <p
                v-if="lesson.meanings.length > 1"
                class="kr-text-faded-sm mt-1 leading-relaxed"
              >
                {{ lesson.meanings.slice(1).join(' · ') }}
              </p>
              <p v-if="lesson.traditional" class="kr-text-dim-xs-55 mt-2">
                Traditional form: {{ lesson.traditional }}
              </p>
            </div>

            <div class="flex flex-col items-end gap-2">
              <div class="flex flex-wrap justify-end gap-1">
                <span v-if="lesson.hskLevel" class="kr-badge-outline-sm">
                  HSK {{ lesson.hskLevel }}
                </span>
                <span
                  class="kr-badge-sm"
                  :class="
                    lesson.teachability === 'structural'
                      ? 'badge-success badge-outline'
                      : 'badge-ghost'
                  "
                >
                  {{
                    lesson.teachability === 'structural'
                      ? 'Has a structural story'
                      : 'Learn as vocabulary'
                  }}
                </span>
              </div>
              <button type="button" class="kr-btn-outline-md" @click="speak">
                <Icon name="kind-icon:volume" class="kr-icon-4" />
                Hear it
              </button>
            </div>
          </div>

          <p class="kr-panel-divider text-sm leading-relaxed">
            {{ lesson.summary }}
          </p>

          <div
            v-if="lesson.categories.length"
            class="mt-2 flex flex-wrap gap-1"
          >
            <span
              v-for="category in lesson.categories.slice(0, 6)"
              :key="category"
              class="kr-badge-ghost-xs"
            >
              {{ category }}
            </span>
          </div>
        </header>

        <!-- 2. How it sounds ---------------------------------------------->
        <section class="kr-panel-section-flat">
          <h2 class="kr-text-bold-lg">How it sounds</h2>
          <p class="kr-text-faded-xs mt-1">
            One row per syllable: the consonant it starts with, the vowel it
            rides on, and the shape of its tone.
          </p>

          <div
            class="mt-3 grid gap-2 grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))]"
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

              <dl class="mt-2 space-y-1 text-sm">
                <div class="flex justify-between gap-2">
                  <dt class="opacity-60">Initial</dt>
                  <dd class="font-mono font-semibold">
                    {{ syllable.initial || '—' }}
                  </dd>
                </div>
                <div class="flex justify-between gap-2">
                  <dt class="opacity-60">Final</dt>
                  <dd class="font-mono font-semibold">{{ syllable.final }}</dd>
                </div>
                <div class="flex justify-between gap-2">
                  <dt class="opacity-60">Tone</dt>
                  <dd class="font-semibold">{{ syllable.spokenTone }}</dd>
                </div>
              </dl>

              <p class="kr-text-faded-xs mt-2 leading-relaxed">
                {{ syllable.toneShape }}
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
        </section>

        <!-- 3. What each piece does --------------------------------------->
        <section class="kr-panel-section-flat">
          <h2 class="kr-text-bold-lg">What each piece does</h2>
          <p class="kr-text-faded-xs mt-1">
            A character is not a picture of its meaning. Most are built from one
            piece that points at the meaning and one that points at the sound —
            and this page says which is which, or says plainly when the source
            does not know.
          </p>

          <div class="mt-3 space-y-3">
            <article
              v-for="entry in lesson.characters"
              :key="entry.character"
              class="kr-panel-flat p-3"
            >
              <div class="flex flex-wrap items-center gap-3">
                <span class="text-4xl leading-none font-semibold">{{
                  entry.character
                }}</span>
                <span
                  v-if="!entry.hasAssertedStructure"
                  class="kr-badge-ghost-xs"
                >
                  no role asserted by the source
                </span>
              </div>

              <div v-if="entry.components.length" class="mt-3 space-y-2">
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
                      <p
                        v-if="component.note"
                        class="kr-text-faded-xs mt-2 leading-relaxed"
                      >
                        {{ component.note }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <p v-else class="kr-text-faded-sm mt-2">
                The pinned source supplies no decomposition for
                {{ entry.character }}, so this lesson does not take it apart.
              </p>
            </article>
          </div>
        </section>

        <!-- 4. Sound families --------------------------------------------->
        <section
          v-if="lesson.soundFamilies.length"
          class="kr-panel-section-flat"
        >
          <h2 class="kr-text-bold-lg">Built on the same sound</h2>
          <p class="kr-text-faded-xs mt-1">
            The sound component is reused across many characters. Learning the
            family together is usually faster than learning its members one at a
            time — and it is the clearest view of how the writing system
            actually works.
          </p>

          <div
            v-for="family in lesson.soundFamilies"
            :key="family.phonetic"
            class="mt-3"
          >
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-3xl leading-none font-semibold">{{
                family.phonetic
              }}</span>
              <span class="kr-text-semibold-sm">
                also builds {{ family.members.length }}
                {{ family.members.length === 1 ? 'other card' : 'other cards' }}
                in the catalog
              </span>
              <span v-if="family.drifted" class="kr-badge-warning-xs">
                readings have drifted apart
              </span>
            </div>

            <p
              v-if="family.drifted"
              class="kr-text-faded-xs mt-1 leading-relaxed"
            >
              These share a sound component but no longer share a reading ({{
                family.readings.join(', ')
              }}). That is history showing through, not an error: the component
              records how the character sounded when it was coined.
            </p>

            <div
              class="mt-2 grid gap-2 grid-cols-[repeat(auto-fit,minmax(min(100%,11rem),1fr))]"
            >
              <NuxtLink
                v-for="member in family.members"
                :key="member.key"
                :to="lessonLink(member.key)"
                class="kr-panel-compact-xs transition hover:border-accent"
              >
                <span class="text-2xl font-semibold">{{
                  member.simplified
                }}</span>
                <span class="ml-2 text-xs opacity-65">{{ member.pinyin }}</span>
                <span class="mt-1 block truncate text-xs opacity-70">{{
                  member.meaning
                }}</span>
              </NuxtLink>
            </div>
          </div>
        </section>

        <!-- 5. Homophones -------------------------------------------------->
        <section
          v-if="
            lesson.homophones &&
            (lesson.homophones.exact.length ||
              lesson.homophones.toneVariants.length)
          "
          class="kr-panel-section-flat"
        >
          <h2 class="kr-text-bold-lg">Sounds the same, means something else</h2>
          <p class="kr-text-faded-xs mt-1">
            Different words that share this reading. These are a separate
            phenomenon from the sound families above — a shared reading is a
            coincidence of modern pronunciation, not evidence that two
            characters are related.
          </p>

          <div class="mt-3 space-y-3">
            <div v-if="lesson.homophones.exact.length">
              <p class="kr-text-eyebrow-bold">Identical reading and tones</p>
              <div
                class="mt-2 grid gap-2 grid-cols-[repeat(auto-fit,minmax(min(100%,11rem),1fr))]"
              >
                <NuxtLink
                  v-for="entry in lesson.homophones.exact"
                  :key="entry.key"
                  :to="lessonLink(entry.key)"
                  class="kr-panel-compact-xs transition hover:border-accent"
                >
                  <span class="text-2xl font-semibold">{{
                    entry.simplified
                  }}</span>
                  <span class="ml-2 text-xs opacity-65">{{
                    entry.pinyin
                  }}</span>
                  <span class="mt-1 block truncate text-xs opacity-70">{{
                    entry.meaning
                  }}</span>
                </NuxtLink>
              </div>
            </div>

            <div v-if="lesson.homophones.toneVariants.length">
              <p class="kr-text-eyebrow-bold">
                Same syllables, different tones
              </p>
              <p class="kr-text-faded-xs mt-1">
                These are the pairs that actually get confused in speech.
              </p>
              <div
                class="mt-2 grid gap-2 grid-cols-[repeat(auto-fit,minmax(min(100%,11rem),1fr))]"
              >
                <NuxtLink
                  v-for="entry in lesson.homophones.toneVariants"
                  :key="entry.key"
                  :to="lessonLink(entry.key)"
                  class="kr-panel-compact-xs transition hover:border-accent"
                >
                  <span class="text-2xl font-semibold">{{
                    entry.simplified
                  }}</span>
                  <span class="ml-2 text-xs opacity-65">{{
                    entry.pinyin
                  }}</span>
                  <span class="mt-1 block truncate text-xs opacity-70">{{
                    entry.meaning
                  }}</span>
                </NuxtLink>
              </div>
            </div>
          </div>
        </section>

        <!-- 6. History ----------------------------------------------------->
        <section class="kr-panel-section-flat">
          <h2 class="kr-text-bold-lg">Where the written form comes from</h2>
          <p class="mt-2 text-sm leading-relaxed">{{ lesson.history }}</p>
          <p class="kr-text-dim-xs-45 mt-3">
            Source: {{ lesson.source.label }} · {{ lesson.source.version }}
          </p>
          <p v-if="lesson.source.licenseNote" class="kr-text-dim-xs-40 mt-1">
            {{ lesson.source.licenseNote }}
          </p>
        </section>

        <!-- 7. Into the flashcard ------------------------------------------>
        <section class="kr-panel-section-plain shadow-lg">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="kr-text-bold-lg">Ready to drill it?</p>
              <p class="kr-text-faded-xs mt-1">
                The flashcard is for retrieval. This page is for understanding —
                come back to it whenever the card stops making sense.
              </p>
              <p
                v-if="completionNotice"
                class="mt-2 text-sm font-semibold text-success"
              >
                {{ completionNotice }}
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <!-- mandarin-tutor/t-023: marking the lesson read is what moves this card
                   forward in the study queue and pays the one-time lesson point. The
                   server decides whether anything is actually awarded, so pressing it
                   twice is harmless and pays nothing the second time. -->
              <button
                v-if="!lessonAlreadyRead"
                type="button"
                class="kr-btn-outline-md"
                :disabled="completing"
                @click="markRead"
              >
                <span v-if="completing" class="kr-spinner-xs" />
                {{ completing ? 'Saving…' : 'I have read this' }}
              </button>
              <span v-else class="kr-badge-success-sm">Lesson read</span>

              <NuxtLink :to="studyLink" class="kr-btn-primary-md-plain">
                Study {{ lesson.simplified }}
                <Icon name="kind-icon:forward" class="kr-icon-4" />
              </NuxtLink>
            </div>
          </div>
        </section>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { performFetch } from '@/stores/utils'
import { useMandarinTutorStore } from '@/stores/mandarinTutorStore'
import type { MandarinComponentRole } from '@/utils/mandarin'
import type { MandarinLesson } from '@/utils/mandarinLesson'

const route = useRoute()
const store = useMandarinTutorStore()

const cardKey = computed(() => String(route.params.key || '').trim())

const lesson = ref<MandarinLesson | null>(null)
const pending = ref(false)
const errorMessage = ref('')
// Clicking quickly through two sound-family members leaves two requests in flight, and
// the slower one must not overwrite the newer lesson. Same sequence guard
// pages/play/aquarium/browse/[username]/[slug].vue uses.
let requestSequence = 0

async function loadLesson(): Promise<void> {
  if (!cardKey.value) return

  const sequence = ++requestSequence
  pending.value = true
  errorMessage.value = ''

  try {
    const response = await performFetch<{ lesson: MandarinLesson }>(
      `/api/mandarin/lessons/${encodeURIComponent(cardKey.value)}`,
    )

    if (sequence !== requestSequence) return

    if (!response.success || !response.data?.lesson) {
      throw new Error(response.message || 'The lesson could not be loaded.')
    }

    lesson.value = response.data.lesson
  } catch (cause: unknown) {
    if (sequence !== requestSequence) return
    lesson.value = null
    errorMessage.value =
      cause instanceof Error ? cause.message : 'The lesson could not be loaded.'
  } finally {
    if (sequence === requestSequence) pending.value = false
  }
}

watch(cardKey, loadLesson)
onMounted(loadLesson)

function lessonLink(key: string): string {
  return `/play/mandarin/learn/${encodeURIComponent(key)}`
}

// mandarin-tutor/t-023: lesson completion and the one-time point.
const completing = ref(false)
const completionNotice = ref('')

const lessonAlreadyRead = computed(() => store.lessonIsComplete(cardKey.value))

async function markRead() {
  if (completing.value || !cardKey.value) return
  completing.value = true
  completionNotice.value = ''
  try {
    const awarded = await store.completeLesson(cardKey.value)
    completionNotice.value = awarded
      ? `+${awarded} points. ${lesson.value?.simplified ?? 'This card'} moves up your study queue.`
      : 'Recorded.'
  } finally {
    completing.value = false
  }
}

// The store owns which lessons are complete, but this page can be the first thing a
// learner opens (a shared link, a bookmark), in which case nothing has loaded it yet.
onMounted(() => {
  void store.loadPoints()
})

// Clear the previous card's notice when navigating to another lesson.
watch(cardKey, () => {
  completionNotice.value = ''
})

// The tutor page already focuses a single card by key via ?card= -- reuse that rather
// than inventing a second deep-link contract for the same thing.
const studyLink = computed(
  () => `/play/mandarin?card=${encodeURIComponent(cardKey.value)}`,
)

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

// Deliberately the browser's own synthesis rather than the tutor store's durable
// MandarinAudioAsset pipeline: this page is unauthenticated and cacheable, and
// POST /api/mandarin/audio would both require a session and spend a provider call for a
// reference clip the study loop already synthesizes. A learner who wants the canonical
// audio gets it on the flashcard.
function speak() {
  if (!import.meta.client || !lesson.value) return
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  const utterance = new SpeechSynthesisUtterance(lesson.value.simplified)
  utterance.lang = 'zh-CN'
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

useHead(() => ({
  title: lesson.value
    ? `${lesson.value.simplified} (${lesson.value.pinyin}) — Mandarin Tutor`
    : 'Mandarin Tutor lesson',
}))
</script>
