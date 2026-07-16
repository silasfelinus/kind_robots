<!-- /components/academy/academy-style-detail.vue -->
<template>
  <article
    class="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-4"
  >
    <header class="flex flex-wrap items-start justify-between gap-2">
      <div class="flex min-w-0 flex-col gap-1">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-2xl leading-none">🏛️</span>
          <h3 class="text-lg font-black text-base-content">
            {{ lesson.name }}
          </h3>
          <span class="badge badge-primary badge-sm font-bold">
            {{ lesson.era }}
          </span>
          <span class="badge badge-ghost badge-sm">{{ lesson.region }}</span>
        </div>
        <p
          v-if="isViewed"
          class="flex items-center gap-1 text-xs font-semibold text-success"
        >
          <Icon name="kind-icon:check" class="h-3.5 w-3.5" />
          Lesson explored
        </p>
      </div>

      <button
        v-if="showClose"
        type="button"
        class="btn btn-circle btn-ghost btn-sm"
        title="Close lesson"
        @click="emit('close')"
      >
        <Icon name="mdi:close" class="h-4 w-4" />
      </button>
    </header>

    <p class="text-sm leading-relaxed text-base-content/80">
      {{ lesson.keyIdeas }}
    </p>

    <div class="rounded-xl border border-base-300 bg-base-200/60 p-3">
      <p
        class="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-base-content/60"
      >
        <Icon name="kind-icon:search" class="h-3.5 w-3.5" />
        How to spot it
      </p>
      <ul class="flex flex-col gap-1.5">
        <li
          v-for="cue in lesson.recognitionCues"
          :key="cue"
          class="flex items-start gap-2 text-sm text-base-content/80"
        >
          <span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          {{ cue }}
        </li>
      </ul>
    </div>

    <div class="flex flex-col gap-2">
      <p
        class="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-base-content/60"
      >
        <Icon name="kind-icon:user" class="h-3.5 w-3.5" />
        Meet the masters
      </p>
      <div class="grid gap-2 sm:grid-cols-2">
        <div
          v-for="artist in lesson.artists"
          :key="artist.name"
          class="rounded-xl border border-base-300 bg-base-200/40 px-3 py-2"
        >
          <p class="text-sm font-bold text-base-content">
            {{ artist.name }}
            <span class="ml-1 text-xs font-normal text-base-content/50">
              {{ artist.years }}
            </span>
          </p>
          <p class="text-xs leading-relaxed text-base-content/70">
            {{ artist.note }}
          </p>
        </div>
      </div>
    </div>

    <div class="rounded-xl border border-base-300 bg-base-200/60 p-3">
      <p
        class="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-base-content/60"
      >
        <Icon name="kind-icon:flask" class="h-3.5 w-3.5" />
        Try it
      </p>
      <p class="mb-2 text-sm leading-relaxed text-base-content/80">
        {{ lesson.remix.template }}
      </p>
      <p class="mb-1 text-xs font-bold text-base-content/70">What to expect</p>
      <p class="mb-2 text-xs leading-relaxed text-base-content/60">
        The remix should keep hold of the cues above — especially
        {{ lesson.recognitionCues[0]?.toLowerCase() }}. If it just looks like a
        generic old painting, the style didn't fully take.
      </p>
      <p class="mb-1 text-xs font-bold text-base-content/70">
        {{ tryItFailureLabel }}
      </p>
      <p class="mb-2 text-xs leading-relaxed text-base-content/60">
        {{ tryItFailureNote }}
      </p>
      <p
        class="flex items-start gap-1.5 text-xs leading-relaxed text-base-content/60"
      >
        <Icon
          name="kind-icon:refresh"
          class="mt-0.5 h-3.5 w-3.5 shrink-0 text-base-content/40"
        />
        Not quite right? Try a different starter image, tweak the instruction
        above, or adjust the style strength — then remix again.
      </p>
    </div>

    <div class="rounded-xl border border-base-300 bg-base-200/60 p-3">
      <p
        class="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-base-content/60"
      >
        <Icon name="kind-icon:chat" class="h-3.5 w-3.5" />
        Reflect
      </p>
      <ul class="flex flex-col gap-1.5">
        <li
          v-for="prompt in reflectPrompts"
          :key="prompt"
          class="flex items-start gap-2 text-sm text-base-content/80"
        >
          <Icon
            name="kind-icon:question"
            class="mt-0.5 h-3.5 w-3.5 shrink-0 text-base-content/40"
          />
          {{ prompt }}
        </li>
      </ul>
    </div>

    <footer v-if="showRemixButton" class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="btn btn-primary flex-1 rounded-2xl font-black shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:shadow-primary/30 active:translate-y-0"
        @click="emit('remix', lesson.slug)"
      >
        <Icon name="kind-icon:magic" class="h-5 w-5" />
        Remix an image in {{ lesson.name }}
      </button>
    </footer>
  </article>
</template>

<script setup lang="ts">
// Reused in three contexts, each passing a different showClose/showRemixButton
// subset — check all three before changing a prop's default or meaning:
//   - academy-timeline.vue: default props (close+remix shown), expanded list item
//   - academy-styles-browser.vue: default props (close+remix shown), grid detail panel
//   - academy-remix.vue: showClose=false, showRemixButton=false — read-only style
//     summary in the Remix Studio sidebar, where remixing is already the page's
//     primary action (a stray showRemixButton no-op button here was PR #301's bug)
import { computed, onMounted } from 'vue'
import { useAcademyStore } from '@/stores/academyStore'
import type { AcademyStyle } from '@/stores/seeds/academyStyles'

const props = withDefaults(
  defineProps<{
    lesson: AcademyStyle
    showClose?: boolean
    showRemixButton?: boolean
  }>(),
  { showClose: true, showRemixButton: true },
)

const emit = defineEmits<{
  remix: [styleSlug: string]
  close: []
}>()

const academyStore = useAcademyStore()

const isViewed = computed(() => {
  return academyStore.viewedLessons.includes(props.lesson.slug)
})

// Per-style failure-mode text (ai-art-academy/t-025, backfilled from
// conductor's docs/teaching-notes.md §3). Falls back to the original
// mode-level generic note for any style not yet backfilled (e.g. a
// newly-added movement whose teaching notes haven't landed here yet).
const tryItFailureLabel = computed(() => 'Watch for:')

const tryItFailureFallbackNote = computed(() => {
  return props.lesson.remix.mode === 'lora'
    ? 'The style overpowering your subject — LoRA-driven styles can be heavy-handed, so if your subject gets lost, lower the style strength a notch.'
    : 'Under-cooking into a generic "old painting" look — prompt-driven styles lean on the instruction above doing the work, so if the result feels too subtle, make the instruction more specific.'
})

const tryItFailureNote = computed(() => {
  return props.lesson.failureMode ?? tryItFailureFallbackNote.value
})

const reflectPrompts = computed(() => {
  const name = props.lesson.name
  return [
    `Which cue from "How to spot it" survived best in your remix? Which one got lost?`,
    `Does the result feel like ${name}, or just "an old painting"? What's missing?`,
    `If you remixed again, what's the one thing you'd change?`,
  ]
})

onMounted(() => {
  academyStore.markLessonViewed(props.lesson.slug)
})
</script>
