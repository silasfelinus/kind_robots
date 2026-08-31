<!-- /components/academy/academy-timeline.vue -->
<template>
  <section class="kr-container max-w-[1600px] flex flex-col gap-5">
    <header
      class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,30rem),1fr))] overflow-hidden kr-panel-flat rounded-3xl shadow-sm"
    >
      <div class="flex flex-col justify-center gap-4 p-5 sm:p-7">
        <div class="flex items-center gap-2 text-primary">
          <Icon name="kind-icon:map" class="h-5 w-5" aria-hidden="true" />
          <span class="text-xs font-black uppercase tracking-[0.18em]">
            Art history, room by room
          </span>
        </div>
        <div class="max-w-2xl">
          <h2 class="text-2xl font-black leading-tight text-base-content sm:text-3xl">
            The Art History Timeline
          </h2>
          <p class="mt-2 text-sm leading-relaxed text-base-content/70 sm:text-base">
            Start with the pictures. Move through thirty-three centuries of style,
            open whatever catches your eye, then turn what you learn into a remix.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span class="badge badge-primary badge-outline">
            {{ academyStore.lessonsViewedCount }}/{{ academyStore.timeline.length }} explored
          </span>
          <span class="badge badge-secondary badge-outline">
            {{ academyStore.stylesRemixedCount }} styles remixed
          </span>
        </div>
      </div>

      <div
        class="grid min-h-52 grid-cols-3 border-t border-base-300 bg-base-200 lg:min-h-64 lg:border-l lg:border-t-0"
        aria-hidden="true"
      >
        <div
          v-for="(style, index) in heroStyles"
          :key="style.slug"
          class="relative overflow-hidden"
          :class="index === 1 ? 'border-x border-base-300' : ''"
        >
          <img
            v-if="style.previewImageSrc"
            :src="style.previewImageSrc"
            alt=""
            class="h-full w-full object-cover"
            :class="index === 1 ? 'scale-110' : ''"
          />
          <div v-else class="flex h-full items-center justify-center bg-base-200">
            <Icon name="kind-icon:gallery" class="h-10 w-10 text-base-content/20" />
          </div>
          <div class="absolute inset-0 bg-linear-to-t from-base-content/65 via-transparent to-transparent" />
          <p
            class="absolute inset-x-2 bottom-2 line-clamp-2 text-xs font-black leading-tight text-base-100 drop-shadow"
          >
            {{ style.name }}
          </p>
        </div>
      </div>
    </header>

    <div class="flex flex-wrap items-end justify-between gap-3 px-1">
      <div>
        <p class="text-xs font-black uppercase tracking-[0.16em] text-base-content/45">
          Chronological gallery
        </p>
        <p class="mt-1 text-sm text-base-content/65">
          Each image opens into a lesson, gallery wall, and remix path.
        </p>
      </div>
      <p class="text-xs font-semibold text-base-content/45">Earliest → latest</p>
    </div>

    <ol
      class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-4"
      aria-label="Art history timeline lessons"
    >
      <li
        v-for="(style, index) in academyStore.timeline"
        :key="style.slug"
        class="min-w-0"
        :class="expandedSlug === style.slug ? 'col-span-full' : ''"
      >
        <button
          v-if="expandedSlug !== style.slug"
          :ref="(el) => setToggleRef(style.slug, el)"
          type="button"
          class="group flex h-full w-full flex-col overflow-hidden kr-panel-flat rounded-3xl text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-expanded="false"
          :aria-controls="`academy-style-detail-${style.slug}`"
          @click="expandedSlug = style.slug"
        >
          <div class="relative w-full overflow-hidden bg-base-200" :class="timelineImageAspect(index)">
            <img
              v-if="style.previewImageSrc"
              :src="style.previewImageSrc"
              alt=""
              loading="lazy"
              class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div v-else class="flex h-full items-center justify-center bg-base-200">
              <Icon name="kind-icon:gallery" class="h-12 w-12 text-base-content/20" />
            </div>
            <div class="absolute inset-0 bg-linear-to-t from-base-content/70 via-transparent to-transparent" />
            <span
              class="absolute bottom-3 left-3 rounded-full bg-base-100/90 px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-wider text-base-content shadow-sm backdrop-blur"
            >
              {{ style.period }}
            </span>
          </div>

          <div class="flex flex-1 flex-col p-4">
            <h3 class="text-lg font-black leading-tight text-base-content">
              {{ style.name }}
            </h3>
            <p class="mt-1 line-clamp-2 text-sm leading-relaxed text-base-content/60">
              {{ style.summary }}
            </p>
            <div class="mt-auto flex items-center justify-between gap-2 pt-4">
              <span class="text-xs font-bold text-primary">Open lesson</span>
              <Icon name="kind-icon:arrow-right" class="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </button>

        <article
          v-else
          :id="`academy-style-detail-${style.slug}`"
          class="kr-panel-flat overflow-hidden rounded-3xl shadow-lg"
        >
          <div class="flex items-center justify-between gap-3 border-b border-base-300 p-4 sm:p-5">
            <div class="min-w-0">
              <p class="text-xs font-black uppercase tracking-[0.16em] text-primary">
                {{ style.period }}
              </p>
              <h3 class="truncate text-xl font-black sm:text-2xl">{{ style.name }}</h3>
            </div>
            <button
              type="button"
              class="btn btn-ghost btn-sm rounded-xl"
              :aria-controls="`academy-style-detail-${style.slug}`"
              aria-expanded="true"
              @click="collapse(style.slug)"
            >
              <Icon name="kind-icon:x" class="size-4" />
              Close
            </button>
          </div>
          <academy-style-detail :style="style" />
        </article>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import { computed, nextTick, ref } from 'vue'
import { useAcademyStore } from '@/stores/academyStore'

const academyStore = useAcademyStore()
const expandedSlug = ref<string | null>(null)
const toggleRefs = new Map<string, HTMLElement>()

const heroStyles = computed(() => {
  const timeline = academyStore.timeline.filter((style) => style.previewImageSrc)
  if (timeline.length <= 3) return timeline
  return [timeline[0], timeline[Math.floor(timeline.length / 2)], timeline[timeline.length - 1]].filter(Boolean)
})

function timelineImageAspect(index: number) {
  return index % 5 === 0 ? 'aspect-[4/3]' : index % 3 === 0 ? 'aspect-[3/2]' : 'aspect-[16/10]'
}

function setToggleRef(slug: string, el: Element | ComponentPublicInstance | null) {
  if (el instanceof HTMLElement) toggleRefs.set(slug, el)
  else toggleRefs.delete(slug)
}

async function collapse(slug: string) {
  expandedSlug.value = null
  await nextTick()
  toggleRefs.get(slug)?.focus()
}
</script>
