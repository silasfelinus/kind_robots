<!-- /components/academy/academy-style-detail.vue -->
<template>
  <article
    class="mx-auto flex w-full flex-col gap-5"
    :class="compact ? 'max-w-none' : 'max-w-[1500px]'"
  >
    <section
      v-if="compact"
      class="overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-sm"
    >
      <div v-if="lesson.previewImageSrc" class="relative aspect-[16/9] overflow-hidden bg-base-200">
        <img
          :src="lesson.previewImageSrc"
          :alt="`${lesson.name} visual style study`"
          class="h-full w-full object-cover"
        />
        <div class="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />
        <div class="absolute inset-x-0 bottom-0 p-4 text-white">
          <p class="kr-text-black-lg leading-tight">{{ lesson.name }}</p>
          <p class="mt-1 text-xs text-white/70">{{ lesson.era }} · {{ lesson.region }}</p>
        </div>
      </div>
      <div class="flex flex-col gap-3 p-4">
        <p class="kr-text-dim-sm-70 line-clamp-4 leading-relaxed">
          {{ lesson.keyIdeas }}
        </p>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="cue in lesson.recognitionCues.slice(0, 3)"
            :key="cue"
            class="badge badge-ghost h-auto max-w-full whitespace-normal py-1 text-left text-[0.65rem] leading-snug"
          >
            {{ cue }}
          </span>
        </div>
      </div>
    </section>

    <section
      v-else-if="lesson.previewImageSrc"
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
        <Icon name="mdi:close" class="kr-icon-4" />
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
            <Icon name="kind-icon:check" class="kr-icon-3-5 mr-1" />
            Explored
          </span>
        </div>

        <div class="max-w-4xl">
          <p class="kr-text-eyebrow mb-2 text-xs tracking-[0.18em] text-white/65">
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
            <Icon name="kind-icon:magic" class="kr-icon-5" />
            Remix in {{ lesson.name }}
          </button>
          <a
            v-if="lesson.exampleWorks?.[0]"
            :href="lesson.exampleWorks[0].sourceUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="btn rounded-2xl border-white/30 bg-black/35 text-white backdrop-blur hover:bg-black/55"
          >
            <Icon name="kind-icon:gallery" class="kr-icon-4" />
            View a real work
          </a>
        </div>
      </div>
    </section>

    <header
      v-else
      class="flex flex-wrap items-start justify-between gap-3 kr-panel-section"
    >
      <div class="flex min-w-0 flex-col gap-2">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="kr-text-black-2xl text-base-content">{{ lesson.name }}</h3>
          <span class="kr-badge-primary-sm font-bold">{{ lesson.era }}</span>
          <span class="kr-badge-ghost-sm">{{ lesson.region }}</span>
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
        <Icon name="mdi:close" class="kr-icon-4" />
      </button>
    </header>

    <section
      v-if="!compact && lesson.exampleWorks?.length"
      class="kr-panel-section p-4 sm:p-5"
    >
      <div class="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p class="kr-text-eyebrow flex items-center gap-1.5 text-xs tracking-[0.16em] text-primary">
            <Icon name="kind-icon:gallery" class="kr-icon-4" />
            Gallery wall
          </p>
          <h4 class="kr-text-black-xl mt-1 text-base-content">Look before you read</h4>
        </div>
        <p class="kr-text-dim-xs-55 max-w-xl leading-relaxed">
          These are real historical works with provenance links. Open any image to visit its source collection.
        </p>
      </div>

      <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] auto-rows-[220px] gap-3">
        <a
          v-for="(work, index) in lesson.exampleWorks"
          :key="work.imageSrc"
          :href="work.sourceUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="group relative overflow-hidden rounded-2xl border border-base-300 bg-base-200 shadow-sm"
          :class="index === 0 && lesson.exampleWorks.length > 1 ? 'row-span-2' : ''"
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
            <p class="kr-text-black-sm leading-tight drop-shadow sm:text-base">
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

    <div
      v-if="!compact"
      class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,24rem),1fr))] items-start gap-5"
    >
      <div class="flex min-w-0 flex-col gap-5">
        <section class="kr-panel-section sm:p-6">
          <p class="kr-text-eyebrow flex items-center gap-1.5 text-xs tracking-[0.16em] text-primary">
            <Icon name="kind-icon:search" class="kr-icon-4" />
            How to spot it
          </p>
          <h4 class="kr-text-black-xl mt-2 text-base-content">Train your eye</h4>
          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <div
              v-for="(cue, index) in lesson.recognitionCues"
              :key="cue"
              class="flex items-start gap-3 rounded-2xl border border-base-300 bg-base-200/45 p-3"
            >
              <span
                class="kr-icon-primary-7 kr-text-black-xs flex shrink-0 items-center justify-center rounded-full bg-primary/10"
              >
                {{ index + 1 }}
              </span>
              <p class="text-sm leading-relaxed text-base-content/78">{{ cue }}</p>
            </div>
          </div>
        </section>

        <section class="kr-panel-section sm:p-6">
          <div class="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p class="kr-text-eyebrow flex items-center gap-1.5 text-xs tracking-[0.16em] text-secondary">
                <Icon name="kind-icon:user" class="kr-icon-4" />
                Meet the masters
              </p>
              <h4 class="kr-text-black-xl mt-2 text-base-content">People behind the movement</h4>
            </div>
            <span class="kr-text-dim-xs-45">
              {{ lesson.artists.length }} featured {{ lesson.artists.length === 1 ? 'artist' : 'artists' }}
            </span>
          </div>

          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <div
              v-for="artist in lesson.artists"
              :key="artist.name"
              class="group grid min-h-32 grid-cols-[72px_minmax(0,1fr)] overflow-hidden rounded-2xl border border-base-300 bg-base-200/35"
            >
              <a
                v-if="artist.portrait"
                :href="artist.portrait.sourceUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center justify-center overflow-hidden border-r border-base-300 bg-base-200"
                :title="`${artist.portrait.workTitle} — public-domain source page`"
              >
                <img
                  :src="artist.portrait.imageSrc"
                  :alt="artistPortraitAlt(artist)"
                  loading="lazy"
                  class="h-full w-full object-cover"
                />
              </a>
              <div
                v-else
                class="flex items-center justify-center border-r border-base-300 bg-base-200"
              >
                <div class="kr-text-black-xl flex h-12 w-12 items-center justify-center rounded-full bg-base-100 text-base-content/30 shadow-inner" aria-hidden="true">
                  {{ artist.name.slice(0, 1) }}
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
                <p v-if="artist.portrait" class="mt-1.5 truncate text-[0.65rem] text-base-content/45">
                  {{ artist.portrait.workTitle }} · {{ artist.portrait.collection }}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <aside class="flex min-w-0 flex-col gap-5 xl:sticky xl:top-3">
        <section class="overflow-hidden rounded-3xl border border-primary/25 bg-primary/5 shadow-sm">
          <div class="border-b border-primary/15 bg-primary/10 p-5">
            <p class="kr-text-eyebrow flex items-center gap-1.5 text-xs tracking-[0.16em] text-primary">
              <Icon name="kind-icon:flask" class="kr-icon-4" />
              Try it
            </p>
            <h4 class="kr-text-black-2xl mt-2 leading-tight text-base-content">
              Turn the lesson into an image
            </h4>
          </div>

          <div class="flex flex-col gap-4 p-5">
            <div>
              <p class="kr-text-eyebrow kr-text-dim-xs-45 tracking-wide">Remix instruction</p>
              <p class="mt-1 text-sm leading-relaxed text-base-content/80">
                {{ lesson.remix.template }}
              </p>
            </div>

            <div class="rounded-2xl bg-base-100/70 p-3">
              <p class="kr-text-dim-xs-70 font-bold">What to expect</p>
              <p class="kr-text-dim-xs-60 mt-1 leading-relaxed">
                The remix should keep hold of the cues above, especially
                {{ lesson.recognitionCues[0]?.toLowerCase() }}. If it just looks like a generic old painting, the style did not fully take.
              </p>
            </div>

            <div class="rounded-2xl bg-base-100/70 p-3">
              <p class="kr-text-dim-xs-70 font-bold">{{ tryItFailureLabel }}</p>
              <p class="kr-text-dim-xs-60 mt-1 leading-relaxed">
                {{ tryItFailureNote }}
              </p>
            </div>

            <p class="kr-text-dim-xs-55 flex items-start gap-2 leading-relaxed">
              <Icon name="kind-icon:refresh" class="kr-icon-4 mt-0.5 shrink-0" />
              Not quite right? Try a different source image, tweak the instruction, or adjust the style strength and remix again.
            </p>

            <button
              v-if="showRemixButton"
              type="button"
              class="btn btn-primary w-full rounded-2xl font-black shadow-lg shadow-primary/20"
              @click="emit('remix', lesson.slug)"
            >
              <Icon name="kind-icon:magic" class="kr-icon-5" />
              Open Remix Studio
            </button>
          </div>
        </section>

        <section class="kr-panel-section">
          <p class="kr-text-eyebrow kr-text-dim-xs-45 flex items-center gap-1.5 tracking-[0.16em]">
            <Icon name="kind-icon:chat" class="kr-icon-4" />
            Reflect
          </p>
          <h4 class="kr-text-black-lg mt-2 text-base-content">Look again after you remix</h4>
          <ul class="mt-3 flex flex-col gap-2">
            <li
              v-for="prompt in reflectPrompts"
              :key="prompt"
              class="flex items-start gap-2 rounded-xl bg-base-200/45 p-3 text-sm leading-relaxed text-base-content/75"
            >
              <Icon name="kind-icon:question" class="kr-icon-4 mt-0.5 shrink-0 text-primary/60" />
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
//   - academy-timeline.vue: default props (close+remix shown), expanded gallery item
//   - academy-styles-browser.vue: default props (close+remix shown), grid detail panel
//   - academy-remix.vue: compact=true, showClose=false, showRemixButton=false,
//     allowMarkViewed=false — image-led read-only style summary beside Remix Studio
import { computed, onMounted } from 'vue'
import { useAcademyStore } from '@/stores/academyStore'
import type { AcademyArtist, AcademyStyle } from '@/stores/seeds/academyStyles'

const props = withDefaults(
  defineProps<{
    lesson: AcademyStyle
    showClose?: boolean
    showRemixButton?: boolean
    allowMarkViewed?: boolean
    compact?: boolean
  }>(),
  {
    showClose: true,
    showRemixButton: true,
    allowMarkViewed: true,
    compact: false,
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

// Accessibility (ai-art-academy/t-072 acceptance criterion 8): alt text must
// distinguish a self-portrait/photograph/sculpture of the artist from an
// artwork BY that artist, so screen-reader users don't mistake a likeness
// for an example of the style itself.
function artistPortraitAlt(artist: AcademyArtist): string {
  const portrait = artist.portrait
  if (!portrait) return ''
  const kindLabel: Record<typeof portrait.kind, string> = {
    'self-portrait': `Self-portrait of ${artist.name}`,
    portrait: `Portrait of ${artist.name} by ${portrait.artist}`,
    photograph: `Photograph of ${artist.name} by ${portrait.artist}`,
    sculpture: `Sculpted portrait of ${artist.name} by ${portrait.artist}`,
  }
  return `${kindLabel[portrait.kind]}, ${portrait.year}, ${portrait.collection}`
}

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
