<!-- /components/academy/academy-style-detail.vue -->
<template>
  <article
    class="mx-auto flex w-full flex-col gap-5"
    :class="compact ? 'max-w-none' : 'max-w-[1500px]'"
  >
    <section
      v-if="compact"
      class="kr-panel-flat overflow-hidden rounded-3xl shadow-sm"
    >
      <div v-if="lesson.previewImageSrc" class="relative aspect-[16/9] overflow-hidden bg-base-200">
        <img
          :src="lesson.previewImageSrc"
          :alt="`${lesson.name} visual style study`"
          class="h-full w-full object-cover"
        />
        <div class="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />
        <div class="absolute inset-x-0 bottom-0 p-4 text-white">
          <p class="text-lg font-black leading-tight">{{ lesson.name }}</p>
          <p class="mt-1 text-xs text-white/70">{{ lesson.era }} · {{ lesson.region }}</p>
        </div>
      </div>
      <div class="flex flex-col gap-3 p-4">
        <p class="line-clamp-4 text-sm leading-relaxed text-base-content/70">
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
            class="btn btn-ghost rounded-2xl border border-white/30 bg-black/20 text-white backdrop-blur hover:bg-white/10"
          >
            <Icon name="kind-icon:external-link" class="h-4 w-4" />
            Source artwork
          </a>
        </div>
      </div>
    </section>

    <section v-else class="kr-panel flex flex-col gap-4 p-6">
      <div class="flex flex-wrap items-center gap-2">
        <span class="badge badge-primary font-bold">{{ lesson.era }}</span>
        <span class="badge badge-ghost">{{ lesson.region }}</span>
      </div>
      <h3 class="text-3xl font-black">{{ lesson.name }}</h3>
      <p class="text-base leading-relaxed text-base-content/70">{{ lesson.keyIdeas }}</p>
    </section>

    <template v-if="!compact">
      <div class="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <section class="kr-panel flex flex-col gap-4 p-5 sm:p-6">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.18em] text-primary">How to see it</p>
            <h4 class="mt-1 text-xl font-black">Recognition cues</h4>
          </div>
          <ul class="grid gap-2 sm:grid-cols-2">
            <li
              v-for="cue in lesson.recognitionCues"
              :key="cue"
              class="flex gap-2 rounded-xl bg-base-200 p-3 text-sm leading-relaxed"
            >
              <Icon name="kind-icon:eye" class="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{{ cue }}</span>
            </li>
          </ul>
        </section>

        <section class="kr-panel flex flex-col gap-4 p-5 sm:p-6">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.18em] text-secondary">Why it changed</p>
            <h4 class="mt-1 text-xl font-black">Context</h4>
          </div>
          <p class="text-sm leading-relaxed text-base-content/75">{{ lesson.context }}</p>
        </section>
      </div>

      <section v-if="lesson.exampleWorks?.length" class="flex flex-col gap-4">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.18em] text-accent">Public-domain anchors</p>
          <h4 class="mt-1 text-xl font-black">Works to look at</h4>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <a
            v-for="work in lesson.exampleWorks"
            :key="work.sourceUrl"
            :href="work.sourceUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="group kr-panel-flat overflow-hidden rounded-3xl transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div class="aspect-[4/3] overflow-hidden bg-base-200">
              <img
                v-if="work.imageUrl"
                :src="work.imageUrl"
                :alt="work.title"
                class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                loading="lazy"
              />
              <div v-else class="grid h-full place-items-center text-base-content/25">
                <Icon name="kind-icon:image" class="h-10 w-10" />
              </div>
            </div>
            <div class="p-4">
              <p class="font-black">{{ work.title }}</p>
              <p class="mt-1 text-xs text-base-content/55">{{ work.artist }} · {{ work.year }}</p>
            </div>
          </a>
        </div>
      </section>
    </template>
  </article>
</template>

<script setup lang="ts">
import type { AcademyLesson } from '@/utils/academyCurriculum'

withDefaults(
  defineProps<{
    lesson: AcademyLesson
    compact?: boolean
    showClose?: boolean
    showRemixButton?: boolean
    isViewed?: boolean
  }>(),
  {
    compact: false,
    showClose: false,
    showRemixButton: true,
    isViewed: false,
  },
)

const emit = defineEmits<{
  close: []
  remix: [slug: string]
}>()
</script>
