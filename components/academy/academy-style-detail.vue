<!-- /components/academy/academy-style-detail.vue -->
<template>
  <article class="mx-auto flex w-full max-w-[1500px] flex-col gap-5">
    <section
      v-if="lesson.previewImageSrc"
      class="relative min-h-[320px] overflow-hidden rounded-3xl border border-base-300 bg-base-300 shadow-xl sm:min-h-[400px] lg:min-h-[480px]"
    >
      <img
        :src="lesson.previewImageSrc"
        :alt="`${lesson.name} visual style study`"
        class="absolute inset-0 h-full w-full object-cover"
      />
      <div class="absolute inset-0 bg-linear-to-t from-black/90 via-black/25 to-black/10" />

      <button
        v-if="showClose"
        type="button"
        class="btn btn-circle btn-sm absolute right-4 top-4 z-10 border-white/30 bg-black/35 text-white backdrop-blur hover:bg-black/55"
        title="Close lesson"
        aria-label="Close lesson"
        @click="emit('close')"
      >
        <Icon name="mdi:close" class="h-4 w-4" />
      </button>

      <div class="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-5 text-white sm:p-7 lg:p-9">
        <div class="flex flex-wrap items-center gap-2">
          <span class="badge border-0 bg-primary text-primary-content font-bold">
            {{ lesson.era }}
          </span>
          <span class="badge border-white/25 bg-black/30 text-white backdrop-blur">
            {{ lesson.region }}
          </span>
          <span
            v-if="isViewed"
            class="badge border-0 bg-success text-success-content font-bold"
          >
            <Icon name="kind-icon:check" class="mr-1 h-3.5 w-3.5" />
            Explored
          </span>
        </div>

        <div class="max-w-4xl">
          <p class="mb-2 text-xs font-black uppercase tracking-[0.18em] text-white/65">
            Enter the movement
          </p>
          <h3 class="text-3xl font-black leading-none drop-shadow sm:text-4xl lg:text-5xl">
            {{ lesson.name }}
          </h3>
          <p class="mt-3 line-clamp-3 max-w-3xl text-sm leading-relaxed text-white/85 sm:text-base">
            {{ lesson.keyIdeas }}
          </p>
        </div>

        <div v-if="showRemixButton" class="flex flex-wrap gap-2">
          <button
            type="button"
            class="btn btn-primary rounded-2xl border-0 font-black shadow-lg shadow-black/30"
            @click="emit('remix', lesson.slug)"
          >
            <Icon name="kind-icon:magic" class="h-5 w-5" />
            Remix in {{ lesson.name }}
          </button>
          <a
            v-if="lesson.exampleWorks?.[0]"
            :href="lesson.exampleWorks[0].sourceUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="btn rounded-2xl border-white/30 bg-black/35 text-white backdrop-blur hover:bg-black/55"
          >
            <Icon name="kind-icon:gallery" class="h-4 w-4" />
            View a real work
          </a>
        </div>
      </div>
    </section>

    <header
      v-else
      class="flex flex-wrap items-start justify-between gap-3 rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm"
    >
      <div class="flex min-w-0 flex-col gap-2">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="text-2xl font-black text-base-content">{{ lesson.name }}</h3>
          <span class="badge badge-primary badge-sm font-bold">{{ lesson.era }}</span>
          <span class="badge badge-ghost badge-sm">{{ lesson.region }}</span>
        </div>
        <p class="max-w-3xl text-sm leading-relaxed text-base-content/75">
          {{ lesson.keyIdeas }}
        </p>
      </div>
      <button
        v-if="showClose"
        type="button"
        class="btn btn-circle btn-ghost btn-sm"
        title="Close lesson"
        aria-label="Close lesson"
        @click="emit('close')"
      >
        <Icon name="mdi:close" class="h-4 w-4" />
      </button>
    </header>

    <section
      v-if="lesson.exampleWorks?.length"
      class="rounded-3xl border border-base-300 bg-base-100 p-4 shadow-sm sm:p-5"
    >
      <div class="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p class="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-primary">
            <Icon name="kind-icon:gallery" class="h-4 w-4" />
            Gallery wall
          </p>
          <h4 class="mt-1 text-xl font-black text-base-content">Look before you read</h4>
        </div>
        <p class="max-w-xl text-xs leading-relaxed text-base-content/55">
          These are real historical works with provenance links. Open any image to visit its source collection.
        </p>
      </div>

      <div
        class="grid auto-rows-[170px] gap-3 sm:grid-cols-2 sm:auto-rows-[220px] lg:grid-cols-3"
      >
        <a
          v-for="(work, index) in lesson.exampleWorks"
          :key="work.imageSrc"
          :href="work.sourceUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="group relative overflow-hidden rounded-2xl border border-base-300 bg-base-200 shadow-sm"
          :class="index === 0 && lesson.exampleWorks.length > 1 ? 'sm:row-span-2 lg:col-span-2' : ''"
          :title="`${work.workTitle} — public-domain source page`"
        >
          <img
            :src="work.imageSrc"
            :alt="`${work.workTitle} by ${work.artist}`"
            loading="lazy"
            class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div class="absolute inset-0 bg-linear-to-t from-black/85 via-black/5 to-transparent" />
          <div class="absolute inset-x-0 bottom-0 p-3 text-white sm:p-4">
            <p class="text-sm font-black leading-tight drop-shadow sm:text-base">
              {{ work.workTitle }}
            </p>
            <p class="mt-1 text-xs text-white/75">
              {{ work.artist }} · {{ work.year }}
            </p>
            <p class="mt-0.5 truncate text-[0.65rem] text-white/55">
              {{ work.collection }}
            </p>
          </div>
        </a>
      </div>
    </section>

    <div class="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] xl:items-start">
      <div class="flex min-w-0 flex-col gap-5">
        <section class="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6">
          <p class="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-primary">
            <Icon name="kind-icon:search" class="h-4 w-4" />
            How to spot it
          </p>
          <h4 class="mt-2 text-xl font-black text-base-content">Train your eye</h4>
          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <div
              v-for="(cue, index) in lesson.recognitionCues"
              :key="cue"
              class="flex items-start gap-3 rounded-2xl border border-base-300 bg-base-200/45 p-3"
            >
              <span
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary"
              >
                {{ index + 1 }}
              </span>
              <p class="text-sm leading-relaxed text-base-content/78">{{ cue }}</p>
            </div>
          </div>
        </section>

        <section class="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6">
          <div class="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p class="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-secondary">
                <Icon name="kind-icon:user" class="h-4 w-4" />
                Meet the masters
              </p>
              <h4 class="mt-2 text-xl font-black text-base-content">People behind the movement</h4>
            </div>
            <span class="text-xs text-base-content/45">
              {{ lesson.artists.length }} featured {{ lesson.artists.length === 1 ? 'artist' : 'artists' }}
            </span>
          </div>

          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <div
              v-for="artist in lesson.artists"
              :key="artist.name"
              class="group grid min-h-32 grid-cols-[72px_minmax(0,1fr)] overflow-hidden rounded-2xl border border-base-300 bg-base-200/35"
            >
              <div class="flex items-center justify-center border-r border-base-300 bg-base-200">
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-base-100 shadow-inner">
                  <Icon name="kind-icon:user" class="h-6 w-6 text-base-content/30" aria-hidden="true" />
                </div>
              </div>
              <div class="flex min-w-0 flex-col justify-center p-3">
                <p class="text-base font-black leading-tight text-base-content">
                  {{ artist.name }}
                </p>
                <p class="mt-0.5 text-xs font-semibold text-primary/80">{{ artist.years }}</p>
                <p class="mt-2 line-clamp-3 text-xs leading-relaxed text-base-content/65">
                  {{ artist.note }}
                </p>
              </div>
            </div>
          </div>

          <p class="mt-4 rounded-2xl border border-dashed border-base-300 px-3 py-2 text-xs leading-relaxed text-base-content/50">
            Artist portrait slots are now part of this visual section; the next asset pass can replace the neutral portrait frames with verified public-domain portraits without redesigning the lesson again.
          </p>
        </section>
      </div>

      <aside class="flex min-w-0 flex-col gap-5 xl:sticky xl:top-3">
        <section class="overflow-hidden rounded-3xl border border-primary/25 bg-primary/5 shadow-sm">
          <div class="border-b border-primary/15 bg-primary/10 p-5">
            <p class="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-primary">
              <Icon name="kind-icon:flask" class="h-4 w-4" />
              Try it
            </p>
            <h4 class="mt-2 text-2xl font-black leading-tight text-base-content">
              Turn the lesson into an image
            </h4>
          </div>

          <div class="flex flex-col gap-4 p-5">
            <div>
              <p class="text-xs font-black uppercase tracking-wide text-base-content/45">Remix instruction</p>
              <p class="mt-1 text-sm leading-relaxed text-base-content/80">
                {{ lesson.remix.template }}
              </p>
            </div>

            <div class="rounded-2xl bg-base-100/70 p-3">
              <p class="text-xs font-bold text-base-content/70">What to expect</p>
              <p class="mt-1 text-xs leading-relaxed text-base-content/60">
                The remix should keep hold of the cues above, especially
                {{ lesson.recognitionCues[0]?.toLowerCase() }}. If it just looks like a generic old painting, the style did not fully take.
              </p>
            </div>

            <div class="rounded-2xl bg-base-100/70 p-3">
              <p class="text-xs font-bold text-base-content/70">{{ tryItFailureLabel }}</p>
              <p class="mt-1 text-xs leading-relaxed text-base-content/60">
                {{ tryItFailureNote }}
              </p>
            </div>

            <p class="flex items-start gap-2 text-xs leading-relaxed text-base-content/55">
              <Icon name="kind-icon:refresh" class="mt-0.5 h-4 w-4 shrink-0" />
              Not quite right? Try a different source image, tweak the instruction, or adjust the style strength and remix again.
            </p>

            <button
              v-if="showRemixButton"
              type="button"
              class="btn btn-primary w-full rounded-2xl font-black shadow-lg shadow-primary/20"
              @click="emit('remix', lesson.slug)"
            >
              <Icon name="kind-icon:magic" class="h-5 w-5" />
              Open Remix Studio
            </button>
          </div>
        </section>

        <section class="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <p class="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-base-content/45">
            <Icon name="kind-icon:chat" class="h-4 w-4" />
            Reflect
          </p>
          <h4 class="mt-2 text-lg font-black text-base-content">Look again after you remix</h4>
          <ul class="mt-3 flex flex-col gap-2">
            <li
              v-for="prompt in reflectPrompts"
              :key="prompt"
              class="flex items-start gap-2 rounded-xl bg-base-200/45 p-3 text-sm leading-relaxed text-base-content/75"
            >
              <Icon name="kind-icon:question" class="mt-0.5 h-4 w-4 shrink-0 text-primary/60" />
              {{ prompt }}
            </li>
          </ul>
        </section>
      </aside>
    </div>
  </article>
</template>

<script setup lang="ts">
// Reused in three contexts, each passing a different showClose/showRemixButton
// subset — check all three before changing a prop's default or meaning:
//   - academy-timeline.vue: default props (close+remix shown), expanded list item
//   - academy-styles-browser.vue: default props (close+remix shown), grid detail panel
//   - academy-remix.vue: showClose=false, showRemixButton=false, allowMarkViewed=false
//     — read-only style summary in the Remix Studio sidebar, where remixing is
//     already the page's primary action (a stray showRemixButton no-op button
//     here was PR #301's bug); allowMarkViewed=false stops incidental style
//     preview clicks from inflating the Timeline/Gallery "explored" progress,
//     which is meant to reflect deliberate lesson-reading, not style browsing
import { computed, onMounted } from 'vue'
import { useAcademyStore } from '@/stores/academyStore'
import type { AcademyStyle } from '@/stores/seeds/academyStyles'

const props = withDefaults(
  defineProps<{
    lesson: AcademyStyle
    showClose?: boolean
    showRemixButton?: boolean
    allowMarkViewed?: boolean
  }>(),
  {
    showClose: true,
    showRemixButton: true,
    allowMarkViewed: true,
  },
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
  if (props.allowMarkViewed) {
    academyStore.markLessonViewed(props.lesson.slug)
  }
})
</script>
