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

onMounted(() => {
  academyStore.markLessonViewed(props.lesson.slug)
})
</script>
